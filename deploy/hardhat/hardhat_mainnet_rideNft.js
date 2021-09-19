const { network } = require("hardhat");
const { mainnet: network_ } = require("../../parameters");

module.exports = async () => {

  await network.provider.request({method: "hardhat_impersonateAccount", params: [network_.Global.ownerAddress]});
  await network.provider.request({method: "hardhat_impersonateAccount", params: [network_.ZONE.vaultAddress]});
};

module.exports.tags = ["hardhat_mainnet_rideNft"];
module.exports.dependencies = [
  "hardhat_reset",
  "mainnet_NymLibUpgradeable",
  "mainnet_PriceOracleUpgradeable",
  "mainnet_RideNft",
];
