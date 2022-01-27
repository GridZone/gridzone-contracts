const { network } = require("hardhat");
const { polygonMainnet: network_ } = require("../../parameters");

module.exports = async () => {

  await network.provider.request({method: "hardhat_impersonateAccount", params: [network_.Global.ownerAddress]});
  await network.provider.request({method: "hardhat_impersonateAccount", params: [network_.ZONE.vaultAddress]});
};

module.exports.tags = ["hardhat_polygonMainnet_GZRewards"];
module.exports.dependencies = [
  "hardhat_reset",
  "polygonMainnet_GZRewardsUpgradeable",
];
