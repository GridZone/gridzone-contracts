const { ethers, run } = require("hardhat");
const { goerli: network_, gasPrice } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  console.log("Now deploying PriceOracleUpgradeable on Goerli...");
  const impl = await deploy("PriceOracleUpgradeable", {
    from: deployer.address,
    gasPrice,
  });
  console.log("  PriceOracleUpgradeable implementation address: ", impl.address);

  const implArtifact = await deployments.getArtifact("PriceOracleUpgradeable");
  const iface = new ethers.utils.Interface(JSON.stringify(implArtifact.abi));
  const data = iface.encodeFunctionData("initialize", [
    network_.Global.ownerAddress,
    network_.ZONE.tokenAddress,
    network_.PriceOracle.lpZoneEth,
    network_.PriceOracle.usePoolPrice,
    network_.PriceOracle.zoneReserveInLP,
    network_.PriceOracle.ethReserveInLP,
  ]);

  console.log("Now deploying PriceOracleUpgradeableProxy on Goerli...");
  const proxy = await deploy("PriceOracleUpgradeableProxy", {
    from: deployer.address,
    args: [
      impl.address,
      network_.Global.proxyAdmin,
      data,
    ],
    gasPrice,
  });
  console.log("  PriceOracleUpgradeableProxy proxy address: ", proxy.address);

  console.log("  Verifing contracts");
  try {
    await run("verify:verify", {
      address: impl.address,
      contract: "contracts/PriceOracle/PriceOracleUpgradeable.sol:PriceOracleUpgradeable",
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
      contract: "contracts/PriceOracle/PriceOracleUpgradeableProxy.sol:PriceOracleUpgradeableProxy",
    });
  } catch (e) {
  }
};
module.exports.tags = ["goerli_PriceOracleUpgradeable"];
