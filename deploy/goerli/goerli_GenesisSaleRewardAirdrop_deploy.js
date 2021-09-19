const { ethers } = require("hardhat");
const { goerli: network_ } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  console.log("Now deploying GenesisSaleRewardAirdrop...");
  const genesisSaleRewardAirdrop = await deploy("GenesisSaleRewardAirdrop", {
    from: deployer.address,
    args: [
      network_.ZONE.tokenAddress,
      network_.Global.ownerAddress,
      network_.GenesisSaleRewardAirdrop.adminAddress,
    ],
  });
  console.log("GenesisSaleRewardAirdrop contract address: ", genesisSaleRewardAirdrop.address);
};
module.exports.tags = ["goerli_GenesisSaleRewardAirdrop_deploy"];
