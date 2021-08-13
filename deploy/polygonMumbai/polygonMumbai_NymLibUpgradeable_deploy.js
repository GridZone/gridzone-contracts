const { ethers } = require("hardhat");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  const proxyAdmin = await ethers.getContract("ProxyAdmin");

  console.log("Now deploying NymLibUpgradeable on Polygon Mumbai...");
  const impl = await deploy("NymLibUpgradeable", {
    from: deployer.address,
  });
  console.log("NymLibUpgradeable implementation address: ", impl.address);

  console.log("Now deploying NymLibUpgradeableProxy on Polygon Mumbai...");
  const proxy = await deploy("NymLibUpgradeableProxy", {
    from: deployer.address,
    args: [
      impl.address,
      proxyAdmin.address,
      "0x",
    ],
  });
  console.log("NymLibUpgradeableProxy proxy address: ", proxy.address);
};
module.exports.tags = ["polygonMumbai_NymLibUpgradeable_deploy"];
