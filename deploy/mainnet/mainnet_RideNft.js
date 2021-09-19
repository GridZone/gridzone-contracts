const { ethers, run } = require("hardhat");
const { mainnet: network_, gasPrice } = require("../../parameters");
const { Models } = require("../../parameters/rideNft");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  const nymLibUpgradeableProxy = await deployments.get("NymLibUpgradeableProxy");
  const priceOracleUpgradeableProxy = await deployments.get("PriceOracleUpgradeableProxy");

  console.log("Now deploying MultiModelNftUpgradeable on Mainnet...");
  const impl = await deploy("MultiModelNftUpgradeable", {
    from: deployer.address,
    gasPrice,
  });
  console.log("  MultiModelNftUpgradeable contract address: ", impl.address);

  console.log("Now deploying RideNftUpgradeableProxy on Mainnet...");
  const implArtifact = await deployments.getArtifact("MultiModelNftUpgradeable");
  const iface = new ethers.utils.Interface(JSON.stringify(implArtifact.abi));
  const data = iface.encodeFunctionData("initialize", [
    nymLibUpgradeableProxy.address,
    priceOracleUpgradeableProxy.address,
    deployer.address, // To call addModels, the deployer is set as the owner.
    "GridZone Rides",
    "GZR",
    true,
    true
  ]);
  const proxyContract = await deploy("RideNftUpgradeableProxy", {
    from: deployer.address,
    args: [
      impl.address,
      network_.Global.proxyAdmin,
      data,
    ],
    gasPrice,
  });
  console.log("  RideNftUpgradeableProxy contract address: ", proxyContract.address);

  console.log("Now adding models to the RideNftContracts...");
  const MultiModelNftUpgradeable = await ethers.getContractFactory("MultiModelNftUpgradeable");
  const rideNft = MultiModelNftUpgradeable.attach(proxyContract.address);
  await rideNft.addModels(
    Models.classes,
    Models.names,
    Models.metafileUris,
    Models.capacities,
    Models.mintPrices,
    Models.defaultColors,
    Models.bonuses,
    { gasPrice }
  );
  await rideNft.safeTransferOwnership(network_.Global.ownerAddress, false, { gasPrice });

  console.log("  Verifing contracts");
  try {
    await run("verify:verify", {
      address: impl.address,
      contract: "contracts/NFT/base/MultiModelNftUpgradeable.sol:MultiModelNftUpgradeable",
    });
  } catch(e) {
  }
  try {
    await run("verify:verify", {
      address: proxyContract.address,
      constructorArguments: [
        impl.address,
        network_.Global.proxyAdmin,
        data,
      ],
      contract: "contracts/NFT/Ride/RideNftUpgradeableProxy.sol:RideNftUpgradeableProxy",
    });
  } catch(e) {
  }
};
module.exports.tags = ["mainnet_RideNft"];
