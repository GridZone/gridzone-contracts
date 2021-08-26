const { ethers } = require("hardhat");
const { polygonMainnet: network_ } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  const proxyAdmin = await ethers.getContract("ProxyAdmin");
  const nymLibUpgradeableProxy = await deployments.get("NymLibUpgradeableProxy");
  const priceOracleUpgradeableProxy = await deployments.get("PriceOracleUpgradeableProxy");
  const biconomyMetaTxRelay = await ethers.getContract("BiconomyMetaTxRelayUpgradeableProxy");

  console.log("Now deploying BaseNftUpgradeable on Polygon Mainnet...");
  const impl = await deploy("BaseNftUpgradeable", {
    from: deployer.address,
  });
  console.log("BaseNftUpgradeable template contract address: ", impl.address);

  // console.log("Now deploying NymFashionNftUpgradeableProxy for just verification on Polygon Mainnet...");
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
  // const proxyContract = await deploy("NymFashionNftUpgradeableProxy", {
  //   from: deployer.address,
  //   args: [
  //     impl.address,
  //     proxyAdmin.address,
  //     data,
  //   ],
  // });
  // console.log("NymFashionNftUpgradeableProxy template contract address: ", proxyContract.address);

  console.log("Now deploying NymFashionNftFactory on Polygon Mainnet...");
  const factory = await deploy("NymFashionNftFactory", {
    from: deployer.address,
    args: [
      nymLibUpgradeableProxy.address,
      priceOracleUpgradeableProxy.address,
      network_.Global.ownerAddress,
      proxyAdmin.address,
      impl.address,
      biconomyMetaTxRelay.address,
    ],
  });
  console.log("NymFashionNftFactory contract address: ", factory.address);
};
module.exports.tags = ["polygonMainnet_NymFashionNft_deploy"];
