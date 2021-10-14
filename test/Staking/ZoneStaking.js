const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");
const { expectRevert } = require('@openzeppelin/test-helpers');
const { BigNumber, utils } = ethers;
const parseEther = utils.parseEther;

const { mainnet: network_ } = require("../../parameters");
const ZONE_ABI = require("../../abis/ZONE_ABI.json");
const { sendEth, increaseTime, blockTimestamp, UInt256Max, AddressZero } = require('../utils/Ethereum');

const INFO_AMOUNT = 0;
const INFO_PERIOD = 1;
const INFO_REWARD = 2;
const INFO_ENDED = 3;

const STAKE_STACKED_TS = 1;
const STAKE_UNSTACKED_TS = 2;
const STAKE_STACKED_AMOUNT = 3;
const STAKE_REWARD_AMOUNT = 4;

const SECONDS_IN_DAY = 24 * 3600;

describe('GridZoneStakingUpgradeable', () => {

  let owner, vault;
  let zoneToken, contract;
  let contractArtifact;
  
  before(async () => {
    [deployer, a1, a2, ...accounts] = await ethers.getSigners();

    contractArtifact = await deployments.getArtifact("GridZoneStakingUpgradeable");

    owner = await ethers.getSigner(network_.Global.ownerAddress);
    vault = await ethers.getSigner(network_.ZONE.vaultAddress);
    zoneToken = new ethers.Contract(network_.ZONE.tokenAddress, ZONE_ABI, deployer);
  });

  beforeEach(async () => {
    await deployments.fixture(["hardhat_mainnet_zoneStaking"])

    const proxyContract = await ethers.getContract("GridZoneStakingUpgradeableProxy");
    contract = new ethers.Contract(proxyContract.address, contractArtifact.abi, a1);

    await sendEth(a1.address, owner.address, '1');
  });

  describe('basic', () => {
    it('initial address', async () => {
      expect(await contract.owner()).to.equal(owner.address);
      expect(await contract.token()).to.equal(zoneToken.address);
      expect(await contract.zoneToken()).to.equal(zoneToken.address);
      expect(await contract.vault()).to.equal(network_.ZONE.vaultAddress);
    });

    it('Should be set by only owner', async () => {
      await expectRevert(contract.launchToday(), "Ownable: caller is not the owner");
      await expectRevert(contract.setVault(a2.address), "Ownable: caller is not the owner");
    });
  });

  describe('Staking', () => {
    it('basic', async () => {
      const amount = parseEther('1000');
      await zoneToken.connect(vault).transfer(a1.address, amount);
      await zoneToken.connect(a1).approve(contract.address, UInt256Max());

      // Staking
      await contract.startStake(amount);
      expect(await zoneToken.balanceOf(a1.address)).to.equal('0');
      expect(await zoneToken.balanceOf(contract.address)).to.equal(amount);
      var info = await contract.getStakeInfo(a1.address);
      expect(info[INFO_AMOUNT]).to.equal(amount);
      expect(info[INFO_ENDED]).to.equal(false);

      // Check if stackedPeriod is increased correctly
      await increaseTime(SECONDS_IN_DAY);
      info = await contract.getStakeInfo(a1.address);
      expect(info[INFO_PERIOD]).to.equal(SECONDS_IN_DAY);
      expect(info[INFO_REWARD]).to.equal(0);
    });

    it('Should be disabled the double staking', async () => {
      const amount = parseEther('1000');
      await zoneToken.connect(vault).transfer(a1.address, amount);
      await zoneToken.connect(a1).approve(contract.address, UInt256Max());

      await contract.startStake(amount);
      await expectRevert(contract.startStake(amount), "This address already staked");
    });

    it('Should be disabled the staking after closed', async () => {
      const amount = parseEther('1000');
      await increaseTime(30 * SECONDS_IN_DAY);
      await expectRevert(contract.startStake(amount), "The staking already closed");
    });
  });

  describe('Unstaking', () => {
    beforeEach(async () => {
      const amount = parseEther('1000');
      await zoneToken.connect(vault).transfer(a1.address, amount);
      await zoneToken.connect(vault).approve(contract.address, UInt256Max());
      await zoneToken.connect(a1).approve(contract.address, UInt256Max());
    });

    it('No reward if unstaked before 30 days', async () => {
      const amount = parseEther('1000');
      await contract.startStake(amount);
      await increaseTime(20 * SECONDS_IN_DAY);
      await contract.endStake();
      expect(await zoneToken.balanceOf(a1.address)).to.equal(amount); // No reward received
      expect(await zoneToken.balanceOf(contract.address)).to.equal('0');
    });

    it('Should be received the reward correctly', async () => {
      const amount = parseEther('1000');
      await contract.startStake(amount);
      await increaseTime(30 * SECONDS_IN_DAY);
      await contract.endStake();

      const REWARD_RATE_NUMERATOR = await contract.REWARD_RATE_NUMERATOR();
      const REWARD_RATE_DENOMINATOR = await contract.REWARD_RATE_DENOMINATOR();
      const stake = await contract.stakes(a1.address);
      const period = Math.floor((stake[STAKE_UNSTACKED_TS]-stake[STAKE_STACKED_TS]) / SECONDS_IN_DAY);
      const rewardAmount = amount.mul(period).mul(REWARD_RATE_NUMERATOR).div(REWARD_RATE_DENOMINATOR)
      expect(stake[STAKE_REWARD_AMOUNT]).to.equal(rewardAmount);
      expect(await zoneToken.balanceOf(a1.address)).to.equal(amount.add(rewardAmount)); // No reward received
    });

    it('Reward should be limited with 90 days', async () => {
      const amount = parseEther('1000');
      await contract.startStake(amount);
      await increaseTime(100 * SECONDS_IN_DAY);
      await contract.endStake();

      const REWARD_RATE_NUMERATOR = await contract.REWARD_RATE_NUMERATOR();
      const REWARD_RATE_DENOMINATOR = await contract.REWARD_RATE_DENOMINATOR();
      const stake = await contract.stakes(a1.address);
      const period = 90;
      const rewardAmount = amount.mul(period).mul(REWARD_RATE_NUMERATOR).div(REWARD_RATE_DENOMINATOR)
      expect(stake[STAKE_REWARD_AMOUNT]).to.equal(rewardAmount);
      expect(await zoneToken.balanceOf(a1.address)).to.equal(amount.add(rewardAmount)); // No reward received
    });
  });
});
