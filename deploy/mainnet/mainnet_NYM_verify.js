const { ethers, run } = require("hardhat");
const { mainnet: network_ } = require("../../parameters");

module.exports = async () => {
  const nymLibUpgradeableProxy = await ethers.getContract("NymLibUpgradeableProxy");
  const nym = await ethers.getContract("NYM");
  try {
    await run("verify:verify", {
      address: nym.address,
      constructorArguments: [
        nymLibUpgradeableProxy.address,
        network_.ZONE.tokenAddress,
        network_.ZONE.vaultAddress,
      ],
      contract: "contracts/NYM/NYM.sol:NYM",
    });
  } catch(e) {
  }
};
module.exports.tags = ["mainnet_NYM_verify"];
