const { ethers, run } = require("hardhat");
const { polygonMainnet: network_ } = require("../../parameters");

module.exports = async () => {
  const proxyAdmin = await ethers.getContract("ProxyAdmin");
  const biconomyMetaTxRelay = await ethers.getContract("BiconomyMetaTxRelayUpgradeableProxy");

  const baseNftUpgradeable = await ethers.getContract("BaseNftUpgradeable");
  try {
    await run("verify:verify", {
      address: baseNftUpgradeable.address,
      contract: "contracts/NFT/base/BaseNftUpgradeable.sol:BaseNftUpgradeable",
    });
  } catch(e) {
  }

  const factory = await ethers.getContract("RideNftFactory");
  try {
    await run("verify:verify", {
      address: factory.address,
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
module.exports.tags = ["polygonMainnet_RideNft_verify"];
