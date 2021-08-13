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

  console.log("Now deploying RideNftFactory on Polygon Mainnet...");
  const factory = await deploy("RideNftFactory", {
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
  console.log("RideNftFactory contract address: ", factory.address);
};
module.exports.tags = ["polygonMainnet_RideNft_deploy"];
