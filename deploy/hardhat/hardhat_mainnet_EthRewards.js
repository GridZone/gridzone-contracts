const { network } = require("hardhat");
const { mainnet: network_ } = require("../../parameters");

module.exports = async () => {

  await network.provider.request({method: "hardhat_impersonateAccount", params: [network_.Global.ownerAddress]});
  await network.provider.request({method: "hardhat_impersonateAccount", params: [network_.Airdrop.adminAddress]});
};

module.exports.tags = ["hardhat_mainnet_EthRewards"];
module.exports.dependencies = [
  "hardhat_reset",
  "mainnet_EthRewards",
];
