const { ethers } = require("hardhat");
const { polygonMainnet: network_ } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  const proxyAdmin = await ethers.getContract("ProxyAdmin");

  console.log("Now deploying PriceOracleUpgradeable on Polygon Mainnet...");
  const impl = await deploy("PriceOracleUpgradeable", {
    from: deployer.address,
  });
  console.log("PriceOracleUpgradeable implementation address: ", impl.address);

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

  console.log("Now deploying PriceOracleUpgradeableProxy on Polygon Mainnet...");
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
module.exports.tags = ["polygonMainnet_PriceOracleUpgradeable_deploy"];
