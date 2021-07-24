const { ethers } = require("hardhat");
const { polygonMainnet: network_ } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  const proxyAdmin = await ethers.getContract("ProxyAdmin");
  const biconomyMetaTxRelay = await ethers.getContract("BiconomyMetaTxRelayUpgradeableProxy");

  console.log("Now deploying RideUpgradeable on Polygon Mainnet...");
  const rideUpgradeable = await deploy("RideUpgradeable", {
    from: deployer.address,
  });
  console.log("RideUpgradeable template contract address: ", rideUpgradeable.address);

  console.log("Now deploying RideUpgradeableFactory on Polygon Mainnet...");
  const rideUpgradeableFactory = await deploy("RideUpgradeableFactory", {
    from: deployer.address,
    args: [
      network_.Global.ownerAddress,
      proxyAdmin.address,
      rideUpgradeable.address,
      network_.ZONE.tokenAddress,
      network_.Global.slpZoneEth,
      biconomyMetaTxRelay.address,
    ],
  });
  console.log("RideUpgradeableFactory contract address: ", rideUpgradeableFactory.address);
};
module.exports.tags = ["polygonMainnet_RideUpgradeable_deploy"];
