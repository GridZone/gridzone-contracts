const { ethers, run } = require("hardhat");
const { mainnet: network_, gasPrice } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  console.log("Now deploying GridZoneVIPUpgradeable ...");
  const impl = await deploy("GridZoneVIPUpgradeable", {
    from: deployer.address,
    gasPrice,
  });
  console.log("  GridZoneVIPUpgradeable implementation address: ", impl.address);

  const implArtifact = await deployments.getArtifact("GridZoneVIPUpgradeable");
  const iface = new ethers.utils.Interface(JSON.stringify(implArtifact.abi));
  const data = iface.encodeFunctionData("initialize", [
    network_.Global.ownerAddress,
  ]);

  console.log("Now deploying GridZoneVIPUpgradeableProxy on Mainnet...");
  const proxy = await deploy("GridZoneVIPUpgradeableProxy", {
    from: deployer.address,
    args: [
      impl.address,
      network_.Global.proxyAdmin,
      data,
    ],
    gasPrice,
  });
  console.log("  GridZoneVIPUpgradeableProxy proxy address: ", proxy.address);

  console.log("  Verifing contracts");
  try {
    await run("verify:verify", {
      address: impl.address,
      contract: "contracts/NFT/GridZoneVIP/GridZoneVIPUpgradeable.sol:GridZoneVIPUpgradeable",
    });
  } catch(e) {
  }
  try {
    await run("verify:verify", {
      address: proxy.address,
      constructorArguments: [
        impl.address,
        network_.Global.proxyAdmin,
        data,
      ],
      contract: "contracts/NFT/GridZoneVIP/GridZoneVIPUpgradeable.sol:GridZoneVIPUpgradeableProxy",
    });
  } catch (e) {
  }
};
module.exports.tags = ["mainnet_GridZoneVIPUpgradeable"];
