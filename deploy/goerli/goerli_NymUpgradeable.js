const { ethers, run } = require("hardhat");
const { goerli: network_, gasPrice } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  console.log("Now deploying NymUpgradeable ...");
  const impl = await deploy("NymUpgradeable", {
    from: deployer.address,
    gasPrice,
  });
  console.log("  NymUpgradeable implementation address: ", impl.address);

  const implArtifact = await deployments.getArtifact("NymUpgradeable");
  const iface = new ethers.utils.Interface(JSON.stringify(implArtifact.abi));
  const data = iface.encodeFunctionData("initialize", [
    network_.Global.ownerAddress,
    network_.NYM.baseURI,
  ]);

  console.log("Now deploying NymUpgradeableProxy ...");
  const proxy = await deploy("NymUpgradeableProxy", {
    from: deployer.address,
    args: [
      impl.address,
      network_.Global.proxyAdmin,
      data,
    ],
    gasPrice,
  });
  console.log("  NymUpgradeableProxy proxy address: ", proxy.address);

  console.log("  Verifing contracts");
  try {
    await run("verify:verify", {
      address: impl.address,
      contract: "contracts/NYM/NymUpgradeable.sol:NymUpgradeable",
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
      contract: "contracts/NYM/NymUpgradeable.sol:NymUpgradeableProxy",
    });
  } catch (e) {
  }
};
module.exports.tags = ["goerli_NymUpgradeable"];
