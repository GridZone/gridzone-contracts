const { network } = require("hardhat");
const { mainnet: network_ } = require("../../parameters");

module.exports = async () => {

  await network.provider.request({method: "hardhat_impersonateAccount", params: [network_.Global.ownerAddress]});
  await network.provider.request({method: "hardhat_impersonateAccount", params: [network_.ZONE.vaultAddress]});
  await network.provider.request({method: "hardhat_impersonateAccount", params: [network_.GenesisSaleRewardAirdrop.adminAddress]});
};

module.exports.tags = ["hardhat_mainnet"];
module.exports.dependencies = [
  "hardhat_reset",
  "mainnet"
];
