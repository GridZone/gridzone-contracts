const { deployments, network } = require("hardhat");
const { mainnet: network_ } = require("../../parameters");

module.exports = async () => {

  await network.provider.request({method: "hardhat_impersonateAccount", params: [network_.ZONE.ownerAddress]});
  await network.provider.request({method: "hardhat_impersonateAccount", params: [network_.ZONE.vaultAddress]});
  await network.provider.request({method: "hardhat_impersonateAccount", params: [network_.GenesisSaleRewardAirdrop.adminAddress]});

  const gridZoneStakingBot = await deployments.get("GridZoneStakingBot");
  const nymLib = await deployments.get("NymLib");
  const nym = await deployments.get("NYM");
  const genesisSaleRewardAirdrop = await deployments.get("GenesisSaleRewardAirdrop");

  console.log("Summary on hardhat:");
  console.log("GridZoneStakingBot address: ", gridZoneStakingBot.address);
  console.log("");
  console.log("NymLib address: ", nymLib.address);
  console.log("NYM address: ", nym.address);
  console.log("");
  console.log("GenesisSaleRewardAirdrop address: ", genesisSaleRewardAirdrop.address);
  console.log("");
};

module.exports.tags = ["hardhat"];
module.exports.dependencies = [
  "hardhat_reset",
  "hardhat_GridZoneStakingBot_deploy",
  "hardhat_NYM_deploy",
  "hardhat_GenesisSaleRewardAirdrop_deploy",
  "hardhat_GridZoneStakingBot_verify",
  "hardhat_NYM_verify",
  "hardhat_GenesisSaleRewardAirdrop_verify",
];
