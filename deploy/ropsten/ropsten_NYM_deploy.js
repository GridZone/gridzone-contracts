const { ethers } = require("hardhat");
const { ropsten: network_ } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  const nymLibUpgradeableProxy = await deployments.get("NymLibUpgradeableProxy");

  console.log("Now deploying NYM...");
  const nym = await deploy("NYM", {
    from: deployer.address,
    args: [
      nymLibUpgradeableProxy.address,
      network_.ZONE.tokenAddress,
      network_.ZONE.vaultAddress,
    ],
  });
  console.log("NYM contract address: ", nym.address);

};
module.exports.tags = ["ropsten_NYM_deploy"];
