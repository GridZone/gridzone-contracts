const { deployments } = require("hardhat");

module.exports = async () => {
  const proxyAdmin = await deployments.get("ProxyAdmin");
  const biconomyMetaTxRelayUpgradeableProxy = await deployments.get("BiconomyMetaTxRelayUpgradeableProxy");
  const rideNftFactory = await ethers.getContract("RideNftFactory");
  const nymFashionNftFactory = await ethers.getContract("NymFashionNftFactory");

  console.log("");
  console.log("Summary on Polygon Mumbai:");
  console.log("    ProxyAdmin address: ", proxyAdmin.address);
  console.log("    BiconomyMetaTxRelayUpgradeableProxy address: ", biconomyMetaTxRelayUpgradeableProxy.address);
  console.log("    RideNftFactory address: ", rideNftFactory.address);
  console.log("    NymFashionNftFactory address: ", nymFashionNftFactory.address);
  console.log("");
};
module.exports.tags = ["polygonMumbai"];
module.exports.dependencies = [
  "polygonMumbai_ProxyAdmin_deploy",
  "polygonMumbai_BiconomyMetaTxRelayUpgradeable_deploy",
  "polygonMumbai_RideNft_deploy",
  "polygonMumbai_NymFashionNft_deploy",
  "polygonMumbai_ProxyAdmin_verify",
  "polygonMumbai_BiconomyMetaTxRelayUpgradeable_verify",
  "polygonMumbai_RideNft_verify",
  "polygonMumbai_NymFashionNft_verify",
];
