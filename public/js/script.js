let contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
let abi = null;
let bankContract = null;

let content = document.getElementById("content");
let connectBtn = document.getElementById("connect-btn");
let address = document.getElementById("account");
let accountName = document.getElementById("account-name");
let accountBalance = document.getElementById("balance");
let reciever = document.getElementById("reciever");
let amount = document.getElementById("amount");
let confirmTransferBtn = document.getElementById("confirm-transfer-btn");
let nameInput = document.getElementById('input-name');
let confirmNameButton = document.getElementById("confirm-name-btn");

confirmTransferBtn.addEventListener("click", () => transfer());
confirmNameButton.addEventListener('click', () => updateName());

let isConnected = false;


if (!isConnected) {
    hideContent();
    fetchABI();
    tryConnection();

} else {
    displayError("Connect To MetaMask", true);
}

function tryConnection() {
    if (window.ethereum && window.ethereum.isMetaMask) {
        isConnected = true;
        connectBtn.addEventListener("click", () => connectWallet());
    } else {
        displayError("Please install MetaMask!", true);
    }
}

async function connectWallet() {
    try {
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        bankContract = getBankContract();
        updateContent(accounts[0]);
    } catch(error) {
        displayError("Could not connect to MetaMask", true, error)
    }
}

function getBankContract() {
    if (window.ethereum && window.ethereum.isMetaMask) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);
        return contract;
    }

}

async function updateContent(account) {
    address.innerHTML = account;
    try {
        let balance = await bankContract.getBalance();
        let name = await bankContract.getAccountName();
        accountBalance.innerHTML = ethers.utils.formatEther(balance);
        accountName.innerHTML = name || "User";
        displayContent();
    }
    catch (error) {
        displayError("Cannot access contract, try later!", true, error);
    }
}

function displayError(message=null, show, error=null) {
    console.log(error || message);
    isConnected = false;
    content.innerHTML = show
        ? message : "Something went wrong try again later!.";
    displayContent();
}

function displayContent() {
    content.classList.remove("hide");
    connectBtn.classList.add("disable");
    connectBtn.innerHTML = "Connected";
    connectBtn.disabled = true;
    if (window.ethereum) {
        window.ethereum.on('transactionHash', (hash) => {
            updateContent(address.innerText);
          });
        window.ethereum.on('accountsChanged', (accounts) => {
            window.location.reload();
          });
        window.ethereum.on('chainChanged', (chainId) => {
            window.location.reload();
        });
    }
}

function hideContent() {
    content.classList.add("hide");
    connectBtn.classList.remove("disable");
    connectBtn.innerHTML = "Connect your Wallet";
    connectBtn.disabled = false;

}

function fetchABI() {
    fetch("http://localhost:3000/artifacts/contracts/Bank.sol/Bank.json")
        .then((response) => response.json())
        .then((data) => {
            abi = data.abi;
        })
        .catch((error) => {
            displayError("Cannot fetch ABI", false, error);
        });
}

async function transfer() {
    let receiverAddress = reciever.value.trim();
    let amountValue = ethers.utils.parseEther(amount.value.trim());
  
    if (receiverAddress && amountValue) {
      try {
        const contract = getBankContract(); 
        const tx = await contract.transferFunds(receiverAddress, { value: amountValue });
        console.log(tx);
        contract.on("Transfer", (value) => {
            updateContent(address.innerText);
            console.log("Tx sucessful with amount : ",value);
        });
        

      } catch (error) {
        displayError("Cannot transfer", true, error);
      }
    } else {
      displayError("Please fill all fields", true);
    }
    hideModal();
}

async function updateName() {
    let newName = nameInput.value.trim();
    if (newName && newName.length) {
        try {
            const contract = getBankContract();
            await contract.setAccountName(newName);
            contract.on("NameUpdate", (value) => {
                updateContent(address.innerText);
            })
            
        }
        catch (error) {
            displayError("New name is same as old name! Kindly Refresh", true, error)
        }
    } else {
        displayError("Please Enter a name", true);
    }
    hideModal();
}

function hideModal() {
    document.getElementById('closeTransfer').click();
    document.getElementById('closeName').click();
}

if (window.ethereum) {
    window.ethereum.on('transactionHash', (hash) => {
        updateContent(address.innerText);
      });
    window.ethereum.on('accountsChanged', (accounts) => {
        window.location.reload();
      });
    window.ethereum.on('chainChanged', (chainId) => {
        window.location.reload();
    });
}