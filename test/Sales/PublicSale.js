const { expect } = require("chai")
const { deployments, ethers } = require("hardhat")
const {
  BN,           // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

const { BigNumber } = require('bignumber.js');
BigNumber.config({
  EXPONENTIAL_AT: 1e+9,
  ROUNDING_MODE: BigNumber.ROUND_FLOOR,
})

const {
  blockTimestamp,
  etherBalance,
  increaseTime,
  sendEth,
} = require('../utils/Ethereum');

const { mainnet: network_ } = require("../../parameters")
const ZONE_ABI = require('../../abis/ZONE_ABI.json');

describe('PublicSale', () => {

  const publicSupply = (new BigNumber(1400000)).shiftedBy(18);
  const publicEthCapacity = (new BigNumber(284)).shiftedBy(18);
  const saleStartTime = 1630434706;
  const rate = publicSupply.multipliedBy(10).dividedBy(publicEthCapacity).dividedToIntegerBy(12);

  let deployer, owner, vault;
  let zoneToken, contract;
  let contractArtifact;

  before(async () => {
    [deployer, a1, a2, ...accounts] = await ethers.getSigners();

    contractArtifact = await deployments.getArtifact("PublicSaleUpgradeable");

    owner = await ethers.getSigner(network_.Global.ownerAddress);
    vault = await ethers.getSigner(network_.ZONE.vaultAddress);
    zoneToken = new ethers.Contract(network_.ZONE.tokenAddress, ZONE_ABI, deployer);
  });

  beforeEach(async () => {
    await deployments.fixture(["hardhat_mainnet"])

    const publicSaleUpgradeableProxy = await ethers.getContract("PublicSaleUpgradeableProxy");
    contract = new ethers.Contract(publicSaleUpgradeableProxy.address, contractArtifact.abi, a1);
  });

  describe('initial value', () => {
    it('initial address', async () => {
      expect(await contract.owner()).to.equal(owner.address);
      expect(await contract.zoneToken()).to.equal(zoneToken.address);
    });

    it('grants to initial cap and supply', async () => {
      expect(await contract.publicSupply()).to.equal(publicSupply.toString());
      expect(await contract.getPublicSaleEthCapacity()).to.equal(publicEthCapacity.toString());

      expect(await zoneToken.genesisSaleEndTime()).to.equal(saleStartTime);
      expect(await contract.genesisSaleEndTime()).to.equal(saleStartTime);

      expect(await contract.rate()).to.equal(rate.toString());
    });
  });

  describe('basic condition', () => {
    it('fallback function does not receive the ETH', async () => {
      await expectRevert(sendEth(a1.address, contract.address, '1'), "Use the purchase function to buy the ZONE token.");
    });
  });

  describe('Public sale', () => {

    it('minimum purchase amount', async () => {
      await expectRevert(contract.connect(a1).purchase({value: ethers.utils.parseEther('0.01')}), "Public sale is not started");

      const curTime = await blockTimestamp();
      await increaseTime(saleStartTime - curTime);

      await expectRevert(contract.connect(a1).purchase({value: ethers.utils.parseEther('0.009')}), "The purchase minimum amount is 0.01 ETH");
    });

    it('simple purchase', async () => {
      const balance = await zoneToken.balanceOf(vault.address)
      await zoneToken.connect(vault).transfer(contract.address, balance);

      const curTime = await blockTimestamp();
      await increaseTime(saleStartTime - curTime - 1);
      expect(await contract.isCrowdsaleFinished()).to.equal(true);
      await increaseTime(1);
      expect(await contract.isCrowdsaleFinished()).to.equal(false);

      expect(await zoneToken.balanceOf(a1.address)).to.equal('0');
      const amount1 = (new BigNumber(0.01)).shiftedBy(18).multipliedBy(rate).multipliedBy(1.1);
      await contract.connect(a1).purchase({value: (new BigNumber(0.01)).shiftedBy(18).toString()})
      expect(await zoneToken.balanceOf(a1.address)).to.equal(amount1.toString());
    });

    it('purchase bonus', async () => {
      const balance = await zoneToken.balanceOf(vault.address)
      await zoneToken.connect(vault).transfer(contract.address, balance);

      const curTime = await blockTimestamp();
      await increaseTime(saleStartTime - curTime);

      expect(await zoneToken.balanceOf(a1.address)).to.equal('0');
      const amount1 = (new BigNumber(9.99)).shiftedBy(18).multipliedBy(rate).multipliedBy(1.1);
      await contract.connect(a1).purchase({value: (new BigNumber(9.99)).shiftedBy(18).toString()});
      expect(await zoneToken.balanceOf(a1.address)).to.equal(amount1.toString());

      const amount2 = (new BigNumber(10)).shiftedBy(18).multipliedBy(rate).multipliedBy(1.2);
      await contract.connect(a1).purchase({value: (new BigNumber(10)).shiftedBy(18).toString()});
      expect(await zoneToken.balanceOf(a1.address)).to.equal(amount2.plus(amount1).toString());

      expect(await contract.publicSaleBoughtEth()).to.equal((new BigNumber(19.99)).shiftedBy(18).toString());
      expect(await contract.publicSaleSoldToken()).to.equal(amount2.plus(amount1).toString());

    });

    it('should be able to set rate', async () => {
      await expectRevert(contract.setRate(0), "Ownable: caller is not the owner");
      await expectRevert(contract.connect(owner).setRate(0), "ZONE: The rate can't be 0.");

      const newRate = rate.multipliedBy(2);
      await contract.connect(owner).setRate(newRate.toString());
      expect(await contract.rate()).to.equal(newRate.toString());
    });

    it('should be able to set the ETH capacity', async () => {
      const balance = await zoneToken.balanceOf(vault.address)
      await zoneToken.connect(vault).transfer(contract.address, balance);

      await expectRevert(contract.setPublicSaleEthCapacity(0), "Ownable: caller is not the owner");
      await expectRevert(contract.connect(owner).setPublicSaleEthCapacity(0), "ZONE: The capacity must be greater than the already bought amount in the public sale.");

      expect(await contract.getPublicSaleEthCapacity()).to.equal(publicEthCapacity.toString());

      const curTime = await blockTimestamp();
      await increaseTime(saleStartTime - curTime);

      const amount1 = (new BigNumber(1)).shiftedBy(18).multipliedBy(rate).multipliedBy(1.1);
      await contract.connect(a1).purchase({value: ethers.utils.parseEther('1')})
      expect(await contract.publicSaleBoughtEth()).to.equal(ethers.utils.parseEther('1'));
      expect(await contract.publicSaleSoldToken()).to.equal(amount1.toString());
      expect(await zoneToken.balanceOf(a1.address)).to.equal(amount1.toString());

      await expectRevert(contract.connect(owner).setPublicSaleEthCapacity(ethers.utils.parseEther('1')), "ZONE: The capacity must be greater than the already bought amount in the public sale.");

      await contract.connect(owner).setPublicSaleEthCapacity(ethers.utils.parseEther('2'));
      const remainedSupply = publicSupply.minus((await contract.publicSaleSoldToken()).toString());
      const newRate = remainedSupply.dividedToIntegerBy(ethers.utils.parseEther('1').toString());
      expect(await contract.getPublicSaleEthCapacity()).to.equal(ethers.utils.parseEther('2'));
      expect(await contract.rate()).to.equal(newRate.toString());
    });

    it('should be able to finish by purchase', async () => {
      const balance = await zoneToken.balanceOf(vault.address)
      await zoneToken.connect(vault).transfer(contract.address, balance);

      const curTime = await blockTimestamp();
      await increaseTime(saleStartTime - curTime);

      await contract.connect(owner).setRate(10);
      const ethBalance = new BigNumber((await etherBalance(owner.address)).toString());
      const amount1 = publicEthCapacity.multipliedBy(10).multipliedBy(1.2);
      await contract.connect(a1).purchase({value: publicEthCapacity.plus(1).toString()})
      expect(await zoneToken.balanceOf(a1.address)).to.equal(amount1.toString());
      expect((await etherBalance(owner.address)).toString()).to.equal(ethBalance.plus(publicEthCapacity).toString());

      expect(await zoneToken.balanceOf(contract.address)).to.equal(0);

      expect(await contract.isCrowdsaleFinished()).to.equal(true);
      await expectRevert(contract.connect(a1).purchase({value: (new BigNumber(1)).shiftedBy(18).toString()}), "revert Public sale is already finished");
    });

    it('should be able to finish by owner', async () => {
      const curTime = await blockTimestamp();
      await increaseTime(saleStartTime - curTime);

      await contract.connect(owner).finishCrowdsale();
      expect(await contract.isCrowdsaleFinished()).to.equal(true);

      expect(await zoneToken.balanceOf(contract.address)).to.equal(0);

      await expectRevert(contract.connect(a1).purchase({value: (new BigNumber(1)).shiftedBy(18).toString()}), "revert Public sale is already finished");
    });
  });

});
