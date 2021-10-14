const { ethers } = require("hardhat");
const { goerli: network_ } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  console.log("Now deploying GridZoneStakingUpgradeable...");
  const impl = await deploy("GridZoneStakingUpgradeable", {
    from: deployer.address,
  });
  console.log("  GridZoneStakingUpgradeable address: ", impl.address);

  const implArtifact = await deployments.getArtifact("GridZoneStakingUpgradeable");
  const iface = new ethers.utils.Interface(JSON.stringify(implArtifact.abi));
  const data = iface.encodeFunctionData("initialize", [
    network_.Global.ownerAddress,
    network_.ZONE.tokenAddress,
    network_.ZONE.tokenAddress,
    network_.ZONE.vaultAddress,
  ]);

  const proxy = await deploy("GridZoneStakingUpgradeableProxy", {
    from: deployer.address,
    args: [
      impl.address,
      network_.Global.proxyAdmin,
      data,
    ],
  });
  console.log("  GridZoneStakingUpgradeableProxy address: ", proxy.address);

  console.log("  Verifing contracts");
  try {
    await run("verify:verify", {
      address: impl.address,
      contract: "contracts/Staking/GridZoneStakingUpgradeable.sol:GridZoneStakingUpgradeable",
    });
  } catch(e) {
  }
  try {
    await run("verify:verify", {
      address: proxy.address,
      constructorArguments: [
        impl.address,
        network_.Global.proxyAdmin,
        data,
      ],
      contract: "contracts/Staking/GridZoneStakingUpgradeable.sol:GridZoneStakingUpgradeableProxy",
    });
  } catch (e) {
  }
};
module.exports.tags = ["goerli_GridZoneStakingUpgradeable"];
