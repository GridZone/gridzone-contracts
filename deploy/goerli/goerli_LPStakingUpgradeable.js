const { ethers, run } = require("hardhat");
const { BigNumber, utils } = ethers;
const parseEther = utils.parseEther;
const { goerli: network_, gasPrice } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  const priceOracleUpgradeableProxy = await deployments.get("PriceOracleUpgradeableProxy");
  const rideNftUpgradeableProxy = await deployments.get("RideNftUpgradeableProxy");

  console.log("Now deploying LPStakingUpgradeable ...");
  const impl = await deploy("LPStakingUpgradeable", {
    from: deployer.address,
    gasPrice,
  });
  console.log("  LPStakingUpgradeable contract address: ", impl.address);

  const implArtifact = await deployments.getArtifact("LPStakingUpgradeable");
  const iface = new ethers.utils.Interface(JSON.stringify(implArtifact.abi));
  const data = iface.encodeFunctionData("initialize", [
    network_.Global.ownerAddress,
    priceOracleUpgradeableProxy.address,
    network_.LPStaking.zonePerMinute,
    network_.LPStaking.minDepositAmountInEth,
    [rideNftUpgradeableProxy.address, rideNftUpgradeableProxy.address, rideNftUpgradeableProxy.address, rideNftUpgradeableProxy.address],
    [0, 9, 15, 21],
    [parseEther('10'), parseEther('10'), parseEther('10'), parseEther('10')]
  ]);
  const proxyContract = await deploy("LPStakingUpgradeableProxy", {
    from: deployer.address,
    args: [
      impl.address,
      network_.Global.proxyAdmin,
      data,
    ],
    gasPrice,
  });
  console.log("  LPStakingUpgradeableProxy contract address: ", proxyContract.address);


  console.log("  Verifing contracts");
  try {
    await run("verify:verify", {
      address: impl.address,
      contract: "contracts/Staking/LPStakingUpgradeable.sol:LPStakingUpgradeable",
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
      contract: "contracts/Staking/LPStakingUpgradeable.sol:LPStakingUpgradeableProxy",
    });
  } catch(e) {
  }
};
module.exports.tags = ["goerli_LPStakingUpgradeable"];
