const { ethers } = require("hardhat");
const { polygonMumbai: network_ } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  const proxyAdmin = await ethers.getContract("ProxyAdmin");
  const biconomyMetaTxRelay = await ethers.getContract("BiconomyMetaTxRelayUpgradeableProxy");

  console.log("Now deploying RideUpgradeable on Polygon Mumbai...");
  const rideUpgradeable = await deploy("RideUpgradeable", {
    from: deployer.address,
  });
  console.log("RideUpgradeable template contract address: ", rideUpgradeable.address);

  // console.log("Now deploying RideUpgradeableProxy for just verification on Polygon Mumbai...");
  // const implArtifact = await deployments.getArtifact("RideUpgradeable");
  // const iface = new ethers.utils.Interface(JSON.stringify(implArtifact.abi));
  // const data = iface.encodeFunctionData("initialize", [
  //   network_.Global.ownerAddress,
  //   "",
  //   "",
  //   "",
  //   1,
  //   "1000000000000000000",
  //   network_.ZONE.tokenAddress,
  //   network_.Global.slpZoneEth,
  //   false,
  //   false,
  //   []
  // ]);
  // const rideUpgradeableProxy = await deploy("RideUpgradeableProxy", {
  //   from: deployer.address,
  //   args: [
  //     rideUpgradeable.address,
  //     proxyAdmin.address,
  //     data,
  //   ],
  // });
  // console.log("RideUpgradeableProxy template contract address: ", rideUpgradeableProxy.address);

  console.log("Now deploying RideUpgradeableFactory on Polygon Mumbai...");
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
module.exports.tags = ["polygonMumbai_RideUpgradeable_deploy"];
