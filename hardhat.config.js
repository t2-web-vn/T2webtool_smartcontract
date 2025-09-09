require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.10",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      gasPrice: 875000000,
    },
    // mumbai: {
    //   url: process.env.MUMBAI_NODE_URL || "https://rpc-mumbai.matic.today",
    //   accounts:
    //     process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    // },
    // polygon: {
    //   url: process.env.RPC_POLYGON_URL || "https://polygon-rpc.com",
    //   gasPrice: 45000000000,
    //   accounts:
    //     process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    // },
    // bsc: {
    //   url: process.env.BSC_NODE_URL,
    //   accounts:
    //     process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    // },
    // shibuya: {
    //   url: process.env.ASTAR_NODE_URL,
    //   accounts:
    //     process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    // },
    // goerli: {
    //   url: process.env.GOERLI_NODE_URL,
    //   accounts:
    //     process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    // },
    sandverse: {
      url: process.env.SAND_VERSE_NODE_URL,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    // mchverse: {
    //   url: process.env.MCH_VERSE_NODE_URL,
    //   accounts:
    //     process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    // },
    defiverse: {
      // url: "https://rpc-testnet.defi-verse.org/",
      url: "https://rpc.defi-verse.org/",
      accounts: [process.env.PRIVATE_KEY],
    },
    amoy: {
      url: "https://polygon-amoy.infura.io/v3/e303991ca58e45a1b44c8d5eee3634cd/",
      accounts: [process.env.PRIVATE_KEY],
    },
    'oasys-testnet': {
      url: process.env.OASYS_TESTNET_NODE_URL,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: {
      "defiverse": "no key",
    },
    customChains: [
      {
        network: "defiverse",
        chainId: 16116,
        urls: {
          apiURL: "https://scan.defi-verse.org/api",
          browserURL: "https://scan.defi-verse.org",
        },
      },
    ],
  },
};
