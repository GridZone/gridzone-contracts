const { ethers, run } = require("hardhat");
const { mainnet: network_ } = require("../../parameters");

module.exports = async () => {
  const genesisSaleRewardAirdrop = await ethers.getContract("GenesisSaleRewardAirdrop");
  try {
    await run("verify:verify", {
      address: genesisSaleRewardAirdrop.address,
      constructorArguments: [
        network_.ZONE.tokenAddress,
        network_.ZONE.ownerAddress,
        network_.GenesisSaleRewardAirdrop.adminAddress,
      ],
      contract: "contracts/Airdrop/GenesisSaleRewardAirdrop.sol:GenesisSaleRewardAirdrop",
    });
  } catch(e) {
  }
};
module.exports.tags = ["mainnet_GenesisSaleRewardAirdrop_verify"];
