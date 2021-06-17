const { deployments } = require("hardhat");

module.exports = async () => {
  const gridZoneStakingBot = await deployments.get("GridZoneStakingBot");
  const nymLib = await deployments.get("NymLib");
  const nym = await deployments.get("NYM");
  const genesisSaleRewardAirdrop = await deployments.get("GenesisSaleRewardAirdrop");

  console.log("Summary on ropsten:");
  console.log("GridZoneStakingBot address: ", gridZoneStakingBot.address);
  console.log("");
  console.log("NymLib address: ", nymLib.address);
  console.log("NYM address: ", nym.address);
  console.log("");
  console.log("GenesisSaleRewardAirdrop address: ", genesisSaleRewardAirdrop.address);
  console.log("");
};
module.exports.tags = ["ropsten"];
module.exports.dependencies = [
  "ropsten_GridZoneStakingBot_deploy",
  "ropsten_NYM_deploy",
  "ropsten_GenesisSaleRewardAirdrop_deploy",
  "ropsten_GridZoneStakingBot_verify",
  "ropsten_NYM_verify",
  "ropsten_GenesisSaleRewardAirdrop_verify",
];
