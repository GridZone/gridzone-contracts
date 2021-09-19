const { ethers, run } = require("hardhat");
const { mainnet: network_, gasPrice } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  console.log("Now deploying NymLibUpgradeable on Mainnet...");
  const impl = await deploy("NymLibUpgradeable", {
    from: deployer.address,
    gasPrice,
  });
  console.log("  NymLibUpgradeable implementation address: ", impl.address);

  console.log("Now deploying NymLibUpgradeableProxy on Mainnet...");
  const proxy = await deploy("NymLibUpgradeableProxy", {
    from: deployer.address,
    args: [
      impl.address,
      network_.Global.proxyAdmin,
      "0x",
    ],
    gasPrice,
  });
  console.log("  NymLibUpgradeableProxy proxy address: ", proxy.address);

  console.log("  Verifing contracts");
  try {
    await run("verify:verify", {
      address: impl.address,
      contract: "contracts/NYM/NymLibUpgradeable.sol:NymLibUpgradeable",
    });
  } catch(e) {
  }
  try {
    await run("verify:verify", {
      address: proxy.address,
      constructorArguments: [
        impl.address,
        network_.Global.proxyAdmin,
        "0x",
      ],
      contract: "contracts/NYM/NymLibUpgradeableProxy.sol:NymLibUpgradeableProxy",
    });
  } catch (e) {
  }
};
module.exports.tags = ["mainnet_NymLibUpgradeable"];
