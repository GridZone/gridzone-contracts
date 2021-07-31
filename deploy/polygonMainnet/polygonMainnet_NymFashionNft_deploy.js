const { ethers } = require("hardhat");
const { polygonMainnet: network_ } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  const proxyAdmin = await ethers.getContract("ProxyAdmin");
  const biconomyMetaTxRelay = await ethers.getContract("BiconomyMetaTxRelayUpgradeableProxy");

  console.log("Now deploying BaseNftUpgradeable on Polygon Mainnet...");
  const baseNftUpgradeable = await deploy("BaseNftUpgradeable", {
    from: deployer.address,
  });
  console.log("BaseNftUpgradeable template contract address: ", baseNftUpgradeable.address);

  console.log("Now deploying NymFashionNftFactory on Polygon Mainnet...");
  const factory = await deploy("NymFashionNftFactory", {
    from: deployer.address,
    args: [
      network_.Global.ownerAddress,
      proxyAdmin.address,
      baseNftUpgradeable.address,
      network_.ZONE.tokenAddress,
      network_.Global.slpZoneEth,
      biconomyMetaTxRelay.address,
    ],
  });
  console.log("NymFashionNftFactory contract address: ", factory.address);
};
module.exports.tags = ["polygonMainnet_NymFashionNft_deploy"];
