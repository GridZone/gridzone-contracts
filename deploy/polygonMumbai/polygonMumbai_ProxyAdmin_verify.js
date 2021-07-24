const { ethers, run } = require("hardhat");
const { polygonMumbai: network_ } = require("../../parameters");

module.exports = async () => {
  const proxyAdmin = await ethers.getContract("ProxyAdmin");
  try {
    await run("verify:verify", {
      address: proxyAdmin.address,
      constructorArguments: [
        network_.Global.ownerAddress,
      ],
      contract: "contracts/lib/proxy/ProxyAdmin.sol:ProxyAdmin",
    });
  } catch(e) {
  }
};
module.exports.tags = ["polygonMumbai_ProxyAdmin_verify"];
