const { network } = require("hardhat");
const { mainnet: network_ } = require("../../parameters");
const { increaseTime } = require('../../test/utils/Ethereum');

const ERC20_ABI = require("../../node_modules/@openzeppelin/contracts/build/contracts/ERC20.json").abi;
const UniswapV2Locker_ABI = require('../../abis/UniswapV2Locker_ABI.json');

// const uniswapV2LockerAddress = "0x663a5c229c09b049e36dcc11a9b0d4a8eb9db214";
const lpHolderAddress = "0x7579ce1010a6ba4ad44c07bece89249023031043";

module.exports = async () => {

  await network.provider.request({method: "hardhat_impersonateAccount", params: [network_.Global.ownerAddress]});
  await network.provider.request({method: "hardhat_impersonateAccount", params: [network_.ZONE.vaultAddress]});

  // // Transfer UniV2 ZONE-ETH from unlocked account to deployer
  // const owner = await ethers.getSigner(network_.Global.ownerAddress);
  // const uniswapV2Locker = new ethers.Contract(uniswapV2LockerAddress, UniswapV2Locker_ABI, owner);
  // await increaseTime(3600*24*365);
  // await uniswapV2Locker.withdraw(network_.PriceOracle.lpZoneEth, 0, 0, '5856918985268619881152')
  // const lp = new ethers.Contract(network_.PriceOracle.lpZoneEth, ERC20_ABI, owner);
  // await lp.transfer(deployer.address, await lp.balanceOf(owner.address));

  // Transfer UniV2 ZONE-ETH to deployer
  await network.provider.request({method: "hardhat_impersonateAccount", params: [lpHolderAddress]});
  const lpHolder = await ethers.getSigner(lpHolderAddress);
  const lp = new ethers.Contract(network_.PriceOracle.lpZoneEth, ERC20_ABI, lpHolder);
  await lp.transfer(deployer.address, await lp.balanceOf(lpHolder.address));
};

module.exports.tags = ["hardhat_mainnet_lpStaking"];
module.exports.dependencies = [
  "hardhat_reset",
  "mainnet_NymLibUpgradeable",
  "mainnet_PriceOracleUpgradeable",
  "mainnet_RideNft",
  "mainnet_LPStakingUpgradeable",
];
