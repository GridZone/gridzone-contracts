const { ethers, run } = require("hardhat");
const { goerli: network_ } = require("../../parameters");

module.exports = async () => {
  const gridZoneStakingBot = await ethers.getContract("GridZoneStakingBot");
  try {
    await run("verify:verify", {
      address: gridZoneStakingBot.address,
      constructorArguments: [
        network_.ZONE.tokenAddress,
        network_.ZONE.vaultAddress,
      ],
      contract: "contracts/Staking/GridZoneStakingBot.sol:GridZoneStakingBot",
    });
  } catch(e) {
  }
};
module.exports.tags = ["goerli_GridZoneStakingBot_verify"];
