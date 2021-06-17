const { ethers } = require("hardhat");
const { mainnet: network_ } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  console.log("Now deploying NymLib...");
  const nymLib = await deploy("NymLib", {
    from: deployer.address,
    args: [],
  });
  console.log("NymLib contract address: ", nymLib.address);

  console.log("Now deploying NYM...");
  const nym = await deploy("NYM", {
    from: deployer.address,
    args: [
      nymLib.address,
      network_.ZONE.tokenAddress,
      network_.ZONE.vaultAddress,
    ],
  });
  console.log("NYM contract address: ", nym.address);

};
module.exports.tags = ["hardhat_NYM_deploy"];
