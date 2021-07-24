const { deployments } = require("hardhat");

module.exports = async () => {
  const proxyAdmin = await deployments.get("ProxyAdmin");
  const biconomyMetaTxRelayUpgradeableProxy = await deployments.get("BiconomyMetaTxRelayUpgradeableProxy");
  const rideUpgradeableFactory = await ethers.getContract("RideUpgradeableFactory");

  console.log("");
  console.log("Summary on Polygon Mainnet:");
  console.log("    ProxyAdmin address: ", proxyAdmin.address);
  console.log("    BiconomyMetaTxRelayUpgradeableProxy address: ", biconomyMetaTxRelayUpgradeableProxy.address);
  console.log("    RideUpgradeableFactory address: ", rideUpgradeableFactory.address);
  console.log("");
};
module.exports.tags = ["polygonMainnet"];
module.exports.dependencies = [
  "polygonMainnet_ProxyAdmin_deploy",
  "polygonMainnet_BiconomyMetaTxRelayUpgradeable_deploy",
  "polygonMainnet_RideUpgradeable_deploy",
  "polygonMainnet_ProxyAdmin_verify",
  "polygonMainnet_BiconomyMetaTxRelayUpgradeable_verify",
  "polygonMainnet_RideUpgradeable_verify",
];
