const { network } = require("hardhat");
const { polygonMainnet: network_ } = require("../../parameters");

module.exports = async () => {

  await network.provider.request({method: "hardhat_impersonateAccount", params: [network_.Global.ownerAddress]});
};

module.exports.tags = ["hardhat_polygonMainnet"];
module.exports.dependencies = [
  "hardhat_reset",
  "polygonMainnet"
];
