const { ethers } = require("hardhat");
const { polygonMumbai: network_ } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  const proxyAdmin = await ethers.getContract("ProxyAdmin");

  console.log("Now deploying PriceOracleUpgradeable on Polygon Mumbai...");
  const impl = await deploy("PriceOracleUpgradeable", {
    from: deployer.address,
  });
  console.log("PriceOracleUpgradeable implementation address: ", impl.address);

  const implArtifact = await deployments.getArtifact("PriceOracleUpgradeable");
  const iface = new ethers.utils.Interface(JSON.stringify(implArtifact.abi));
  const data = iface.encodeFunctionData("initialize", [
    network_.Global.ownerAddress,
    network_.ZONE.tokenAddress,
    network_.PriceOracle.slpZoneEth,
    network_.PriceOracle.slpReserveWeight,
    network_.PriceOracle.usePoolPrice,
    network_.PriceOracle.zoneReserveInSLP,
    network_.PriceOracle.ethReserveInSLP,
  ]);

  console.log("Now deploying PriceOracleUpgradeableProxy on Polygon Mumbai...");
  const proxy = await deploy("PriceOracleUpgradeableProxy", {
    from: deployer.address,
    args: [
      impl.address,
      proxyAdmin.address,
      data,
    ],
  });
  console.log("PriceOracleUpgradeableProxy proxy address: ", proxy.address);
};
module.exports.tags = ["polygonMumbai_PriceOracleUpgradeable_deploy"];
