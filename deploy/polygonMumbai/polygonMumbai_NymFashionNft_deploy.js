const { ethers } = require("hardhat");
const { polygonMumbai: network_ } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  const proxyAdmin = await ethers.getContract("ProxyAdmin");
  const biconomyMetaTxRelay = await ethers.getContract("BiconomyMetaTxRelayUpgradeableProxy");

  console.log("Now deploying BaseNftUpgradeable on Polygon Mumbai...");
  const baseNftUpgradeable = await deploy("BaseNftUpgradeable", {
    from: deployer.address,
  });
  console.log("BaseNftUpgradeable template contract address: ", baseNftUpgradeable.address);

  // console.log("Now deploying NymFashionNftUpgradeableProxy for just verification on Polygon Mumbai...");
  // const implArtifact = await deployments.getArtifact("BaseNftUpgradeable");
  // const iface = new ethers.utils.Interface(JSON.stringify(implArtifact.abi));
  // const data = iface.encodeFunctionData("initialize", [
  //   network_.Global.ownerAddress,
  //   "",
  //   "",
  //   "",
  //   1,
  //   "1000000000000000000",
  //   network_.ZONE.tokenAddress,
  //   network_.Global.slpZoneEth,
  //   false,
  //   false,
  //   []
  // ]);
  // const proxyContract = await deploy("NymFashionNftUpgradeableProxy", {
  //   from: deployer.address,
  //   args: [
  //     baseNftUpgradeable.address,
  //     proxyAdmin.address,
  //     data,
  //   ],
  // });
  // console.log("NymFashionNftUpgradeableProxy template contract address: ", proxyContract.address);

  console.log("Now deploying NymFashionNftFactory on Polygon Mumbai...");
  const factory = await deploy("NymFashionNftFactory", {
    from: deployer.address,
    args: [
      network_.Global.ownerAddress,
      proxyAdmin.address,
      baseNftUpgradeable.address,
      network_.ZONE.tokenAddress,
      network_.Global.slpZoneEth,
      biconomyMetaTxRelay.address,
    ],
  });
  console.log("NymFashionNftFactory contract address: ", factory.address);
};
module.exports.tags = ["polygonMumbai_NymFashionNft_deploy"];
