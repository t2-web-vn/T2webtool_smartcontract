const hre = require("hardhat");
const deployUtils = require("./deploy.utils");

const DEFAULT_CONFIG = {
  T2WebNFT: "",
  T2WebMultiNFT: "",
  T2WebERC4907NFT: "",
  Disperse: "",
  ProxyAdmin: "",
  T2WebProjectManagerLogic: "",
  T2WebProjectManagerProxy: "",
  OPERATOR: "",
  SIGNER: "",
  FEE_RECEIVER: "",
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
  const BASE_URI = process.env.BASE_URI;
  deployConfig.OPERATOR = "0xf9209B6F49BB9fD73422BA834f4cD444aE7ceacE";
  deployConfig.SIGNER = "0xf9209B6F49BB9fD73422BA834f4cD444aE7ceacE";
  deployConfig.FEE_RECEIVER = "0xf27527E01508645d79D26324f72A516778838c26";

  const deployProxyAdmin = await deployUtils.deployContractIfNotExist(
    "T2WebProxyAdmin",
    deployConfig.ProxyAdmin
  );
  deployConfig.ProxyAdmin = deployProxyAdmin.address;

  // T2WebProjectManager
  const deployT2WebProjectManagerLogic = await deployUtils.deployContractIfNotExist(
    "T2WebProjectManager",
    deployConfig.T2WebProjectManagerLogic,
    []
  );
  deployConfig.T2WebProjectManagerLogic = deployT2WebProjectManagerLogic.address;

  const deployT2WebProjectManagerProxy =
    await deployUtils.deployContractIfNotExist(
      "T2WebProxy",
      deployConfig.T2WebProjectManagerProxy,
      [deployConfig.T2WebProjectManagerLogic, deployProxyAdmin.address, []]
    );
  deployConfig.T2WebProjectManagerProxy =
    deployT2WebProjectManagerProxy.address;
  console.log(
    "deployConfig.T2WebProjectManagerProxy :>> ",
    deployConfig.T2WebProjectManagerProxy
  );

  // Upgrade logic
  if (deployT2WebProjectManagerProxy.isNewDeployed) {
    // Initialize
    let logicContract = await hre.ethers.getContractAt(
      "T2WebProjectManager",
      deployT2WebProjectManagerProxy.address
    );
    let tx = await logicContract.initialize(
      deployConfig.FEE_RECEIVER,
      deployConfig.SIGNER
    );
    await tx.wait();
  } else if (deployT2WebProjectManagerLogic.isNewDeployed) {
    console.log("Upgrade logic", deployConfig);
    let proxyAdminContract = await hre.ethers.getContractAt(
      "T2WebProxyAdmin",
      deployConfig.ProxyAdmin
    );
    let tx = await proxyAdminContract.upgrade(
      deployConfig.T2WebProjectManagerProxy,
      deployConfig.T2WebProjectManagerLogic
    );
    await tx.wait();
  }

  const deployERC721 = await deployUtils.deployContractIfNotExist(
    "T2WebNFT",
    deployConfig.ERC721,
    ["T2WEB NFT", "T2WEB", BASE_URI]
  );
  deployConfig.ERC721 = deployERC721.address;

  const deployERC1125 = await deployUtils.deployContractIfNotExist(
    "T2WebMultiNFT",
    deployConfig.ERC1125,
    [BASE_URI, ""]
  );
  deployConfig.ERC1125 = deployERC1125.address;

  const deployERC4907 = await deployUtils.deployContractIfNotExist(
    "T2WebERC4907NFT",
    deployConfig.ERC4907,
    ["T2WEB NFT", "T2WEB", BASE_URI]
  );
  deployConfig.ERC4907 = deployERC4907.address;

  const deployDisperse = await deployUtils.deployContractIfNotExist(
    "Disperse",
    deployConfig.Disperse
  );
  deployConfig.Disperse = deployDisperse.address;

  // Write config
  deployUtils.writeConfig(networkName, deployConfig, suffixConfig);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
