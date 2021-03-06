const { ethers } = require("hardhat");
const { mainnet: network_ } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  const proxyAdmin = await ethers.getContract("ProxyAdmin");

  console.log("Now deploying PublicSaleUpgradeable on Mainnet...");
  const impl = await deploy("PublicSaleUpgradeable", {
    from: deployer.address,
  });
  console.log("PublicSaleUpgradeable implementation address: ", impl.address);

  const implArtifact = await deployments.getArtifact("PublicSaleUpgradeable");
  const iface = new ethers.utils.Interface(JSON.stringify(implArtifact.abi));
  const data = iface.encodeFunctionData("initialize", [
    network_.Global.ownerAddress,
    network_.ZONE.tokenAddress,
  ]);

  console.log("Now deploying PublicSaleUpgradeableProxy on Mainnet...");
  const proxy = await deploy("PublicSaleUpgradeableProxy", {
    from: deployer.address,
    args: [
      impl.address,
      proxyAdmin.address,
      data,
    ],
  });
  console.log("PublicSaleUpgradeableProxy proxy address: ", proxy.address);
};
module.exports.tags = ["mainnet_PublicSaleUpgradeable_deploy"];
