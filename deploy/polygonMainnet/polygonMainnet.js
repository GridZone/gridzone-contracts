const { deployments } = require("hardhat");

module.exports = async () => {
  const proxyAdmin = await deployments.get("ProxyAdmin");
  const biconomyMetaTxRelayUpgradeableProxy = await deployments.get("BiconomyMetaTxRelayUpgradeableProxy");
  const rideNftFactory = await ethers.getContract("RideNftFactory");
  const nymFashionNftFactory = await ethers.getContract("NymFashionNftFactory");

  console.log("");
  console.log("Summary on Polygon Mainnet:");
  console.log("    ProxyAdmin address: ", proxyAdmin.address);
  console.log("    BiconomyMetaTxRelayUpgradeableProxy address: ", biconomyMetaTxRelayUpgradeableProxy.address);
  console.log("    RideNftFactory address: ", rideNftFactory.address);
  console.log("    NymFashionNftFactory address: ", nymFashionNftFactory.address);
  console.log("");
};
module.exports.tags = ["polygonMainnet"];
module.exports.dependencies = [
  "polygonMainnet_ProxyAdmin_deploy",
  "polygonMainnet_BiconomyMetaTxRelayUpgradeable_deploy",
  "polygonMainnet_RideNft_deploy",
  "polygonMainnet_NymFashionNft_deploy",
  "polygonMainnet_ProxyAdmin_verify",
  "polygonMainnet_BiconomyMetaTxRelayUpgradeable_verify",
  "polygonMainnet_RideNft_verify",
  "polygonMainnet_NymFashionNft_verify",
];
