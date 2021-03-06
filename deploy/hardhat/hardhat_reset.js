const { network } = require("hardhat");
require("dotenv").config();

const isPolygon = (process.env.BLOCKCHAIN === 'polygon') ? true : false;
const mainnetUrl = isPolygon ? process.env.ALCHEMY_URL_POLYGON_MAINNET : process.env.ALCHEMY_URL_MAINNET;
const mainnetBlockNumber = isPolygon ? 23458500 : 13440400;

module.exports = async () => {
  await network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: {
          jsonRpcUrl: mainnetUrl,
          blockNumber: mainnetBlockNumber,
        },
      },
    ],
  });
};
module.exports.tags = ["hardhat_reset"];
