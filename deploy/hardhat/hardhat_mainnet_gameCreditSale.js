const { network } = require("hardhat");
const { mainnet: network_ } = require("../../parameters");

module.exports = async () => {

  await network.provider.request({method: "hardhat_impersonateAccount", params: [network_.Global.ownerAddress]});
};

module.exports.tags = ["hardhat_mainnet_gameCreditSale"];
module.exports.dependencies = [
  "hardhat_reset",
  "mainnet_GameCreditSale",
];
