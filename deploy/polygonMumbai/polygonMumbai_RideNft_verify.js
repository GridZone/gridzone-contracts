const { ethers, run } = require("hardhat");
const { polygonMumbai: network_ } = require("../../parameters");

module.exports = async () => {
  const proxyAdmin = await ethers.getContract("ProxyAdmin");
  const biconomyMetaTxRelay = await ethers.getContract("BiconomyMetaTxRelayUpgradeableProxy");

  const baseNftUpgradeable = await ethers.getContract("BaseNftUpgradeable");
  try {
    await run("verify:verify", {
      address: baseNftUpgradeable.address,
      contract: "contracts/NFT/Ride/BaseNftUpgradeable.sol:BaseNftUpgradeable",
    });
  } catch(e) {
  }

  // const rideNftUpgradeableProxy = await ethers.getContract("RideNftUpgradeableProxy");
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
  // try {
  //   await run("verify:verify", {
  //     address: rideNftUpgradeableProxy.address,
  //     constructorArguments: [
  //       baseNftUpgradeable.address,
  //       proxyAdmin.address,
  //       data,
  //     ],
  //     contract: "contracts/NFT/Ride/RideNftUpgradeableProxy.sol:RideNftUpgradeableProxy",
  //   });
  // } catch(e) {
  // }

  const rideNftFactory = await ethers.getContract("RideNftFactory");
  try {
    await run("verify:verify", {
      address: rideNftFactory.address,
      constructorArguments: [
        network_.Global.ownerAddress,
        proxyAdmin.address,
        baseNftUpgradeable.address,
        network_.ZONE.tokenAddress,
        network_.Global.slpZoneEth,
        biconomyMetaTxRelay.address,
      ],
      contract: "contracts/NFT/Ride/RideNftFactory.sol:RideNftFactory",
    });
  } catch(e) {
  }
};
module.exports.tags = ["polygonMumbai_RideNft_verify"];
