const { ethers, run } = require("hardhat");
const { polygonMainnet: network_ } = require("../../parameters");

module.exports = async () => {
  const proxyAdmin = await ethers.getContract("ProxyAdmin");

  const impl = await ethers.getContract("BiconomyMetaTxRelayUpgradeable");
  try {
    await run("verify:verify", {
      address: impl.address,
      contract: "contracts/BiconomyRelay/BiconomyMetaTxRelayUpgradeable.sol:BiconomyMetaTxRelayUpgradeable",
    });
  } catch(e) {
  }

  const implArtifact = await deployments.getArtifact("BiconomyMetaTxRelayUpgradeable");
  const iface = new ethers.utils.Interface(JSON.stringify(implArtifact.abi));
  const data = iface.encodeFunctionData("initialize", [
    network_.Global.ownerAddress,
    network_.ZONE.tokenAddress,
    network_.BiconomyMetaTxRelay.gasPriceInZone,
    network_.BiconomyMetaTxRelay.biconomyForwarder,
  ]);

  const proxy = await ethers.getContract("BiconomyMetaTxRelayUpgradeableProxy");
  try {
    await run("verify:verify", {
      address: proxy.address,
      constructorArguments: [
        impl.address,
        proxyAdmin.address,
        data,
      ],
      contract: "contracts/BiconomyRelay/BiconomyMetaTxRelayUpgradeableProxy.sol:BiconomyMetaTxRelayUpgradeableProxy",
    });
  } catch (e) {
  }
};
module.exports.tags = ["polygonMainnet_BiconomyMetaTxRelayUpgradeable_verify"];
