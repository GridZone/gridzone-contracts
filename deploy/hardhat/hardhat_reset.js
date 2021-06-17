const { network } = require("hardhat");
require("dotenv").config();

module.exports = async () => {
  await network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: {
          jsonRpcUrl: process.env.ALCHEMY_URL_MAINNET,
          blockNumber: 12556695,
        },
      },
    ],
  });
};
module.exports.tags = ["hardhat_reset"];
