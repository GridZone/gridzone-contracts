require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require('@nomiclabs/hardhat-ethers');
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("hardhat-gas-reporter");
require('hardhat-contract-sizer');
require("dotenv").config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const isPolygon = (process.env.BLOCKCHAIN === 'polygon') ? true : false;
const apiKey = isPolygon ? process.env.POLYGONSCAN_API_KEY : process.env.ETHERSCAN_API_KEY;
const mainnetUrl = isPolygon ? process.env.ALCHEMY_URL_POLYGON_MAINNET : process.env.ALCHEMY_URL_MAINNET;
const mainnetBlockNumber = isPolygon ? 17560298 : 13406300;

module.exports = {
  solidity: {
    compilers: [{
      version: "0.7.6",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }],
  },
  networks: {
    hardhat: {
      forking: {
        url: mainnetUrl,
        blockNumber: mainnetBlockNumber,
      },
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY]
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY]
    },
    polygonMainnet: {
      url: `https://rpc-mainnet.maticvigil.com/`,
      accounts: [process.env.PRIVATE_KEY]
    },
    polygonMumbai: {
      url: `https://rpc-mumbai.maticvigil.com`,
      accounts: [process.env.PRIVATE_KEY]
    },
  },
  etherscan: {
    apiKey: apiKey
  },
  gasReporter: {
    enabled: true
  },
  mocha: {
    timeout: 50000
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: false,
    strict: true,
  }
};
