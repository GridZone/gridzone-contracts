const { ethers, run } = require("hardhat");
const { mainnet: network_, gasPrice } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  console.log("Now deploying EthRewardsUpgradeable ...");
  const impl = await deploy("EthRewardsUpgradeable", {
    from: deployer.address,
    gasPrice,
  });
  console.log("  EthRewardsUpgradeable implementation address: ", impl.address);

  const implArtifact = await deployments.getArtifact("EthRewardsUpgradeable");
  const iface = new ethers.utils.Interface(JSON.stringify(implArtifact.abi));
  const data = iface.encodeFunctionData("initialize", [
    network_.Global.ownerAddress,
    network_.Airdrop.adminAddress,
  ]);

  console.log("Now deploying EthRewardsUpgradeableProxy...");
  const proxy = await deploy("EthRewardsUpgradeableProxy", {
    from: deployer.address,
    args: [
      impl.address,
      network_.Global.proxyAdmin,
      data,
    ],
    gasPrice,
  });
  console.log("  EthRewardsUpgradeableProxy proxy address: ", proxy.address);

  console.log("  Verifing contracts");
  try {
    await run("verify:verify", {
      address: impl.address,
      contract: "contracts/Airdrop/EthRewardsUpgradeable.sol:EthRewardsUpgradeable",
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
      contract: "contracts/Airdrop/EthRewardsUpgradeable.sol:EthRewardsUpgradeableProxy",
    });
  } catch (e) {
  }
};
module.exports.tags = ["mainnet_EthRewards"];
