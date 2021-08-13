const { ethers, run } = require("hardhat");
const { polygonMainnet: network_ } = require("../../parameters");

module.exports = async () => {
  const proxyAdmin = await ethers.getContract("ProxyAdmin");

  const impl = await ethers.getContract("PriceOracleUpgradeable");
  try {
    await run("verify:verify", {
      address: impl.address,
      contract: "contracts/NFT/base/PriceOracleUpgradeable.sol:PriceOracleUpgradeable",
    });
  } catch(e) {
  }

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

  const proxy = await ethers.getContract("PriceOracleUpgradeableProxy");
  try {
    await run("verify:verify", {
      address: proxy.address,
      constructorArguments: [
        impl.address,
        proxyAdmin.address,
        data,
      ],
      contract: "contracts/NFT/base/PriceOracleUpgradeableProxy.sol:PriceOracleUpgradeableProxy",
    });
  } catch (e) {
  }
};
module.exports.tags = ["polygonMainnet_PriceOracleUpgradeable_verify"];
