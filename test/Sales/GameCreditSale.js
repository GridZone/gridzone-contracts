const { expect } = require("chai")
const { deployments, ethers } = require("hardhat")
const { BigNumber, utils } = ethers;
const parseEther = utils.parseEther;
const {
  BN,           // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

const {
  blockTimestamp,
  etherBalance,
  increaseTime,
  sendValue,
} = require('../utils/Ethereum');

const { mainnet: network_ } = require("../../parameters")

describe('GameCreditSale', () => {

  let deployer, owner;
  let contract;
  let contractArtifact;

  before(async () => {
    [deployer, a1, a2, ...accounts] = await ethers.getSigners();

    contractArtifact = await deployments.getArtifact("GameCreditSaleUpgradeable");

    owner = await ethers.getSigner(network_.Global.ownerAddress);
  });

  beforeEach(async () => {
    await deployments.fixture(["hardhat_mainnet_gameCreditSale"])

    const proxy = await ethers.getContract("GameCreditSaleUpgradeableProxy");
    contract = new ethers.Contract(proxy.address, contractArtifact.abi, a1);
  });

  describe('initial value', () => {
    it('initial address', async () => {
      expect(await contract.owner()).to.equal(owner.address);
      const [price, decimals] = await contract.ethPrice();
      expect(parseInt(price)).greaterThan(0);
      expect(parseInt(decimals)).eq(8);
    });

    it("Should be set by only owner", async () => {
      await expectRevert(contract.withdraw(), "Ownable: caller is not the owner");
      await contract.connect(owner).withdraw();
    });
  });

  describe('purchase', () => {
    it('purchase & withdraw', async () => {
      const [price, decimals] = await contract.ethPrice();
      const amount = parseEther('50').div(price).mul(BigNumber.from(10).pow(decimals));
      await contract.purchase({value: amount});
      expect(await etherBalance(contract.address)).equal(amount);

      const balanceBefore = await etherBalance(owner.address);
      await contract.connect(owner).withdraw();
      expect(await etherBalance(contract.address)).equal(0);
      expect(await etherBalance(owner.address)).to.gt(balanceBefore);
    });
  });

});
