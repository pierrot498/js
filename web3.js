var accountID, networkId, web3, NFT_QNT, isPresaleActive, contract, nftPrice, totalSupply;

var contractAddress = "0x7aa48e3212f56c388b35281e4f205418d1db3d68"; //mainnet updated contract

var nftPriceInEthGb = 0.0;
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
$(function () {

  try {

    // Mint Handling
    var buyButton = document.getElementById("buyBtn");
    buyButton.addEventListener("click", handleBuy);
    
    // Create Web3 Provider
    web3 = new Web3(Web3.givenProvider);
    
    // If Metamask is not installed
    if (typeof ethereum === "undefined") {
      console.log("Please install MetaMask extension!");
      alert("Please install Metamask");
    } else {

      // Account Changed Event Handling
      window.ethereum.on("accountsChanged", function (accounts) {
        $.cookie("MetaMask", "");
        $(".connect-btn").html("CONNECT WALLET");
        console.log("Account Changed")
      });

      // Connect Button Callback, Just logs
      window.ethereum.on("connect", function (accounts) {
        console.log("connect")
      });

      // on Network ID change
      window.ethereum.on("chainChanged", function (networkId) {
        $.cookie("MetaMask", "");
        window.location.reload(true);
      });

      // Click to Metamask Connect
      $(document).on("click", "#connectServer", function (e) {       
        e.preventDefault();
        getAccount();
      }).on("click", ".nft-item", function(e){
        e.preventDefault();
        NFT_QNT = parseInt($(this).data('nft'));
      });
      
      // Page Reload Handling
      if ( typeof $.cookie("MetaMask") !== "undefined" && $.cookie("MetaMask") == "true" ) {
        getAccount();
      }

      // Get Account from Metamask
      async function getAccount() {
          const accounts = await ethereum.request({
            method: "eth_requestAccounts",
          }).catch((err) => {
            alert(err.message);
          });

          accountID = accounts[0];          
          // Get Current Blockchain
          await web3.eth.net.getId().then(function (id) {
            networkId = id;
          });
          
          if (networkId == 1) {
            $(".connect-btn").html( accountID.substring(1, 9) + "..." + accountID.substring(accountID.length - 6));
            await web3.eth.getBalance(accountID).then(function (balance) {
                accountBalance = balance;
            });
            $.cookie("MetaMask", "true");
            web3.eth.defaultAccount = accountID;
            connectContract(accountID);
          } else {
            alert("Please change your network to Ethereum Mainnet!");
          }
        }

    }
      
    // Smart Contract Connection
    async function connectContract(accountID) {

      contract = new web3.eth.Contract(abi, contractAddress);
      var max_nft = parseInt(await contract.methods.MAX_NFT_PUBLIC().call())+180;
      console.log("max_nft",max_nft)
      totalSupply = parseInt(await contract.methods.totalSupply().call())+180;
      console.log("totalSupply",totalSupply)
      var buyLimit = await contract.methods.BUY_LIMIT_PER_TX().call();
      var isActive = await contract.methods.isActive().call();
      console.log("buyLimit",buyLimit)
      isPresaleActive = await contract.methods.isPresaleActive().call();
      console.log("isPresaleActive",isPresaleActive)
      console.log("isActive",isActive)
      if (isPresaleActive == true) {
        document.getElementById("heading").title = "PRESALE IS OPEN";
        document.getElementById("heading").innerHTML = "PRESALE IS OPEN";
      }
      if (isPresaleActive == false && isActive==false) {
        document.getElementById("heading").title = "SALE NOT OPEN";
        document.getElementById("heading").innerHTML = "SALE NOT OPEN";
        document.getElementById("buyBtn").style.display="none"
        
      }
      
      var progress = (totalSupply * 100) / max_nft;
      var progress2 = progress.toFixed(2);
    
      nftPrice = await contract.methods.NFTPrice().call();
      
      var nftPriceInEth = await web3.utils.fromWei(nftPrice, "ether");

      nftPriceInEthGb = nftPriceInEth;
      
      while(true){
       
        progress = (totalSupply * 100) / max_nft;
        progress2 = progress.toFixed(2);
        document.getElementById("file").value = progress2;
        document.getElementById("progressPercent").innerHTML = progress2 + "%";
        document.getElementById("max_nft").innerHTML = totalSupply + " / "+max_nft; //+ max_nft ;
        await sleep(2000);
        totalSupply = parseInt(await contract.methods.totalSupply().call())+180;
      }
    }

    //Minting Functionality
    async function handleBuy(e) {
      e.preventDefault();

      if ( typeof $.cookie("MetaMask") !== "undefined" && $.cookie("MetaMask") == "true" ){

        const isActive = await contract.methods.isActive().call();
        console.log("isActive : ",isActive)
        console.log("isPresaleActive : ",isPresaleActive)
        if (isActive == true) {

          if (isPresaleActive == true) {

            const whiteListMaxMint = await contract.methods.WHITELIST_MAX_MINT().call();
            console.log("whiteListMaxMint : ",whiteListMaxMint)
            var noOfTokens = NFT_QNT;
            console.log("nftPrice : ",nftPrice)
            var value1 = parseInt(nftPrice);

            if (noOfTokens < 1 || noOfTokens == undefined) {
              alert("Select at least 1 NFT!");
            } else if (noOfTokens > whiteListMaxMint) {
              alert("Buy limit for presale is : " + whiteListMaxMint);
            } else if (totalSupply >= max_nft) {
              alert("Sold out!");
            } else {
              await contract.methods.mintNFTDuringPresale(noOfTokens).send({ from: accountID, value: value1 * noOfTokens })
              .on("receipt", function (res) {
                alert("Transaction successful");
                location.reload();
              }).on("error", function (err) {
                alert("Transaction Error");
              });
            }

          } else {

            var noOfTokens = NFT_QNT;
            console.log("nftPrice : ",nftPrice)
            var value1 = parseInt(nftPrice);
      
            if (noOfTokens < 1 || noOfTokens == undefined) {
              alert("Select at least 1 NFT!");
            } else if (totalSupply >= max_nft) {
              alert("Sold out!");
            } else {
              await contract.methods.mintNFT(noOfTokens).send({ from: accountID, value: value1 * noOfTokens })
              .on("receipt", function (res) {
                alert("Transaction successful");
                location.reload();
              }).on("error", function (err) {
                alert("Transaction Error");
              });
            }

          }

        } else {
          alert("Sale is not active yet!");
        }

      }else{
        alert("Connect wallet first!");
      }

    }

  } catch (err) {
    console.log("Error:", err.message);
  }

});

