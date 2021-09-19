const { ethers } = require("hardhat");
const { goerli: network_ } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  console.log("Now deploying ProxyAdmin on Goerli...");
  const proxyAdmin = await deploy("ProxyAdmin", {
    from: deployer.address,
    args: [
      network_.Global.ownerAddress,
    ],
  });
  console.log("ProxyAdmin contract address: ", proxyAdmin.address);
};
module.exports.tags = ["goerli_ProxyAdmin_deploy"];
