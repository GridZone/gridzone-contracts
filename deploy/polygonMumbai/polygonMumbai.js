const { deployments } = require("hardhat");

module.exports = async () => {
  const proxyAdmin = await deployments.get("ProxyAdmin");
  const biconomyMetaTxRelayUpgradeableProxy = await deployments.get("BiconomyMetaTxRelayUpgradeableProxy");
  const rideUpgradeableFactory = await ethers.getContract("RideUpgradeableFactory");

  console.log("");
  console.log("Summary on Polygon Mumbai:");
  console.log("    ProxyAdmin address: ", proxyAdmin.address);
  console.log("    BiconomyMetaTxRelayUpgradeableProxy address: ", biconomyMetaTxRelayUpgradeableProxy.address);
  console.log("    RideUpgradeableFactory address: ", rideUpgradeableFactory.address);
  console.log("");
};
module.exports.tags = ["polygonMumbai"];
module.exports.dependencies = [
  "polygonMumbai_ProxyAdmin_deploy",
  "polygonMumbai_BiconomyMetaTxRelayUpgradeable_deploy",
  "polygonMumbai_RideUpgradeable_deploy",
  "polygonMumbai_ProxyAdmin_verify",
  "polygonMumbai_BiconomyMetaTxRelayUpgradeable_verify",
  "polygonMumbai_RideUpgradeable_verify",
];
