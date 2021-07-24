const { ethers } = require("hardhat");
const { polygonMainnet: network_ } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  console.log("Now deploying ProxyAdmin on Polygon Mainnet...");
  const proxyAdmin = await deploy("ProxyAdmin", {
    from: deployer.address,
    args: [
      network_.Global.ownerAddress,
    ],
  });
  console.log("ProxyAdmin contract address: ", proxyAdmin.address);
};
module.exports.tags = ["polygonMainnet_ProxyAdmin_deploy"];
