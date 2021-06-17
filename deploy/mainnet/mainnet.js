const { deployments } = require("hardhat");

module.exports = async () => {
  const gridZoneStakingBot = await deployments.get("GridZoneStakingBot");
  const nymLib = await deployments.get("NymLib");
  const nym = await deployments.get("NYM");
  const genesisSaleRewardAirdrop = await deployments.get("GenesisSaleRewardAirdrop");

  console.log("Summary on mainnet:");
  console.log("GridZoneStakingBot address: ", gridZoneStakingBot.address);
  console.log("");
  console.log("NymLib address: ", nymLib.address);
  console.log("NYM address: ", nym.address);
  console.log("");
  console.log("GenesisSaleRewardAirdrop address: ", genesisSaleRewardAirdrop.address);
  console.log("");
};
module.exports.tags = ["mainnet"];
module.exports.dependencies = [
  "mainnet_GridZoneStakingBot_deploy",
  "mainnet_NYM_deploy",
  "mainnet_GenesisSaleRewardAirdrop_deploy",
  "mainnet_GridZoneStakingBot_verify",
  "mainnet_NYM_verify",
  "mainnet_GenesisSaleRewardAirdrop_verify",
];
