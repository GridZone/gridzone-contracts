const { deployments } = require("hardhat");

module.exports = async () => {
  const proxyAdmin = await deployments.get("ProxyAdmin");
  const nymLibUpgradeableProxy = await deployments.get("NymLibUpgradeableProxy");
  const nym = await deployments.get("NYM");
  const gridZoneStakingBot = await deployments.get("GridZoneStakingBot");
  const genesisSaleRewardAirdrop = await deployments.get("GenesisSaleRewardAirdrop");

  console.log("Summary on ropsten:");
  console.log("    ProxyAdmin address: ", proxyAdmin.address);
  console.log("    NymLibUpgradeableProxy address: ", nymLibUpgradeableProxy.address);
  console.log("    NYM address: ", nym.address);
  console.log("    GridZoneStakingBot address: ", gridZoneStakingBot.address);
  console.log("    GenesisSaleRewardAirdrop address: ", genesisSaleRewardAirdrop.address);
  console.log("");
};
module.exports.tags = ["ropsten"];
module.exports.dependencies = [
  "ropsten_ProxyAdmin_deploy",
  "ropsten_NymLibUpgradeable_deploy",
  "ropsten_NYM_deploy",
  "ropsten_GridZoneStakingBot_deploy",
  "ropsten_GenesisSaleRewardAirdrop_deploy",
  "ropsten_ProxyAdmin_verify",
  "ropsten_NymLibUpgradeable_verify",
  "ropsten_NYM_verify",
  "ropsten_GridZoneStakingBot_verify",
  "ropsten_GenesisSaleRewardAirdrop_verify",
];
