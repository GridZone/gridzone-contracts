const { ethers, run } = require("hardhat");
const { goerli: network_ } = require("../../parameters");

module.exports = async () => {
  const proxyAdmin = await ethers.getContract("ProxyAdmin");

  const impl = await ethers.getContract("PublicSaleUpgradeable");
  try {
    await run("verify:verify", {
      address: impl.address,
      contract: "contracts/Sales/PublicSaleUpgradeable.sol:PublicSaleUpgradeable",
    });
  } catch(e) {
  }

  const implArtifact = await deployments.getArtifact("PublicSaleUpgradeable");
  const iface = new ethers.utils.Interface(JSON.stringify(implArtifact.abi));
  const data = iface.encodeFunctionData("initialize", [
    network_.Global.ownerAddress,
    network_.ZONE.tokenAddress,
  ]);

  const proxy = await ethers.getContract("PublicSaleUpgradeableProxy");
  try {
    await run("verify:verify", {
      address: proxy.address,
      constructorArguments: [
        impl.address,
        proxyAdmin.address,
        data,
      ],
      contract: "contracts/Sales/PublicSaleUpgradeableProxy.sol:PublicSaleUpgradeableProxy",
    });
  } catch (e) {
  }
};
module.exports.tags = ["goerli_PublicSaleUpgradeable_verify"];
