const hre = require("hardhat");
const deployUtils = require("./deploy.utils");

const DEFAULT_CONFIG = {
  ERC721: "",
  ERC1125: "",
  ERC4907: "",
};

async function main() {
  let envName = await deployUtils.promptChoices("Choose environment", [
    "local",
    "dev",
    "prod",
  ]);
  let networkName = hre.network.name;
  let suffixConfig = `${envName}`;
  let deployConfig = deployUtils.loadConfig(
    networkName,
    DEFAULT_CONFIG,
    suffixConfig
  );

  // Choose which NFT contract to use
  const contractType = await deployUtils.promptChoices("Choose NFT contract type", [
    "ERC721 (T2WebNFT)",
    "ERC1125 (T2WebMultiNFT)",
    "ERC4907 (T2WebERC4907NFT)"
  ]);

  let contractAddress;
  let contractName;

  switch (contractType) {
    case "ERC721 (T2WebNFT)":
      contractAddress = deployConfig.ERC721;
      contractName = "T2WebNFT";
      break;
    case "ERC1125 (T2WebMultiNFT)":
      contractAddress = deployConfig.ERC1125;
      contractName = "T2WebMultiNFT";
      break;
    case "ERC4907 (T2WebERC4907NFT)":
      contractAddress = deployConfig.ERC4907;
      contractName = "T2WebERC4907NFT";
      break;
  }

  if (!contractAddress) {
    console.error(`${contractName} contract not deployed on ${networkName}-${suffixConfig}`);
    return;
  }

  console.log(`Using ${contractName} contract at: ${contractAddress}`);

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  console.log(`Executing from: ${signer.address}`);

  // Get recipient address
  const recipientAddress = await deployUtils.prompt("Enter recipient address");

  // Validate recipient address
  if (!hre.ethers.utils.isAddress(recipientAddress)) {
    console.error("Invalid recipient address");
    return;
  }

  // Get token URI
  const tokenURI = await deployUtils.prompt("Enter token URI (metadata URL)");

  // Get NFT contract
  const nftContract = await hre.ethers.getContractAt(contractName, contractAddress, signer);

  console.log(`Minting NFT to: ${recipientAddress}`);
  console.log(`Token URI: ${tokenURI}`);

  // Mint the NFT
  console.log("Minting NFT...");
  const mintTx = await nftContract.mintItem(recipientAddress, tokenURI);
  await mintTx.wait();

  console.log("NFT minted successfully!");
  console.log(`Transaction hash: ${mintTx.hash}`);

  // Get the token ID (if the contract supports it)
  try {
    const currentId = await nftContract.currentId();
    console.log(`Current token ID: ${currentId}`);
  } catch (error) {
    // Some contracts might not have currentId function
    console.log("Token minted successfully (ID not available)");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
