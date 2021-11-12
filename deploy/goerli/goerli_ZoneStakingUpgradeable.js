const { ethers } = require("hardhat");
const { goerli: network_ } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  console.log("Now deploying ZoneStakingUpgradeable...");
  const impl = await deploy("ZoneStakingUpgradeable", {
    from: deployer.address,
  });
  console.log("  ZoneStakingUpgradeable address: ", impl.address);

  const implArtifact = await deployments.getArtifact("ZoneStakingUpgradeable");
  const iface = new ethers.utils.Interface(JSON.stringify(implArtifact.abi));
  const data = iface.encodeFunctionData("initialize", [
    network_.Global.ownerAddress,
    network_.ZONE.tokenAddress,
    network_.ZONE.governorTimelock,
    network_.ZoneStaking.enables,
    network_.ZoneStaking.lockDays,
    network_.ZoneStaking.rewardRates,
  ]);

  const proxy = await deploy("ZoneStakingUpgradeableProxy", {
    from: deployer.address,
    args: [
      impl.address,
      network_.Global.proxyAdmin,
      data,
    ],
  });
  console.log("  ZoneStakingUpgradeableProxy address: ", proxy.address);

  console.log("  Verifing contracts");
  try {
    await run("verify:verify", {
      address: impl.address,
      contract: "contracts/Staking/ZoneStakingUpgradeable.sol:ZoneStakingUpgradeable",
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
      contract: "contracts/Staking/ZoneStakingUpgradeable.sol:ZoneStakingUpgradeableProxy",
    });
  } catch (e) {
  }
};
module.exports.tags = ["goerli_ZoneStakingUpgradeable"];
