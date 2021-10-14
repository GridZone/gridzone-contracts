const { expect } = require("chai");
const { assert, ethers, deployments } = require("hardhat");
const { expectRevert } = require('@openzeppelin/test-helpers');
const { BigNumber, utils } = ethers;
const parseEther = utils.parseEther;

const { mainnet: network_ } = require("../../parameters");
const ZONE_ABI = require("../../abis/ZONE_ABI.json");
const { sendEth, increaseTime, blockTimestamp, blockNumber, UInt256Max, AddressZero } = require('../utils/Ethereum');

const SECONDS_IN_DAY = 24 * 3600;
const LP_LOCKED_AMOUNT = '5856918985268619881152';

const STAKE_STAKED_AMOUNT = 0;
const STAKE_CLAIM_IN = 1;
const STAKE_REWARD_AMOUNT = 2;
const STAKE_REWARD_NFT_ADDRESS = 3;
const STAKE_REWARD_NFT_MODEL = 4;
const STAKE_REWARD_NFT_PRICE = 5;

const getMultiplier = (from, to) => {
  return Math.floor((to-from)/60);
}

describe("LPStakingUpgradeable", async () => {

    let owner, vault;
    let zoneToken, lp, contract, rideNft;
    let contractArtifact, multiModelNftArtifact;
    
    before(async () => {
      [deployer, a1, a2, ...accounts] = await ethers.getSigners();
  
      contractArtifact = await deployments.getArtifact("LPStakingUpgradeable");
      multiModelNftArtifact = await deployments.getArtifact("MultiModelNftUpgradeable");
  
      owner = await ethers.getSigner(network_.Global.ownerAddress);
      vault = await ethers.getSigner(network_.ZONE.vaultAddress);
      zoneToken = new ethers.Contract(network_.ZONE.tokenAddress, ZONE_ABI, a1);
      lp = new ethers.Contract(network_.PriceOracle.lpZoneEth, ZONE_ABI, a1);
    });
  
    beforeEach(async () => {
      await deployments.fixture(["hardhat_mainnet_lpStaking"])
  
      const proxyContract = await ethers.getContract("LPStakingUpgradeableProxy");
      contract = new ethers.Contract(proxyContract.address, contractArtifact.abi, a1);
  
      const rideNftProxyContract = await ethers.getContract("RideNftUpgradeableProxy");
      rideNft = new ethers.Contract(rideNftProxyContract.address, multiModelNftArtifact.abi, a1);
      
      await sendEth(a1.address, owner.address, '1');
      await contract.connect(owner).setRewardNfts([rideNft.address,rideNft.address,rideNft.address], [0,1,5], [parseEther('0.1'),parseEther('0.5'),parseEther('2')]);
    });

    describe('basic', () => {
      it("Should be set with correct initial vaule", async () => {
        expect(await contract.owner()).equal(network_.Global.ownerAddress);
        expect(await contract.minDepositAmountInEth()).equal(network_.LPStaking.minDepositAmountInEth);
        expect(await contract.lockPeriod()).equal(180 * SECONDS_IN_DAY);
        expect(await contract.zonePerMinute()).equal(network_.LPStaking.zonePerMinute);
        expect(await contract.rewardInZoneEnabled()).equal(true);
        expect(await contract.rewardInNftEnabled()).equal(true);
        expect((await contract.START_TIME()).toNumber()).greaterThan(0);

        expect(await contract.zoneToken()).equal(zoneToken.address);
        const priceOracleUpgradeableProxy = await ethers.getContract("PriceOracleUpgradeableProxy");
        expect(await contract.priceOracle()).equal(priceOracleUpgradeableProxy.address);

        expect(await contract.poolLength()).equal(1);
        expect(await contract.totalPoolWeight()).equal(100);

        const pool0 = await contract.pool(0);
        expect(pool0["lpTokenAddress"]).equal(network_.PriceOracle.lpZoneEth);
        expect(pool0["poolWeight"]).equal(100);
        expect(pool0["lastRewardTime"]).equal((await contract.START_TIME()));
        expect(pool0["accZONEPerLP"]).equal(0);
        expect(pool0["pid"]).equal(0);

        const _pool0 = await contract.poolMap(network_.PriceOracle.lpZoneEth);
        expect(_pool0["lpTokenAddress"]).equal(network_.PriceOracle.lpZoneEth);

        expect(await contract.nftAddresses(0)).equal(rideNft.address);
        expect(await contract.nftAddresses(1)).equal(rideNft.address);
        expect(await contract.nftAddresses(2)).equal(rideNft.address);
        expect(await contract.nftModels(0)).equal(0);
        expect(await contract.nftModels(1)).equal(1);
        expect(await contract.nftModels(2)).equal(5);
        expect(await contract.nftPrices(0)).equal(parseEther('0.1'));
        expect(await contract.nftPrices(1)).equal(parseEther('0.5'));
        expect(await contract.nftPrices(2)).equal(parseEther('2'));
      });

      it("Should succeed to do setups", async () => {
        await expectRevert(contract.setGovernorTimelock(deployer.address), "Ownable: caller is not the owner");
        await contract.connect(owner).setGovernorTimelock(deployer.address);

        await expectRevert(contract.setLockPeriod(SECONDS_IN_DAY), "The caller should be owner or governor");
        await expectRevert(contract.connect(owner).setLockPeriod(30*SECONDS_IN_DAY - 1), "lockDay should be equal or greater than 30 day");
        await contract.connect(owner).setLockPeriod(30*SECONDS_IN_DAY);
        await contract.connect(deployer).setLockPeriod(90 * SECONDS_IN_DAY);

        await expectRevert(contract.setZonePerMinute(parseEther('3')), "The caller should be owner or governor");
        await contract.connect(owner).setZonePerMinute(parseEther('3'));
        expect(await contract.zonePerMinute()).equal(parseEther('3'));

        await expectRevert(contract.enableRewardInZone(false), "The caller should be owner or governor");
        await contract.connect(owner).enableRewardInZone(false);
        expect(await contract.rewardInZoneEnabled()).equal(false);

        await expectRevert(contract.enableRewardInNft(false), "The caller should be owner or governor");
        await contract.connect(owner).enableRewardInNft(false);
        expect(await contract.rewardInNftEnabled()).equal(false);

        await expectRevert(contract.setRewardNfts([rideNft.address], [11], [parseEther('1.2')]), "Ownable: caller is not the owner");
        await contract.connect(owner).setRewardNfts([rideNft.address], [11], [parseEther('1.2')]);
        expect(await contract.nftAddresses(0)).equal(rideNft.address);
        expect(await contract.nftModels(0)).equal(11);
        expect(await contract.nftPrices(0)).equal(parseEther('1.2'));
      });

      it("Should succeed to set the minimum deposit amount", async () => {
        await expectRevert(contract.setMinDepositAmountInEth(parseEther('1')), "The caller should be owner or governor");
        await contract.connect(owner).setMinDepositAmountInEth(parseEther('1'));
        expect(await contract.minDepositAmountInEth()).equal(parseEther('1'));

        const minDepositLpAmount = await contract.getMinDepositLpAmount();
        await contract.connect(owner).setMinDepositAmountInEth(parseEther('0.1'));
        expect(await contract.getMinDepositLpAmount()).equal(minDepositLpAmount.div(10));
      });

      it("Should succeed to add new pools", async () => {
        // add a new pool (pool 1 -> ZONE, pool weight 200)
        await contract.connect(owner).addPool(zoneToken.address, 200, true);
        expect(await contract.poolLength()).equal(2);
        expect(await contract.totalPoolWeight()).equal(300);

        const pool1 = await contract.pool(1);
        expect(pool1["lpTokenAddress"]).equal(zoneToken.address);
        expect(pool1["poolWeight"]).equal(200);
        expect(pool1["lastRewardTime"]).equal(await blockTimestamp());
        expect(pool1["accZONEPerLP"]).equal(0);
        expect(pool1["pid"]).equal(1);

        const _pool1 = await contract.poolMap(zoneToken.address);
        expect(_pool1["lpTokenAddress"]).equal(zoneToken.address);
      });

      it("Should be correct totalFinishedZONE", async () => {
        var blockTime;
        var lastFinishUpdateTime = await contract.START_TIME();
        var totalFinishedZONE = BigNumber.from(0);

        await increaseTime(SECONDS_IN_DAY);
        blockTime = parseInt(await blockTimestamp());
        totalFinishedZONE = totalFinishedZONE.add((await contract.zonePerMinute()).mul(getMultiplier(lastFinishUpdateTime,blockTime)));
        expect(await contract.totalFinishedZONE()).equal(totalFinishedZONE);

        await contract.connect(owner).setZonePerMinute(parseEther('3'));
        lastFinishUpdateTime = parseInt(await blockTimestamp());

        await increaseTime(SECONDS_IN_DAY);
        blockTime = parseInt(await blockTimestamp());
        totalFinishedZONE = totalFinishedZONE.add((await contract.zonePerMinute()).mul(getMultiplier(lastFinishUpdateTime,blockTime)));
        expect(await contract.totalFinishedZONE()).equal(totalFinishedZONE);
      });

      it("Should be finished correctly", async () => {
        await zoneToken.connect(owner).transfer(vault.address, (await zoneToken.balanceOf(owner.address)));
        const balance = await zoneToken.balanceOf(vault.address);
        await zoneToken.connect(vault).transfer(contract.address, balance);
        expect(await zoneToken.balanceOf(contract.address)).equal(balance);

        await lp.connect(deployer).transfer(a1.address, parseEther('1000'));
        await lp.connect(a1).approve(contract.address, parseEther('1000'));
        await contract.connect(a1).deposit(0, parseEther('1000'));

        await expectRevert(contract.finish(), "The caller should be owner or governor");
        await contract.connect(owner).finish();
        expect(await zoneToken.balanceOf(contract.address)).equal(balance); // No token transferred because pool0.lpSupply is greater than 0
        expect(await contract.zonePerMinute()).equal(0);

        // Try again after a year
        await increaseTime(356 * SECONDS_IN_DAY);
        await contract.connect(owner).finish();
        expect(await zoneToken.balanceOf(contract.address)).equal(balance); // No token transferred because pool0.lpSupply is greater than 0

        // Try again after withdraw
        await contract.connect(a1).withdraw(0, parseEther('1000'));
        await contract.connect(owner).finish();
        expect(await zoneToken.balanceOf(contract.address)).equal(0);
        expect(await zoneToken.balanceOf(owner.address)).equal(balance);
      });
    });

    describe('deposit', () => {
      it("Should succeed to deposit", async () => {
        var lastRewardTime, blockTime, accZONEPerLP, pendingZONE;

        // add a new pool (pool 1 -> ZONE, pool weight 100)
        await contract.connect(owner).addPool(zoneToken.address, 100, true);

        // user 1 deposits some (5) LP token 1
        await zoneToken.connect(vault).transfer(a1.address, parseEther('10'));
        await zoneToken.connect(a1).approve(contract.address, parseEther('10'));
        await contract.connect(a1).deposit(1, parseEther('5'));

        expect((await contract.pool(1)).accZONEPerLP).equal(0);
        lastRewardTime = parseInt((await contract.pool(1)).lastRewardTime);

        expect((await contract.user(1, a1.address)).lpAmount).equal(parseEther('5'));
        expect((await contract.user(1, a1.address)).finishedZONE).equal(0);
        expect(await zoneToken.balanceOf(a1.address)).equal(parseEther('5'));
        expect(await zoneToken.allowance(a1.address, contract.address)).equal(parseEther('5'));

        // user 2 deposits some (1) LP token 1
        await zoneToken.connect(vault).transfer(a2.address, parseEther('10'));
        await zoneToken.connect(a2).approve(contract.address, parseEther('10'));
        await contract.connect(a2).deposit(1, parseEther('1'));

        blockTime = parseInt(await blockTimestamp());
        accZONEPerLP = network_.LPStaking.zonePerMinute.mul(getMultiplier(lastRewardTime,blockTime)).div(2).div(5);
        expect((await contract.pool(1)).accZONEPerLP).equal(accZONEPerLP);
        lastRewardTime = parseInt((await contract.pool(1)).lastRewardTime);

        expect((await contract.user(1, a2.address)).lpAmount).equal(parseEther('1'));
        expect((await contract.user(1, a2.address)).finishedZONE).equal(accZONEPerLP);
        expect(await zoneToken.balanceOf(a2.address)).equal(parseEther('9'));
        expect(await zoneToken.allowance(a2.address, contract.address)).equal(parseEther('9'));

        // user 1 deposits some (1) LP token 1 again
        await contract.connect(a1).deposit(1, parseEther('1'));

        blockTime = parseInt(await blockTimestamp());
        accZONEPerLP = accZONEPerLP.add(network_.LPStaking.zonePerMinute.mul(getMultiplier(lastRewardTime,blockTime)).div(2).div(6));
        expect((await contract.pool(1)).accZONEPerLP).equal(accZONEPerLP);
        pendingZONE = accZONEPerLP.mul(6-1);
        expect(await contract.pendingZONE(1, a1.address)).equal(pendingZONE);

        expect((await contract.user(1, a1.address)).lpAmount).equal(parseEther('6'));
        expect((await contract.user(1, a1.address)).finishedZONE).equal(accZONEPerLP.mul(6).sub(pendingZONE));
        expect(await zoneToken.balanceOf(a1.address)).equal(parseEther('4'));
        expect(await zoneToken.allowance(a1.address, contract.address)).equal(parseEther('4'));

        // check LP token 1 balance
        expect((await contract.pool(1)).lpSupply).equal(parseEther('7'));
      });

      it("Should succeed to deposit on LP pool", async () => {
        // user 1 deposits some (5000) LP token 0
        await lp.connect(deployer).transfer(a1.address, parseEther('1000'));
        await lp.connect(a1).approve(contract.address, parseEther('1000'));
        await contract.connect(a1).deposit(0, parseEther('10'));

        expect((await contract.user(0, a1.address)).lpAmount).equal(parseEther('10'));
        expect((await contract.user(0, a1.address)).finishedZONE).equal(0);

        const minDepositLpAmount = await contract.getMinDepositLpAmount();
        await expectRevert(contract.connect(a1).deposit(0, minDepositLpAmount.sub(1)), "The worth of LP amount should greater than minimum value");
        await contract.connect(a1).deposit(0, minDepositLpAmount);

        await contract.connect(owner).setMinDepositAmountInEth(0);
        await contract.connect(a1).deposit(0, minDepositLpAmount.sub(1));
      });
    });

    describe('withdraw & claim', () => {
      it("Should succeed to withdraw", async () => {
        var lastRewardTime, blockTime, accZONEPerLP, pendingZONE, finishedZONE, info;

        // add a new pool (pool 1 -> ZONE, pool weight 100)
        await contract.connect(owner).addPool(zoneToken.address, 100, true);

        // user 1 deposits some (5) LP token 1
        await zoneToken.connect(vault).transfer(a1.address, parseEther('10'));
        await zoneToken.connect(a1).approve(contract.address, parseEther('10'));
        await contract.connect(a1).deposit(1, parseEther('5'));

        expect((await contract.pool(1)).accZONEPerLP).equal(0);
        lastRewardTime = parseInt((await contract.pool(1)).lastRewardTime);

        expect((await contract.user(1, a1.address)).lpAmount).equal(parseEther('5'));
        expect((await contract.user(1, a1.address)).finishedZONE).equal(0);
        expect(await zoneToken.balanceOf(a1.address)).equal(parseEther('5'));
        expect(await zoneToken.allowance(a1.address, contract.address)).equal(parseEther('5'));

        await increaseTime(SECONDS_IN_DAY);

        blockTime = parseInt(await blockTimestamp());
        accZONEPerLP = BigNumber.from(0); // no updatePool called
        expect((await contract.pool(1)).accZONEPerLP).equal(accZONEPerLP);
        lastRewardTime = parseInt((await contract.pool(1)).lastRewardTime);
        finishedZONE = 0;
        pendingZONE = network_.LPStaking.zonePerMinute.mul(getMultiplier(lastRewardTime,blockTime)).div(2).div(5).mul(5);

        info = await contract.getStakeInfo(1, a1.address);
        expect(info[STAKE_STAKED_AMOUNT]).equal(parseEther('5'));
        expect(parseInt(info[STAKE_CLAIM_IN])).greaterThan(178 * SECONDS_IN_DAY);
        expect(parseInt(info[STAKE_CLAIM_IN])).lessThanOrEqual(179 * SECONDS_IN_DAY);
        expect(info[STAKE_REWARD_AMOUNT]).equal(pendingZONE);
        expect(info[STAKE_REWARD_NFT_ADDRESS]).equal(rideNft.address);
        expect(info[STAKE_REWARD_NFT_MODEL]).equal(0);
        expect(info[STAKE_REWARD_NFT_PRICE]).equal(parseEther('0.1'));

        // withdraw 1 LP
        await expectRevert(contract.connect(a1).withdraw(1, parseEther('5.1')), "Not enough LP token balance");
        await contract.connect(a1).withdraw(1, parseEther('1'));
        blockTime = parseInt(await blockTimestamp());
        accZONEPerLP = accZONEPerLP.add(network_.LPStaking.zonePerMinute.mul(getMultiplier(lastRewardTime,blockTime)).div(2).div(5));
        expect((await contract.pool(1)).accZONEPerLP).equal(accZONEPerLP);
        lastRewardTime = parseInt((await contract.pool(1)).lastRewardTime);
        pendingZONE = accZONEPerLP.mul(4);
        finishedZONE = accZONEPerLP.mul(4).sub(pendingZONE);

        expect((await contract.user(1, a1.address)).lpAmount).equal(parseEther('4'));
        expect((await contract.user(1, a1.address)).finishedZONE).equal(accZONEPerLP.mul(4).sub(pendingZONE));
        expect(await contract.pendingZONE(1, a1.address)).equal(pendingZONE);
        expect(await zoneToken.balanceOf(a1.address)).equal(parseEther('6'));
        expect((await contract.pool(1)).lpSupply).equal(parseEther('4'));

        info = await contract.getStakeInfo(1, a1.address);
        expect(info[STAKE_STAKED_AMOUNT]).equal(parseEther('4'));
        expect(parseInt(info[STAKE_CLAIM_IN])).greaterThan(179 * SECONDS_IN_DAY);
        expect(parseInt(info[STAKE_CLAIM_IN])).lessThanOrEqual(180 * SECONDS_IN_DAY);
        expect(info[STAKE_REWARD_AMOUNT]).equal(pendingZONE);
        expect(info[STAKE_REWARD_NFT_ADDRESS]).equal(rideNft.address);
        expect(info[STAKE_REWARD_NFT_MODEL]).equal(0);
        expect(info[STAKE_REWARD_NFT_PRICE]).equal(parseEther('0.1'));

        // withdraw 1 LP again
        await increaseTime(5*SECONDS_IN_DAY);
        await contract.connect(a1).withdraw(1, parseEther('1'));
        blockTime = parseInt(await blockTimestamp());
        accZONEPerLP = accZONEPerLP.add(network_.LPStaking.zonePerMinute.mul(getMultiplier(lastRewardTime,blockTime)).div(2).div(4));
        expect((await contract.pool(1)).accZONEPerLP).equal(accZONEPerLP);
        lastRewardTime = parseInt((await contract.pool(1)).lastRewardTime);
        pendingZONE = accZONEPerLP.mul(3);
        finishedZONE = accZONEPerLP.mul(3).sub(pendingZONE);

        expect((await contract.user(1, a1.address)).lpAmount).equal(parseEther('3'));
        expect((await contract.user(1, a1.address)).finishedZONE).equal(finishedZONE);
        expect(await contract.pendingZONE(1, a1.address)).equal(pendingZONE);
        expect(await zoneToken.balanceOf(a1.address)).equal(parseEther('7'));
        expect((await contract.pool(1)).lpSupply).equal(parseEther('3'));

        info = await contract.getStakeInfo(1, a1.address);
        expect(info[STAKE_STAKED_AMOUNT]).equal(parseEther('3'));
        expect(parseInt(info[STAKE_CLAIM_IN])).greaterThan(179 * SECONDS_IN_DAY);
        expect(parseInt(info[STAKE_CLAIM_IN])).lessThanOrEqual(180 * SECONDS_IN_DAY);
        expect(info[STAKE_REWARD_AMOUNT]).equal(pendingZONE);
        expect(info[STAKE_REWARD_NFT_ADDRESS]).equal(rideNft.address);
        expect(info[STAKE_REWARD_NFT_MODEL]).equal(1);
        expect(info[STAKE_REWARD_NFT_PRICE]).equal(parseEther('0.5'));

        // user 1 deposits some (1) LP token 1 again
        await increaseTime(5*SECONDS_IN_DAY);
        await contract.connect(a1).deposit(1, parseEther('1'));
        blockTime = parseInt(await blockTimestamp());
        accZONEPerLP = accZONEPerLP.add(network_.LPStaking.zonePerMinute.mul(getMultiplier(lastRewardTime,blockTime)).div(2).div(3));
        expect((await contract.pool(1)).accZONEPerLP).equal(accZONEPerLP);
        lastRewardTime = parseInt((await contract.pool(1)).lastRewardTime);
        pendingZONE = accZONEPerLP.mul(3).sub(finishedZONE);
        finishedZONE = accZONEPerLP.mul(4).sub(pendingZONE);

        expect((await contract.user(1, a1.address)).lpAmount).equal(parseEther('4'));
        expect((await contract.user(1, a1.address)).finishedZONE).equal(finishedZONE);
        expect(await contract.pendingZONE(1, a1.address)).equal(pendingZONE);

        // withdraw all LP
        await increaseTime(175*SECONDS_IN_DAY);
        info = await contract.getStakeInfo(1, a1.address);
        expect(parseInt(info[STAKE_CLAIM_IN])).equal(0);
        expect(info[STAKE_REWARD_NFT_ADDRESS]).equal(rideNft.address);
        expect(info[STAKE_REWARD_NFT_MODEL]).equal(5);
        expect(info[STAKE_REWARD_NFT_PRICE]).equal(parseEther('2'));

        await expectRevert(contract.connect(a1).withdraw(1, parseEther('4')), "MultiModelNft: Restricted access to minters");
        const role = await rideNft.ALLOWED_MINTERS();
        await expectRevert(rideNft.grantRole(role, contract.address), "AccessControl: sender must be an admin to grant");
        await rideNft.connect(owner).grantRole(role, contract.address);

        await zoneToken.connect(vault).approve(contract.address, parseEther('1000000'));
        await contract.fund(vault.address, parseEther('1000000'));

        await contract.connect(a1).withdraw(1, parseEther('4'));
        blockTime = parseInt(await blockTimestamp());
        accZONEPerLP = accZONEPerLP.add(network_.LPStaking.zonePerMinute.mul(getMultiplier(lastRewardTime,blockTime)).div(2).div(4));
        expect((await contract.pool(1)).accZONEPerLP).equal(accZONEPerLP);

        expect((await contract.user(1, a1.address)).lpAmount).equal(0);
        expect((await contract.user(1, a1.address)).finishedZONE).equal(0);
        expect(await contract.pendingZONE(1, a1.address)).equal(0);
        expect((await contract.pool(1)).lpSupply).equal(0);
      });

      it("Should succeed to claim", async () => {
        var lastRewardTime, blockTime, accZONEPerLP, info, lpSupply;
        lpSupply = BigNumber.from(LP_LOCKED_AMOUNT).add(parseEther('1000'));

        await expectRevert(contract.connect(a1).claim(0), "No pending ZONE to reward");

        await lp.connect(deployer).transfer(a1.address, parseEther('1000'));
        await lp.connect(a1).approve(contract.address, parseEther('1000'));
        await contract.connect(a1).deposit(0, parseEther('1000'));

        expect((await contract.pool(0)).accZONEPerLP).equal(0);
        lastRewardTime = parseInt((await contract.pool(0)).lastRewardTime);

        expect((await contract.pool(0)).lpSupply).equal(lpSupply);
        expect((await contract.user(0, a1.address)).lpAmount).equal(parseEther('1000'));
        expect((await contract.user(0, a1.address)).finishedZONE).equal(0);

        await increaseTime(SECONDS_IN_DAY);
        await expectRevert(contract.connect(a1).claim(0), "The reward not allowed yet. please wait for more");

        // claim
        await increaseTime(180*SECONDS_IN_DAY);
        info = await contract.getStakeInfo(0, a1.address);
        expect(parseInt(info[STAKE_CLAIM_IN])).equal(0);
        expect(info[STAKE_REWARD_NFT_ADDRESS]).equal(rideNft.address);
        expect(info[STAKE_REWARD_NFT_MODEL]).equal(5);
        expect(info[STAKE_REWARD_NFT_PRICE]).equal(parseEther('2'));

        await expectRevert(contract.connect(a1).claim(0), "MultiModelNft: Restricted access to minters");
        const role = await rideNft.ALLOWED_MINTERS();
        await rideNft.connect(owner).grantRole(role, contract.address);
        await expectRevert(rideNft.setModelAirdropCapacities([5],[1]), "Ownable: caller is not the owner");
        await rideNft.connect(owner).setModelAirdropCapacities([5],[1]);
        await zoneToken.connect(vault).approve(contract.address, parseEther('1000000'));
        await contract.fund(vault.address, parseEther('1000000'));

        await contract.connect(a1).claim(0);
        blockTime = parseInt(await blockTimestamp());
        
        accZONEPerLP = network_.LPStaking.zonePerMinute.mul(getMultiplier(lastRewardTime,blockTime)).mul(parseEther('1')).div(lpSupply);
        expect((await contract.pool(0)).accZONEPerLP).equal(accZONEPerLP);
        lastRewardTime = parseInt((await contract.pool(0)).lastRewardTime);

        expect((await contract.user(0, a1.address)).lpAmount).equal(parseEther('1000'));
        expect((await contract.user(0, a1.address)).finishedZONE).equal(accZONEPerLP.mul(1000));
        expect(await contract.pendingZONE(0, a1.address)).equal(0);
        expect((await contract.pool(0)).lpSupply).equal(lpSupply);

        info = await contract.getStakeInfo(0, a1.address);
        expect(info[STAKE_STAKED_AMOUNT]).equal(parseEther('1000'));
        expect(parseInt(info[STAKE_CLAIM_IN])).equal(0);

        // Check if the other NFT is chosen
        await increaseTime(190*SECONDS_IN_DAY);
        info = await contract.getStakeInfo(0, a1.address);
        expect(info[STAKE_REWARD_NFT_ADDRESS]).equal(rideNft.address);
        expect(info[STAKE_REWARD_NFT_MODEL]).equal(1);
        expect(info[STAKE_REWARD_NFT_PRICE]).equal(parseEther('0.5'));

        await contract.connect(a1).updatePool(0);
        expect((await contract.pool(0)).lpSupply).equal(parseEther('1000'));
        blockTime = parseInt(await blockTimestamp());
        accZONEPerLP = accZONEPerLP.add(network_.LPStaking.zonePerMinute.mul(getMultiplier(lastRewardTime,blockTime)).mul(parseEther('1')).div(lpSupply));
        expect((await contract.pool(0)).accZONEPerLP).equal(accZONEPerLP);
        lastRewardTime = parseInt((await contract.pool(0)).lastRewardTime);

        await increaseTime(180*SECONDS_IN_DAY);
        await contract.connect(a1).updatePool(0);
        blockTime = parseInt(await blockTimestamp());
        accZONEPerLP = accZONEPerLP.add(network_.LPStaking.zonePerMinute.mul(getMultiplier(lastRewardTime,blockTime)).mul(parseEther('1')).div(parseEther('1000')));
        expect((await contract.pool(0)).accZONEPerLP).equal(accZONEPerLP);
      });

      it("Should succeed to emergency withdraw", async () => {
        await lp.connect(deployer).transfer(a1.address, parseEther('1000'));
        await lp.connect(a1).approve(contract.address, parseEther('1000'));
        await contract.connect(a1).deposit(0, parseEther('1000'));

        expect((await contract.pool(0)).accZONEPerLP).equal(0);
        expect(await lp.balanceOf(a1.address)).equal(0);
        expect((await contract.user(0, a1.address)).lpAmount).equal(parseEther('1000'));
        expect((await contract.user(0, a1.address)).finishedZONE).equal(0);

        await increaseTime(SECONDS_IN_DAY);

        // user 1 emergency withdraws LP token 1 
        await contract.connect(a1).emergencyWithdraw(0);
        expect(await lp.balanceOf(a1.address)).equal(parseEther('1000'));
        expect((await contract.user(0, a1.address))[0]).equal(0);
      });
    });
});