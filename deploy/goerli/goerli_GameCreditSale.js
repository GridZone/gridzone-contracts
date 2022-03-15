const { ethers, run } = require("hardhat");
const { goerli: network_, gasPrice } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  console.log("Now deploying PriceOracleUpgradeable...");
  const impl = await deploy("GameCreditSaleUpgradeable", {
    from: deployer.address,
    gasPrice,
  });
  console.log("  GameCreditSaleUpgradeable implementation address: ", impl.address);

  const implArtifact = await deployments.getArtifact("GameCreditSaleUpgradeable");
  const iface = new ethers.utils.Interface(JSON.stringify(implArtifact.abi));
  const data = iface.encodeFunctionData("initialize", [
    network_.Global.ownerAddress,
  ]);

  console.log("Now deploying GameCreditSaleUpgradeableProxy...");
  const proxy = await deploy("GameCreditSaleUpgradeableProxy", {
    from: deployer.address,
    args: [
      impl.address,
      network_.Global.proxyAdmin,
      data,
    ],
    gasPrice,
  });
  console.log("  GameCreditSaleUpgradeableProxy proxy address: ", proxy.address);

  console.log("  Verifing contracts");
  try {
    await run("verify:verify", {
      address: impl.address,
      contract: "contracts/Sales/GameCreditSale.sol:GameCreditSaleUpgradeable",
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
      contract: "contracts/Sales/GameCreditSale.sol:GameCreditSaleUpgradeableProxy",
    });
  } catch (e) {
  }
};
module.exports.tags = ["goerli_GameCreditSale"];
