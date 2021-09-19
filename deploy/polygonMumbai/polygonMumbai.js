const { deployments } = require("hardhat");

module.exports = async () => {
  const proxyAdmin = await ethers.getContract("ProxyAdmin");
  const nymLibUpgradeableProxy = await ethers.getContract("NymLibUpgradeableProxy");
  const priceOracleUpgradeableProxy = await ethers.getContract("PriceOracleUpgradeableProxy");
  const biconomyMetaTxRelayUpgradeableProxy = await ethers.getContract("BiconomyMetaTxRelayUpgradeableProxy");
  const nymFashionNftFactory = await ethers.getContract("NymFashionNftFactory");

  console.log("");
  console.log("Summary on Polygon Mumbai:");
  console.log("    ProxyAdmin address: ", proxyAdmin.address);
  console.log("    NymLibUpgradeableProxy address: ", nymLibUpgradeableProxy.address);
  console.log("    PriceOracleUpgradeableProxy address: ", priceOracleUpgradeableProxy.address);
  console.log("    BiconomyMetaTxRelayUpgradeableProxy address: ", biconomyMetaTxRelayUpgradeableProxy.address);
  console.log("    NymFashionNftFactory address: ", nymFashionNftFactory.address);
  console.log("");
};
module.exports.tags = ["polygonMumbai"];
module.exports.dependencies = [
  "polygonMumbai_ProxyAdmin_deploy",
  "polygonMumbai_NymLibUpgradeable_deploy",
  "polygonMumbai_PriceOracleUpgradeable_deploy",
  "polygonMumbai_BiconomyMetaTxRelayUpgradeable_deploy",
  "polygonMumbai_NymFashionNft_deploy",
  "polygonMumbai_ProxyAdmin_verify",
  "polygonMumbai_NymLibUpgradeable_verify",
  "polygonMumbai_PriceOracleUpgradeable_verify",
  "polygonMumbai_BiconomyMetaTxRelayUpgradeable_verify",
  "polygonMumbai_NymFashionNft_verify",
];
