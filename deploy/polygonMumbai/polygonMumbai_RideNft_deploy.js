const { ethers } = require("hardhat");
const { polygonMumbai: network_ } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  const proxyAdmin = await ethers.getContract("ProxyAdmin");
  const biconomyMetaTxRelay = await ethers.getContract("BiconomyMetaTxRelayUpgradeableProxy");

  console.log("Now deploying BaseNftUpgradeable on Polygon Mumbai...");
  const baseNftUpgradeable = await deploy("BaseNftUpgradeable", {
    from: deployer.address,
  });
  console.log("BaseNftUpgradeable template contract address: ", baseNftUpgradeable.address);

  // console.log("Now deploying RideNftUpgradeableProxy for just verification on Polygon Mumbai...");
  // const implArtifact = await deployments.getArtifact("BaseNftUpgradeable");
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
  // const rideNftUpgradeableProxy = await deploy("RideNftUpgradeableProxy", {
  //   from: deployer.address,
  //   args: [
  //     baseNftUpgradeable.address,
  //     proxyAdmin.address,
  //     data,
  //   ],
  // });
  // console.log("RideNftUpgradeableProxy template contract address: ", rideNftUpgradeableProxy.address);

  console.log("Now deploying RideNftFactory on Polygon Mumbai...");
  const rideNftFactory = await deploy("RideNftFactory", {
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
  console.log("RideNftFactory contract address: ", rideNftFactory.address);
};
module.exports.tags = ["polygonMumbai_RideNft_deploy"];
