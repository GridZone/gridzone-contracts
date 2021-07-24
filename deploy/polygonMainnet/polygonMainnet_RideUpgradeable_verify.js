const { ethers, run } = require("hardhat");
const { polygonMainnet: network_ } = require("../../parameters");

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
module.exports.tags = ["polygonMainnet_RideUpgradeable_verify"];
