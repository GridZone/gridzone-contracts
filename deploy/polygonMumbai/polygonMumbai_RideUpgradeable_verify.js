const { ethers, run } = require("hardhat");
const { polygonMumbai: network_ } = require("../../parameters");

module.exports = async () => {
  const proxyAdmin = await ethers.getContract("ProxyAdmin");
  const biconomyMetaTxRelay = await ethers.getContract("BiconomyMetaTxRelayUpgradeableProxy");

  const rideUpgradeable = await ethers.getContract("RideUpgradeable");
  try {
    await run("verify:verify", {
      address: rideUpgradeable.address,
      contract: "contracts/NFT/Ride/RideUpgradeable.sol:RideUpgradeable",
    });
  } catch(e) {
  }

  // const rideUpgradeableProxy = await ethers.getContract("RideUpgradeableProxy");
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
  // try {
  //   await run("verify:verify", {
  //     address: rideUpgradeableProxy.address,
  //     constructorArguments: [
  //       rideUpgradeable.address,
  //       proxyAdmin.address,
  //       data,
  //     ],
  //     contract: "contracts/NFT/Ride/RideUpgradeableProxy.sol:RideUpgradeableProxy",
  //   });
  // } catch(e) {
  // }

  const rideUpgradeableFactory = await ethers.getContract("RideUpgradeableFactory");
  try {
    await run("verify:verify", {
      address: rideUpgradeableFactory.address,
      constructorArguments: [
        network_.Global.ownerAddress,
        proxyAdmin.address,
        rideUpgradeable.address,
        network_.ZONE.tokenAddress,
        network_.Global.slpZoneEth,
        biconomyMetaTxRelay.address,
      ],
      contract: "contracts/NFT/Ride/RideUpgradeableFactory.sol:RideUpgradeableFactory",
    });
  } catch(e) {
  }
};
module.exports.tags = ["polygonMumbai_RideUpgradeable_verify"];
