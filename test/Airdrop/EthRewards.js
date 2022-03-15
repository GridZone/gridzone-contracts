const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");
const { expectRevert } = require('@openzeppelin/test-helpers');
const { BigNumber, utils } = ethers;
const parseEther = utils.parseEther;

const { mainnet: network_ } = require("../../parameters");
const { sendEth, etherBalance } = require('../utils/Ethereum');

describe('EthRewardsUpgradeable', () => {

  let owner, admin;
  let contract;
  let contractArtifact;

  before(async () => {
    [deployer, a1, a2, ...accounts] = await ethers.getSigners();

    contractArtifact = await deployments.getArtifact("EthRewardsUpgradeable");

    owner = await ethers.getSigner(network_.Global.ownerAddress);
    admin = await ethers.getSigner(network_.Airdrop.adminAddress);
  });

  beforeEach(async () => {
    await deployments.fixture(["hardhat_mainnet_EthRewards"])

    const proxyContract = await ethers.getContract("EthRewardsUpgradeableProxy");
    contract = new ethers.Contract(proxyContract.address, contractArtifact.abi, a1);

    await sendEth(a1.address, owner.address, '1');
  });

  describe('basic', () => {
    it('initial set', async () => {
      expect(await contract.owner()).to.equal(owner.address);
      expect(await contract.admin()).to.equal(admin.address);
    });

    it('Should be set by only owner', async () => {
      await expectRevert(contract.setAdmin(a2.address), "Ownable: caller is not the owner");
      await contract.connect(owner).setAdmin(a2.address);
      expect(await contract.admin()).to.equal(a2.address);

      await expectRevert(contract.withdraw(), "Ownable: caller is not the owner");
      await contract.connect(owner).withdraw();
    });

    it('withdraw', async () => {
      await sendEth(a1.address, contract.address, '1');
      const ethBalanceBefore = await etherBalance(owner.address);
      await contract.connect(owner).withdraw();
      expect(await etherBalance(contract.address)).to.equal(0);
      expect((await etherBalance(owner.address)).gt(ethBalanceBefore)).equal(true);
    });
  });

  describe('claim', () => {
    beforeEach(async () => {
      await sendEth(a1.address, contract.address, '1');
      await contract.connect(owner).setAdmin(a2.address);
    });

    it('doAirdropBySignature should be succeed', async () => {
      const amount = parseEther('0.1');
      let claimedAmount = await contract.claimedReward(a1.address);
      let message = ethers.utils.solidityKeccak256(
        ["address", "address", "uint256", "uint256"],
        [contract.address, a1.address, claimedAmount, amount]
      );
      let signature = await a2.signMessage(ethers.utils.arrayify(message));

      let ethBalanceBefore = await etherBalance(a1.address);
      let contractEthBalance = await etherBalance(contract.address);
      await contract.doAirdropBySignature(a1.address, claimedAmount, amount, signature);
      expect((await etherBalance(a1.address)).gt(ethBalanceBefore)).equal(true);
      expect(await etherBalance(contract.address)).to.equal(contractEthBalance.sub(amount));
      expect(await contract.claimedReward(a1.address)).to.equal(amount);
      expect(await contract.totalClaimedReward()).to.equal(amount);

      // Try again
      claimedAmount = await contract.claimedReward(a1.address);
      message = ethers.utils.solidityKeccak256(
        ["address", "address", "uint256", "uint256"],
        [contract.address, a1.address, claimedAmount, amount]
      );
      signature = await a2.signMessage(ethers.utils.arrayify(message));

      ethBalanceBefore = await etherBalance(a1.address);
      contractEthBalance = await etherBalance(contract.address);
      await contract.doAirdropBySignature(a1.address, claimedAmount, amount, signature);
      expect((await etherBalance(a1.address)).gt(ethBalanceBefore)).equal(true);
      expect(await etherBalance(contract.address)).to.equal(contractEthBalance.sub(amount));
      expect(await contract.claimedReward(a1.address)).to.equal(amount.mul(2));
      expect(await contract.totalClaimedReward()).to.equal(amount.mul(2));
    });

    it('doAirdropBySignature should be failed when it signed by not admin', async () => {
      const amount = parseEther('0.1');
      const claimedAmount = await contract.claimedReward(a1.address);
      const message = ethers.utils.solidityKeccak256(
        ["address", "address", "uint256", "uint256"],
        [contract.address, a1.address, claimedAmount, amount]
      );
      const signature = await a1.signMessage(ethers.utils.arrayify(message));
      await expectRevert(contract.doAirdropBySignature(a1.address, claimedAmount, amount, signature), "Not allowed");
    });

    it('doAirdropBySignature should be failed when the claimedAmount is invalid', async () => {
      const amount = parseEther('0.1');
      const message = ethers.utils.solidityKeccak256(
        ["address", "address", "uint256", "uint256"],
        [contract.address, a1.address, amount, amount]
      );
      const signature = await a1.signMessage(ethers.utils.arrayify(message));
      await expectRevert(contract.doAirdropBySignature(a1.address, amount, amount, signature), "Invalid claimed amount");
    });
  });
});
