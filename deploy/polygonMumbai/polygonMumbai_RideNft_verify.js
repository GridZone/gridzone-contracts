const { ethers, run } = require("hardhat");
const { polygonMumbai: network_ } = require("../../parameters");

module.exports = async () => {
  const proxyAdmin = await ethers.getContract("ProxyAdmin");
  const nymLibUpgradeableProxy = await ethers.getContract("NymLibUpgradeableProxy");
  const priceOracleUpgradeableProxy = await ethers.getContract("PriceOracleUpgradeableProxy");
  const biconomyMetaTxRelay = await ethers.getContract("BiconomyMetaTxRelayUpgradeableProxy");

  const impl = await ethers.getContract("BaseNftUpgradeable");
  try {
    await run("verify:verify", {
      address: impl.address,
      contract: "contracts/NFT/Ride/BaseNftUpgradeable.sol:BaseNftUpgradeable",
    });
  } catch(e) {
  }

  const rideNftFactory = await ethers.getContract("RideNftFactory");
  try {
    await run("verify:verify", {
      address: rideNftFactory.address,
      constructorArguments: [
        nymLibUpgradeableProxy.address,
        priceOracleUpgradeableProxy.address,
        network_.Global.ownerAddress,
        proxyAdmin.address,
        impl.address,
        biconomyMetaTxRelay.address,
      ],
      contract: "contracts/NFT/Ride/RideNftFactory.sol:RideNftFactory",
    });
  } catch(e) {
  }
};
module.exports.tags = ["polygonMumbai_RideNft_verify"];
