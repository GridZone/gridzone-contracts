const { ethers, run } = require("hardhat");
const { polygonMainnet: network_ } = require("../../parameters");

module.exports = async () => {
  const proxyAdmin = await ethers.getContract("ProxyAdmin");
  const nymLibUpgradeableProxy = await ethers.getContract("NymLibUpgradeableProxy");
  const priceOracleUpgradeableProxy = await ethers.getContract("PriceOracleUpgradeableProxy");
  const biconomyMetaTxRelay = await ethers.getContract("BiconomyMetaTxRelayUpgradeableProxy");

  const impl = await ethers.getContract("BaseNftUpgradeable");
  try {
    await run("verify:verify", {
      address: impl.address,
      contract: "contracts/NFT/base/BaseNftUpgradeable.sol:BaseNftUpgradeable",
    });
  } catch(e) {
  }

  // const proxyContract = await ethers.getContract("NymFashionNftUpgradeableProxy");
  // const implArtifact = await deployments.getArtifact("BaseNftUpgradeable");
  // const iface = new ethers.utils.Interface(JSON.stringify(implArtifact.abi));
  // const data = iface.encodeFunctionData("initialize", [
  //   nymLibUpgradeableProxy.address,
  //   priceOracleUpgradeableProxy.address,
  //   network_.Global.ownerAddress,
  //   "",
  //   "",
  //   [""],
  //   1,
  //   "1000000000000000000",
  //   false,
  //   false,
  //   []
  // ]);
  // try {
  //   await run("verify:verify", {
  //     address: proxyContract.address,
  //     constructorArguments: [
  //       impl.address,
  //       proxyAdmin.address,
  //       data,
  //     ],
  //     contract: "contracts/NFT/NymFashion/NymFashionNftUpgradeableProxy.sol:NymFashionNftUpgradeableProxy",
  //   });
  // } catch(e) {
  // }

  const factory = await ethers.getContract("NymFashionNftFactory");
  try {
    await run("verify:verify", {
      address: factory.address,
      constructorArguments: [
        nymLibUpgradeableProxy.address,
        priceOracleUpgradeableProxy.address,
        network_.Global.ownerAddress,
        proxyAdmin.address,
        impl.address,
        biconomyMetaTxRelay.address,
      ],
      contract: "contracts/NFT/NymFashion/NymFashionNftFactory.sol:NymFashionNftFactory",
    });
  } catch(e) {
  }
};
module.exports.tags = ["polygonMainnet_NymFashionNft_verify"];
