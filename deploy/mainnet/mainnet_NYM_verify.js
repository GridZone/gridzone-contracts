const { ethers, run } = require("hardhat");
const { mainnet: network_ } = require("../../parameters");

module.exports = async () => {
  const nymLib = await ethers.getContract("NymLib");
  try {
    await run("verify:verify", {
      address: nymLib.address,
      constructorArguments: [],
      contract: "contracts/NYM/NymLib.sol:NymLib",
    });
  } catch (e) {
  }

  const nym = await ethers.getContract("NYM");
  try {
    await run("verify:verify", {
      address: nym.address,
      constructorArguments: [
        nymLib.address,
        network_.ZONE.tokenAddress,
        network_.ZONE.vaultAddress,
      ],
      contract: "contracts/NYM/NYM.sol:NYM",
    });
  } catch(e) {
  }
};
module.exports.tags = ["mainnet_NYM_verify"];
