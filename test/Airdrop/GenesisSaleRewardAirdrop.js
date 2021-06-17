const { expect } = require("chai")
const { ethers, deployments } = require("hardhat")
const { expectRevert } = require('@openzeppelin/test-helpers');

const { BigNumber } = require('bignumber.js');
BigNumber.config({
  EXPONENTIAL_AT: 1e+9,
  ROUNDING_MODE: BigNumber.ROUND_FLOOR,
})

const { mainnet: network_ } = require("../../parameters")
const ZONE_ABI = require('../../abis/ZONE_ABI.json');

const {
  sendEth,
} = require('../utils/Ethereum');

describe('GenesisSaleRewardAirdrop', () => {

  const DENOMINATOR = 10000;
  const rewardSupply = (new BigNumber(140000)).shiftedBy(18);
  const totalPurchasedAmount = new BigNumber(2701961400002000000000000);
  const rewardRate = rewardSupply.multipliedBy(DENOMINATOR).dividedBy(totalPurchasedAmount).integerValue();
  const rewardsCount = 41;

  const account1 = '0xAE2a5Bca8E91b1e628453F46636632D7865a5B76';
  const purchased1 = 4876597000000000000000;

  let owner, vault, admin;
  let zoneToken, airdropContract;

  beforeEach(async () => {
    [deployer, a1, a2, ...accounts] = await ethers.getSigners();

    await deployments.fixture(["hardhat"])

    owner = await ethers.getSigner(network_.ZONE.ownerAddress);
    vault = await ethers.getSigner(network_.ZONE.vaultAddress);
    admin = await ethers.getSigner(network_.GenesisSaleRewardAirdrop.adminAddress);

    zoneToken = new ethers.Contract(network_.ZONE.tokenAddress, ZONE_ABI, deployer);
    airdropContract = await ethers.getContract("GenesisSaleRewardAirdrop")
  });

  describe('metadata', () => {
    it('should has the correct addresses', async () => {
      expect(await airdropContract.owner()).to.equal(owner.address);
      expect(await airdropContract.admin()).to.equal(admin.address);
      expect(await airdropContract.zoneToken()).to.equal(zoneToken.address);

      expect(await airdropContract.totalPurchasedAmount()).to.equal(totalPurchasedAmount.toString());
      expect(await airdropContract.rewardRate()).to.equal(rewardRate.toString());
      expect(await airdropContract.rewardsCount()).to.equal(rewardsCount);
    });
  });

  describe('basic condition', () => {
    it('fallback function does not receive the ETH', async () => {
      await expectRevert(sendEth(a1.address, airdropContract.address, '1'), "revert We will not accept ETH");
    });

    it('should has set admin address', async () => {
      sendEth(a1.address, owner.address, '1');
      await expectRevert(airdropContract.setPendingAdmin(a1.address), "revert Ownable: caller is not the owner");
      await airdropContract.connect(owner).setPendingAdmin(a1.address);
      expect(await airdropContract.pendingAdmin()).to.equal(a1.address);

      await expectRevert(airdropContract.acceptAdmin(), "revert acceptAdmin: Call must come from pendingAdmin.");
      await airdropContract.connect(a1).acceptAdmin();
      expect(await airdropContract.admin()).to.equal(a1.address);
    });
  });

  describe('rewards', () => {
    it('should be correct the reward amount', async () => {
      const purchasedAmount = new BigNumber(purchased1);
      const rewardAmount = purchasedAmount.multipliedBy(rewardRate).dividedBy(DENOMINATOR).integerValue();

      const {_purchasedAmount, _rewardAmount} = await airdropContract.getRewardAmount(account1);
      expect(_purchasedAmount).to.equal(purchasedAmount.toString());
      expect(_rewardAmount).to.equal(rewardAmount.toString());

      const {_rewardAmount: _rewardAmount1} = await airdropContract.getRewardAmount(a1.address);
      expect(_rewardAmount1).to.equal(0);
    });

    it('should be activated to claim the rewards. should only admin allowed to claim', async () => {
      sendEth(a1.address, admin.address, '1');
      await expectRevert(airdropContract.claimReward(account1), "revert Restricted Access!");
      await expectRevert(airdropContract.connect(admin).claimReward(account1), "revert The airdrop not activated yet");
    });

    it('should be claimed the rewards', async () => {
      sendEth(a1.address, owner.address, '1');
      sendEth(a1.address, admin.address, '1');
      await zoneToken.connect(vault).transfer(airdropContract.address, rewardSupply.toString());

      // activate airdrop
      await expectRevert(airdropContract.activateAirdrop(true), "revert Ownable: caller is not the owner");
      await airdropContract.connect(owner).activateAirdrop(true);

      // claim
      await airdropContract.connect(admin).claimReward(account1);
      const {_rewardAmount} = await airdropContract.getRewardAmount(account1);
      expect(_rewardAmount).to.equal(0);
      await expectRevert(airdropContract.connect(admin).claimReward(account1), "revert No purchased ZONE token");

      const purchasedAmount = new BigNumber(purchased1);
      const rewardAmount = purchasedAmount.multipliedBy(rewardRate).dividedBy(DENOMINATOR).integerValue();
      expect(await airdropContract.totalRewardedAmount()).to.equal(rewardAmount.toString());
      expect(await airdropContract.rewardedCount()).to.equal(1);

      // withdraw the left token
      const leftAmount = rewardSupply.minus(rewardAmount);
      expect(await zoneToken.balanceOf(airdropContract.address)).to.equal(leftAmount.toString());
      await expectRevert(airdropContract.withdrawLeftToken(), "revert Ownable: caller is not the owner");
      await airdropContract.connect(owner).withdrawLeftToken();
      expect(await zoneToken.balanceOf(airdropContract.address)).to.equal(0);
      expect(await zoneToken.balanceOf(owner.address)).to.equal(leftAmount.toString());
    });
  });

});
