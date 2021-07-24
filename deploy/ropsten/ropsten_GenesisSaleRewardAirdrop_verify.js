const { ethers, run } = require("hardhat");
const { ropsten: network_ } = require("../../parameters");

module.exports = async () => {
  const genesisSaleRewardAirdrop = await ethers.getContract("GenesisSaleRewardAirdrop");
  try {
    await run("verify:verify", {
      address: genesisSaleRewardAirdrop.address,
      constructorArguments: [
        network_.ZONE.tokenAddress,
        network_.Global.ownerAddress,
        network_.GenesisSaleRewardAirdrop.adminAddress,
      ],
      contract: "contracts/Airdrop/GenesisSaleRewardAirdrop.sol:GenesisSaleRewardAirdrop",
    });
  } catch(e) {
  }
};
module.exports.tags = ["ropsten_GenesisSaleRewardAirdrop_verify"];
