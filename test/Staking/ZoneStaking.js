const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");
const { expectRevert } = require('@openzeppelin/test-helpers');
const { BigNumber, utils } = ethers;
const parseEther = utils.parseEther;

const { mainnet: network_ } = require("../../parameters");
const ZONE_ABI = require("../../abis/ZONE_ABI.json");
const { sendEth, increaseTime, blockTimestamp, UInt256Max, AddressZero } = require('../utils/Ethereum');

const TYPE_ENABLE = 0;
const TYPE_LOCK_DAY = 1;
const TYPE_REWARD_RATE = 2;
const TYPE_STAKED_AMOUNT = 3;

const INFO_AMOUNT = 0;
const INFO_TYPE_INDEX = 1;
const INFO_CLAIMIN = 2;
const INFO_REWARD = 3;
const INFO_CAPACITY = 4;

const STAKE_EXIST = 0;
const STAKE_TYPE_INDEX = 1;
const STAKE_STAKED_TS = 2;
const STAKE_UNSTAKED_TS = 3;
const STAKE_STAKED_AMOUNT = 4;
const STAKE_REWARD_AMOUNT = 5;

const SECONDS_IN_DAY = 24 * 3600;
const DENOMINATOR = 10000;

describe('ZoneStakingUpgradeable', () => {

  let owner, vault;
  let zoneToken, contract;
  let contractArtifact;
  
  before(async () => {
    [deployer, a1, a2, ...accounts] = await ethers.getSigners();

    contractArtifact = await deployments.getArtifact("ZoneStakingUpgradeable");

    owner = await ethers.getSigner(network_.Global.ownerAddress);
    vault = await ethers.getSigner(network_.ZONE.vaultAddress);
    zoneToken = new ethers.Contract(network_.ZONE.tokenAddress, ZONE_ABI, deployer);
  });

  beforeEach(async () => {
    await deployments.fixture(["hardhat_mainnet_zoneStaking"])

    const proxyContract = await ethers.getContract("ZoneStakingUpgradeableProxy");
    contract = new ethers.Contract(proxyContract.address, contractArtifact.abi, a1);

    await sendEth(a1.address, owner.address, '1');
  });

  describe('basic', () => {
    it('initial set', async () => {
      expect(await contract.owner()).to.equal(owner.address);
      expect(await contract.zoneToken()).to.equal(zoneToken.address);
      expect(await contract.governorTimelock()).to.equal(network_.ZONE.governorTimelock);
      expect(await contract.totalStakedAmount()).to.equal(0);
      expect(await contract.totalUnstakedAmount()).to.equal(0);
      expect(await contract.stakeLimit()).to.equal(parseEther('2500000'));
      expect(await contract.minStakeAmount()).to.equal(parseEther('1'));
      expect(await contract.earlyUnstakeAllowed()).to.equal(false);
      expect(await contract.isOpen()).to.equal(true);

      const ret = await contract.getAllTypes();
      const enables = ret[0];
      const lockDays = ret[1];
      const rewardRates = ret[2];
      for (var i = 0; i < network_.ZoneStaking.lockDays.length; i ++) {
        const _type = await contract.types(i);
        expect(_type[TYPE_ENABLE]).equal(network_.ZoneStaking.enables[i]);
        expect(_type[TYPE_LOCK_DAY]).equal(network_.ZoneStaking.lockDays[i]);
        expect(_type[TYPE_REWARD_RATE]).equal(network_.ZoneStaking.rewardRates[i]);
        expect(_type[TYPE_STAKED_AMOUNT]).equal(0);
        expect(enables[i]).equal(network_.ZoneStaking.enables[i]);
        expect(lockDays[i]).equal(network_.ZoneStaking.lockDays[i]);
        expect(rewardRates[i]).equal(network_.ZoneStaking.rewardRates[i]);
      }
    });

    it('Should be set by only owner', async () => {
      await expectRevert(contract.setGovernorTimelock(a2.address), "Ownable: caller is not the owner");
      await contract.connect(owner).setGovernorTimelock(a2.address);
      expect(await contract.governorTimelock()).to.equal(a2.address);

      await expectRevert(contract.addTypes([true], [120], [300]), "Ownable: caller is not the owner");
      await contract.connect(owner).addTypes([true], [120], [300]);
      var _type = await contract.types(4);
      expect(_type[TYPE_ENABLE]).equal(true);
      expect(_type[TYPE_LOCK_DAY]).equal(120);
      expect(_type[TYPE_REWARD_RATE]).equal(300);
      expect(_type[TYPE_STAKED_AMOUNT]).equal(0);

      await expectRevert(contract.changeType(4, false, 140, 700), "The caller should be owner or governor");
      await contract.connect(owner).changeType(4, false, 140, 700);
      _type = await contract.types(4);
      expect(_type[TYPE_ENABLE]).equal(false);
      expect(_type[TYPE_LOCK_DAY]).equal(140);
      expect(_type[TYPE_REWARD_RATE]).equal(700);
      expect(_type[TYPE_STAKED_AMOUNT]).equal(0);

      await expectRevert(contract.setStakeLimit(parseEther('1000000')), "The caller should be owner or governor");
      await contract.connect(owner).setStakeLimit(parseEther('1000000'));
      expect(await contract.stakeLimit()).to.equal(parseEther('1000000'));

      await expectRevert(contract.setMinStakeAmount(parseEther('2')), "The caller should be owner or governor");
      await contract.connect(owner).setMinStakeAmount(parseEther('2'));
      expect(await contract.minStakeAmount()).to.equal(parseEther('2'));

      await expectRevert(contract.setEarlyUnstakeAllowed(true), "The caller should be owner or governor");
      await contract.connect(owner).setEarlyUnstakeAllowed(true);
      expect(await contract.earlyUnstakeAllowed()).to.equal(true);

      await expectRevert(contract.finish(), "Ownable: caller is not the owner");
      await contract.connect(owner).finish();
      for (var i = 0; i < network_.ZoneStaking.lockDays.length; i ++) {
        const _type = await contract.types(i);
        expect(_type[TYPE_ENABLE]).equal(false);
      }
    });
  });

  describe('Staking & Unstaking', () => {
    var info, stake, blockTime;

    it('basic', async () => {
      const amount = parseEther('1000');
      await zoneToken.connect(vault).transfer(a1.address, amount);
      await zoneToken.connect(a1).approve(contract.address, UInt256Max());
      const capacity = await contract.stakeLimit();

      info = await contract.getStakeInfo(a1.address);
      expect(info[INFO_AMOUNT]).to.equal(0);
      expect(info[INFO_TYPE_INDEX]).to.equal(0);
      expect(info[INFO_CLAIMIN]).to.equal(0);
      expect(info[INFO_REWARD]).to.equal(0);
      expect(info[INFO_CAPACITY]).to.equal(capacity);

      // Staking
      await contract.startStake(amount, 1);
      expect(await zoneToken.balanceOf(a1.address)).to.equal('0');
      expect(await zoneToken.balanceOf(contract.address)).to.equal(amount);
      expect(await contract.totalStakedAmount()).to.equal(amount);
      expect(await contract.totalUnstakedAmount()).to.equal(0);
      expect((await contract.types(1))[TYPE_STAKED_AMOUNT]).equal(amount);
      blockTime = parseInt(await blockTimestamp());

      stake = await contract.stakes(a1.address);
      expect(stake[STAKE_EXIST]).equal(true);
      expect(stake[STAKE_TYPE_INDEX]).equal(1);
      expect(stake[STAKE_STAKED_TS]).equal(blockTime);
      const stakedTs = parseInt(stake[STAKE_STAKED_TS]);
      const unlockTs = stakedTs + (60 * SECONDS_IN_DAY);
      expect(stake[STAKE_UNSTAKED_TS]).equal(0);
      expect(stake[STAKE_STAKED_AMOUNT]).equal(amount);
      expect(stake[STAKE_REWARD_AMOUNT]).equal(0);

      const reward = amount.mul(network_.ZoneStaking.rewardRates[1]).div(DENOMINATOR);

      // Check before claim is disabled
      info = await contract.getStakeInfo(a1.address);
      expect(info[INFO_AMOUNT]).to.equal(amount);
      expect(info[INFO_TYPE_INDEX]).to.equal(1);
      expect(info[INFO_CLAIMIN]).to.equal(unlockTs - blockTime);
      expect(info[INFO_REWARD]).to.equal(reward);
      expect(info[INFO_CAPACITY]).to.equal(0);

      // Check when calim is enabled
      await increaseTime(61*SECONDS_IN_DAY);
      info = await contract.getStakeInfo(a1.address);
      expect(info[INFO_AMOUNT]).to.equal(amount);
      expect(info[INFO_TYPE_INDEX]).to.equal(1);
      expect(info[INFO_CLAIMIN]).to.equal(0);
      expect(info[INFO_REWARD]).to.equal(reward);
      expect(info[INFO_CAPACITY]).to.equal(0);

      // fund
      await zoneToken.connect(vault).approve(contract.address, parseEther('1000000'));
      await contract.fund(vault.address, parseEther('1000000'));

      // Unstaking
      await contract.endStake();
      expect(await zoneToken.balanceOf(a1.address)).to.equal(amount.add(reward));
      expect(await contract.totalStakedAmount()).to.equal(amount);
      expect(await contract.totalUnstakedAmount()).to.equal(amount);
      expect((await contract.types(1))[TYPE_STAKED_AMOUNT]).equal(0);

      stake = await contract.stakes(a1.address);
      expect(stake[STAKE_EXIST]).equal(true);
      expect(stake[STAKE_TYPE_INDEX]).equal(1);
      blockTime = parseInt(await blockTimestamp());
      expect(stake[STAKE_UNSTAKED_TS]).equal(blockTime);
      expect(stake[STAKE_STAKED_AMOUNT]).equal(amount);
      expect(stake[STAKE_REWARD_AMOUNT]).equal(reward);

      info = await contract.getStakeInfo(a1.address);
      expect(info[INFO_AMOUNT]).to.equal(0);
      expect(info[INFO_TYPE_INDEX]).to.equal(0);
      expect(info[INFO_CLAIMIN]).to.equal(0);
      expect(info[INFO_REWARD]).to.equal(0);
      expect(info[INFO_CAPACITY]).to.equal(capacity.sub(amount));
    });

    it('Should be checked if the amount and type is allowed', async () => {
      const amount = parseEther('1000');
      await zoneToken.connect(vault).transfer(a1.address, amount);
      await zoneToken.connect(a1).approve(contract.address, UInt256Max());

      await expectRevert(contract.startStake(parseEther('0.9'), 1), "The staking amount is too small");
      await expectRevert(contract.startStake(amount, 5), "Invalid typeIndex");
      await expectRevert(contract.startStake(amount, 0), "The type disabled");
    });

    it('Should be disabled to unstake before lock expired', async () => {
      const amount = parseEther('1000');
      await zoneToken.connect(vault).transfer(a1.address, amount);
      await zoneToken.connect(a1).approve(contract.address, UInt256Max());

      await contract.startStake(amount, 1);

      await increaseTime(59*SECONDS_IN_DAY);
      await expectRevert(contract.endStake(), "Locked still");
      await expectRevert(contract.connect(a2).endStake(), "Not staked");

      await contract.connect(owner).setEarlyUnstakeAllowed(true);
      await contract.endStake();
      expect(await zoneToken.balanceOf(a1.address)).to.equal(parseEther('1000'));
    });

    it('Should be disabled the double staking before the unstaking', async () => {
      const amount = parseEther('1000');
      await zoneToken.connect(vault).transfer(a1.address, amount);
      await zoneToken.connect(a1).approve(contract.address, UInt256Max());

      // stake
      await contract.startStake(amount, 1);
      await expectRevert(contract.startStake(amount, 1), "Already staked");

      // fund
      await zoneToken.connect(vault).approve(contract.address, parseEther('1000000'));
      await contract.fund(vault.address, parseEther('1000000'));

      // unstake
      await increaseTime(60*SECONDS_IN_DAY);
      await contract.endStake();

      // restake
      await zoneToken.connect(vault).transfer(a1.address, amount);
      await contract.startStake(amount, 1);
    });

    it('Should be disabled the staking after closed', async () => {
      await contract.connect(owner).setStakeLimit(parseEther('1000000'));

      const amount = parseEther('900000');
      await zoneToken.connect(vault).transfer(a1.address, amount);
      await zoneToken.connect(a1).approve(contract.address, UInt256Max());
      await contract.startStake(amount, 1);

      await zoneToken.connect(vault).transfer(a2.address, parseEther('100001'));
      await zoneToken.connect(a2).approve(contract.address, UInt256Max());
      await expectRevert(contract.connect(a2).startStake(parseEther('100001'), 1), "Exceed the staking limit");
      await contract.connect(a2).startStake(parseEther('100000'), 1);

      expect(await contract.isOpen()).to.equal(false);
      await expectRevert(contract.connect(a2).startStake(parseEther('1'), 1), "Already closed");
    });

    it('No reward transferred if the type disabled', async () => {
      const amount = parseEther('1000');
      await zoneToken.connect(vault).transfer(a1.address, amount);
      await zoneToken.connect(a1).approve(contract.address, UInt256Max());

      // Staking
      await contract.startStake(amount, 1);
      expect(await zoneToken.balanceOf(a1.address)).to.equal('0');
      expect(await zoneToken.balanceOf(contract.address)).to.equal(amount);
      expect(await contract.totalStakedAmount()).to.equal(amount);
      expect(await contract.totalUnstakedAmount()).to.equal(0);
      expect((await contract.types(1))[TYPE_STAKED_AMOUNT]).equal(amount);
      blockTime = parseInt(await blockTimestamp());

      await increaseTime(60*SECONDS_IN_DAY);
      info = await contract.getStakeInfo(a1.address);
      expect(info[INFO_AMOUNT]).to.equal(amount);
      expect(info[INFO_TYPE_INDEX]).to.equal(1);
      expect(info[INFO_CLAIMIN]).to.equal(0);
      const reward = amount.mul(network_.ZoneStaking.rewardRates[1]).div(DENOMINATOR);
      expect(info[INFO_REWARD]).to.equal(reward);
      expect(info[INFO_CAPACITY]).to.equal(0);

      await contract.connect(owner).changeType(1, false, 60, 500);

      info = await contract.getStakeInfo(a1.address);
      expect(info[INFO_AMOUNT]).to.equal(amount);
      expect(info[INFO_TYPE_INDEX]).to.equal(1);
      expect(info[INFO_CLAIMIN]).to.equal(0);
      expect(info[INFO_REWARD]).to.equal(0);
      expect(info[INFO_CAPACITY]).to.equal(0);

      // fund
      await zoneToken.connect(vault).approve(contract.address, parseEther('1000000'));
      await contract.fund(vault.address, parseEther('1000000'));

      expect(await zoneToken.balanceOf(a1.address)).to.equal(0);
      await contract.endStake();
      expect(await zoneToken.balanceOf(a1.address)).to.equal(amount);
    });

    it('The left ZONE should be transferred if finished', async () => {
      const amount = parseEther('1000');
      await zoneToken.connect(vault).transfer(a1.address, amount);
      await zoneToken.connect(a1).approve(contract.address, UInt256Max());

      await contract.startStake(amount, 1);
      await zoneToken.connect(vault).approve(contract.address, parseEther('1000000'));
      await contract.fund(vault.address, parseEther('1000000'));

      expect(await zoneToken.balanceOf(contract.address)).to.equal(parseEther('1001000'));

      const ownerBalance = await zoneToken.balanceOf(owner.address);
      await contract.connect(owner).finish();
      expect(await zoneToken.balanceOf(contract.address)).to.equal(parseEther('1000'));
      expect(await zoneToken.balanceOf(owner.address)).to.equal(ownerBalance.add(parseEther('1000000')));
    });
  });

});
