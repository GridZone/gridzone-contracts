const { deployments } = require("hardhat");

module.exports = async () => {
  const proxyAdmin = await deployments.get("ProxyAdmin");
  const nymLibUpgradeableProxy = await deployments.get("NymLibUpgradeableProxy");
  const nym = await deployments.get("NYM");
  const gridZoneStakingBot = await deployments.get("GridZoneStakingBot");
  const genesisSaleRewardAirdrop = await deployments.get("GenesisSaleRewardAirdrop");
  const publicSaleUpgradeableProxy = await ethers.getContract("PublicSaleUpgradeableProxy");

  console.log("Summary on mainnet:");
  console.log("    ProxyAdmin address: ", proxyAdmin.address);
  console.log("    NymLibUpgradeableProxy address: ", nymLibUpgradeableProxy.address);
  console.log("    NYM address: ", nym.address);
  console.log("    GridZoneStakingBot address: ", gridZoneStakingBot.address);
  console.log("    GenesisSaleRewardAirdrop address: ", genesisSaleRewardAirdrop.address);
  console.log("    PublicSaleUpgradeableProxy address: ", publicSaleUpgradeableProxy.address);
  console.log("");
};

module.exports.tags = ["mainnet"];
module.exports.dependencies = [
  "mainnet_ProxyAdmin_deploy",
  "mainnet_NymLibUpgradeable_deploy",
  "mainnet_NYM_deploy",
  "mainnet_GridZoneStakingBot_deploy",
  "mainnet_GenesisSaleRewardAirdrop_deploy",
  "mainnet_PublicSaleUpgradeable_deploy",
  "mainnet_ProxyAdmin_verify",
  "mainnet_NymLibUpgradeable_verify",
  "mainnet_NYM_verify",
  "mainnet_GridZoneStakingBot_verify",
  "mainnet_GenesisSaleRewardAirdrop_verify",
  "mainnet_PublicSaleUpgradeable_verify",
];
