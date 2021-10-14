const { deployments } = require("hardhat");

module.exports = async () => {
};

module.exports.tags = ["mainnet"];
module.exports.dependencies = [
  "mainnet_ProxyAdmin_deploy",
  "mainnet_NymLibUpgradeable",
  "mainnet_NYM_deploy",
  "mainnet_GenesisSaleRewardAirdrop_deploy",
  "mainnet_PublicSaleUpgradeable_deploy",
  "mainnet_ProxyAdmin_verify",
  "mainnet_NYM_verify",
  "mainnet_GenesisSaleRewardAirdrop_verify",
  "mainnet_PublicSaleUpgradeable_verify",
];
