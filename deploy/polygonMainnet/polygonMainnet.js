const { deployments } = require("hardhat");

module.exports = async () => {
  const proxyAdmin = await ethers.getContract("ProxyAdmin");
  const nymLibUpgradeableProxy = await ethers.getContract("NymLibUpgradeableProxy");
  const priceOracleUpgradeableProxy = await ethers.getContract("PriceOracleUpgradeableProxy");
  const biconomyMetaTxRelayUpgradeableProxy = await ethers.getContract("BiconomyMetaTxRelayUpgradeableProxy");
  const nymFashionNftFactory = await ethers.getContract("NymFashionNftFactory");

  console.log("");
  console.log("Summary on Polygon Mainnet:");
  console.log("    ProxyAdmin address: ", proxyAdmin.address);
  console.log("    NymLibUpgradeableProxy address: ", nymLibUpgradeableProxy.address);
  console.log("    PriceOracleUpgradeableProxy address: ", priceOracleUpgradeableProxy.address);
  console.log("    BiconomyMetaTxRelayUpgradeableProxy address: ", biconomyMetaTxRelayUpgradeableProxy.address);
  console.log("    NymFashionNftFactory address: ", nymFashionNftFactory.address);
  console.log("");
};
module.exports.tags = ["polygonMainnet"];
module.exports.dependencies = [
  "polygonMainnet_ProxyAdmin_deploy",
  "polygonMainnet_NymLibUpgradeable_deploy",
  "polygonMainnet_PriceOracleUpgradeable_deploy",
  "polygonMainnet_BiconomyMetaTxRelayUpgradeable_deploy",
  "polygonMainnet_NymFashionNft_deploy",
  "polygonMainnet_ProxyAdmin_verify",
  "polygonMainnet_NymLibUpgradeable_verify",
  "polygonMainnet_PriceOracleUpgradeable_verify",
  "polygonMainnet_BiconomyMetaTxRelayUpgradeable_verify",
  "polygonMainnet_NymFashionNft_verify",
];
