const { ethers, run } = require("hardhat");
const { polygonMumbai: network_, gasPrice } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  console.log("Now deploying GZRewardsUpgradeable ...");
  const impl = await deploy("GZRewardsUpgradeable", {
    from: deployer.address,
    gasPrice,
  });
  console.log("  GZRewardsUpgradeable implementation address: ", impl.address);

  const implArtifact = await deployments.getArtifact("GZRewardsUpgradeable");
  const iface = new ethers.utils.Interface(JSON.stringify(implArtifact.abi));
  const data = iface.encodeFunctionData("initialize", [
    network_.Global.ownerAddress,
    network_.ZONE.tokenAddress,
  ]);

  console.log("Now deploying GZRewardsUpgradeableProxy...");
  const proxy = await deploy("GZRewardsUpgradeableProxy", {
    from: deployer.address,
    args: [
      impl.address,
      network_.Global.proxyAdmin,
      data,
    ],
    gasPrice,
  });
  console.log("  GZRewardsUpgradeableProxy proxy address: ", proxy.address);

  console.log("  Verifing contracts");
  try {
    await run("verify:verify", {
      address: impl.address,
      contract: "contracts/Airdrop/GZRewardsUpgradeable.sol:GZRewardsUpgradeable",
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
      contract: "contracts/Airdrop/GZRewardsUpgradeable.sol:GZRewardsUpgradeableProxy",
    });
  } catch (e) {
  }
};
module.exports.tags = ["polygonMumbai_GZRewardsUpgradeable"];
