const { ethers, run } = require("hardhat");

module.exports = async () => {
  const proxyAdmin = await ethers.getContract("ProxyAdmin");

  const impl = await ethers.getContract("NymLibUpgradeable");
  try {
    await run("verify:verify", {
      address: impl.address,
      contract: "contracts/NYM/NymLibUpgradeable.sol:NymLibUpgradeable",
    });
  } catch(e) {
  }

  const proxy = await ethers.getContract("NymLibUpgradeableProxy");
  try {
    await run("verify:verify", {
      address: proxy.address,
      constructorArguments: [
        impl.address,
        proxyAdmin.address,
        "0x",
      ],
      contract: "contracts/NYM/NymLibUpgradeableProxy.sol:NymLibUpgradeableProxy",
    });
  } catch (e) {
  }
};
module.exports.tags = ["ropsten_NymLibUpgradeable_verify"];
