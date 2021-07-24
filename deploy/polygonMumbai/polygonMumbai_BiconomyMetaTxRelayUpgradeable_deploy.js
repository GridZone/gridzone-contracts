const { ethers } = require("hardhat");
const { polygonMumbai: network_ } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  const proxyAdmin = await ethers.getContract("ProxyAdmin");

  console.log("Now deploying BiconomyMetaTxRelayUpgradeable on Polygon Mumbai...");
  const impl = await deploy("BiconomyMetaTxRelayUpgradeable", {
    from: deployer.address,
  });
  console.log("BiconomyMetaTxRelayUpgradeable implementation address: ", impl.address);

  const implArtifact = await deployments.getArtifact("BiconomyMetaTxRelayUpgradeable");
  const iface = new ethers.utils.Interface(JSON.stringify(implArtifact.abi));
  const data = iface.encodeFunctionData("initialize", [
    network_.Global.ownerAddress,
    network_.ZONE.tokenAddress,
    network_.BiconomyMetaTxRelay.gasPriceInZone,
    network_.BiconomyMetaTxRelay.biconomyForwarder,
  ]);

  console.log("Now deploying BiconomyMetaTxRelayUpgradeableProxy on Polygon Mumbai...");
  const proxy = await deploy("BiconomyMetaTxRelayUpgradeableProxy", {
    from: deployer.address,
    args: [
      impl.address,
      proxyAdmin.address,
      data,
    ],
  });
  console.log("BiconomyMetaTxRelayUpgradeableProxy proxy address: ", proxy.address);
};
module.exports.tags = ["polygonMumbai_BiconomyMetaTxRelayUpgradeable_deploy"];
