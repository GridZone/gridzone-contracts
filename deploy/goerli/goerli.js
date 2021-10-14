const { deployments } = require("hardhat");

module.exports = async () => {
};
module.exports.tags = ["goerli"];
module.exports.dependencies = [
  "goerli_ProxyAdmin_deploy",
  "goerli_NymLibUpgradeable",
  "goerli_NYM_deploy",
  "goerli_GenesisSaleRewardAirdrop_deploy",
  "goerli_PublicSaleUpgradeable_deploy",
  "goerli_ProxyAdmin_verify",
  "goerli_NYM_verify",
  "goerli_GenesisSaleRewardAirdrop_verify",
  "goerli_PublicSaleUpgradeable_verify",
];
