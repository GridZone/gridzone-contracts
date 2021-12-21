const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");
const { expectRevert } = require('@openzeppelin/test-helpers');
const { BigNumber, utils } = ethers;
const parseEther = utils.parseEther;

const { mainnet: network_ } = require("../../parameters");
const { sendEth, UInt256Max, AddressZero, etherBalance } = require('../utils/Ethereum');

const MINT_PRICE = parseEther('0.15');
const PREMINT_COUNT = 10;

describe('NymUpgradeable', () => {

  let owner;
  let contractArtifact
  
  before(async () => {
    [deployer, a1, a2, ...accounts] = await ethers.getSigners();

    contractArtifact = await deployments.getArtifact("NymUpgradeable");

    owner = await ethers.getSigner(network_.Global.ownerAddress);
  });

  beforeEach(async () => {
    await deployments.fixture(["hardhat_mainnet_nym"])

    const nymUpgradeableProxy = await ethers.getContract("NymUpgradeableProxy");
    contract = new ethers.Contract(nymUpgradeableProxy.address, contractArtifact.abi, a1);

    await sendEth(a1.address, owner.address, '1');
  });

  describe('basic value', () => {
    it('initial value', async () => {
      expect(await contract.name()).to.equal("NEONPUNK");
      expect(await contract.symbol()).to.equal("NEON");
      expect(await contract.owner()).to.equal(owner.address);
      expect(await contract.capacity()).to.equal(300);
      expect(await contract.mintPrice()).to.equal(MINT_PRICE);
      expect(await contract.baseURI()).to.equal(network_.NYM.baseURI);

      expect(await contract.totalSupply()).to.equal(PREMINT_COUNT);
      expect(await contract.freeCount()).to.equal(300 - PREMINT_COUNT);

      expect(await contract.balanceOf("0xab0B18523e8fe8CBF947C55632e8aB5Ce936ae8c")).to.equal(5);
      expect(await contract.ownerOf(1)).to.equal("0xab0B18523e8fe8CBF947C55632e8aB5Ce936ae8c");
      expect(await contract.tokenOfOwnerByIndex("0xab0B18523e8fe8CBF947C55632e8aB5Ce936ae8c", 0)).to.equal(1);
      expect(await contract.ownerOf(2)).to.equal("0xab0B18523e8fe8CBF947C55632e8aB5Ce936ae8c");
      expect(await contract.tokenOfOwnerByIndex("0xab0B18523e8fe8CBF947C55632e8aB5Ce936ae8c", 1)).to.equal(2);
      expect(await contract.ownerOf(3)).to.equal("0xab0B18523e8fe8CBF947C55632e8aB5Ce936ae8c");
      expect(await contract.tokenOfOwnerByIndex("0xab0B18523e8fe8CBF947C55632e8aB5Ce936ae8c", 2)).to.equal(3);

      expect(await contract.locked()).to.equal(true);
    });

    it('owner functions', async () => {
      const totalSupply = await contract.totalSupply();
      await expectRevert(contract.setCapacity(totalSupply), "Ownable: caller is not the owner");
      await contract.connect(owner).setCapacity(totalSupply);
      expect(await contract.capacity()).to.equal(totalSupply);
      await expectRevert(contract.connect(owner).setCapacity(parseInt(totalSupply)-1), "capacity is less than the current supply");

      await expectRevert(contract.setMintPrice(parseEther('0.01')), "Ownable: caller is not the owner");
      await contract.connect(owner).setMintPrice(parseEther('0.01'));
      expect(await contract.mintPrice()).to.equal(parseEther('0.01'));

      await expectRevert(contract.setBaseURI("https://test/"), "Ownable: caller is not the owner");
      await contract.connect(owner).setBaseURI("https://test/");
      expect(await contract.baseURI()).to.equal("https://test/");
      expect(await contract.tokenURI(1)).to.equal((await contract.baseURI()) + '1');

      await expectRevert(contract.setTokenURI(1, "https://test/1"), "Ownable: caller is not the owner");
      await expectRevert(contract.connect(owner).setTokenURI(PREMINT_COUNT+1, "https://test/1"), "ERC721Metadata: URI set of nonexistent token");
      contract.connect(owner).setTokenURI(1, "https://test/1");
      expect(await contract.tokenURI(1)).to.equal("https://test/1");

      await expectRevert(contract.withdraw(), "Ownable: caller is not the owner");

      await expectRevert(contract.setLocked(false), "Ownable: caller is not the owner");
      await contract.connect(owner).setLocked(false);
      expect(await contract.locked()).to.equal(false);
    });
  });

  describe('mint', () => {
    it('mint methods', async () => {
      // mint
      expect(await etherBalance(contract.address)).equal(0);
      expect(await contract.balanceOf(a1.address)).to.equal(0);

      await contract.connect(a1).mint(1, {value: MINT_PRICE});
      expect(await etherBalance(contract.address)).equal(MINT_PRICE);
      expect(await contract.balanceOf(a1.address)).to.equal(1);
      console.log(`token ID: ${await contract.tokenOfOwnerByIndex(a1.address, 0)}`);
      expect(await contract.totalSupply()).to.equal(PREMINT_COUNT + 1);
      expect(await contract.freeCount()).to.equal(300 - PREMINT_COUNT - 1);
    });

    it('should be limited by capacity', async () => {
      await expectRevert(contract.connect(a1).mint(0, {value: MINT_PRICE}), "Quantity is zero");

      const totalSupply = await contract.totalSupply();
      await contract.connect(owner).setCapacity(totalSupply);
      await expectRevert(contract.connect(a1).mint(1, {value: MINT_PRICE}), "Exceeds capacity");

      await contract.connect(owner).setCapacity(parseInt(totalSupply)+1);
      await expectRevert(contract.connect(a1).mint(2, {value: MINT_PRICE.mul(2)}), "Exceeds capacity");

      await contract.connect(a1).mint(1, {value: MINT_PRICE});
    });

    it('should be failed to mint with incorrect ETH amount', async () => {
      await expectRevert(contract.connect(a1).mint(1, {value: parseEther('0.09')}), "Ether value sent is not correct");
    });

    it('double mint in a transaction', async () => {
      await contract.connect(a1).mint(2, {value: MINT_PRICE.mul(2)});
      expect(await etherBalance(contract.address)).equal(MINT_PRICE.mul(2));
      console.log(`token ID: ${await contract.tokenOfOwnerByIndex(a1.address, 0)}`);
      console.log(`token ID: ${await contract.tokenOfOwnerByIndex(a1.address, 1)}`);
      expect(await contract.totalSupply()).to.equal(PREMINT_COUNT + 2);
      expect(await contract.freeCount()).to.equal(300 - PREMINT_COUNT - 2);
    });

    it('double mint', async () => {
      await contract.connect(a1).mint(1, {value: MINT_PRICE});
      await contract.connect(a1).mint(1, {value: MINT_PRICE});
      expect(await etherBalance(contract.address)).equal(MINT_PRICE.mul(2));
      console.log(`token ID: ${await contract.tokenOfOwnerByIndex(a1.address, 0)}`);
      console.log(`token ID: ${await contract.tokenOfOwnerByIndex(a1.address, 1)}`);
      expect(await contract.totalSupply()).to.equal(PREMINT_COUNT + 2);
      expect(await contract.freeCount()).to.equal(300 - PREMINT_COUNT - 2);
    });

    it('withdraw', async () => {
      await contract.connect(a1).mint(1, {value: MINT_PRICE});

      const ethBalanceBefore = await etherBalance(owner.address);
      await contract.connect(owner).withdraw();
      expect((await etherBalance(owner.address)).gt(ethBalanceBefore)).equal(true);
    });
  });

  describe('transfer', () => {
    it('should be transfer until unlocked', async () => {
      var tokenId;
      await contract.connect(a1).mint(1, {value: MINT_PRICE});
      tokenId = await contract.tokenOfOwnerByIndex(a1.address, 0);
      await expectRevert(contract.connect(a1)["safeTransferFrom(address,address,uint256)"](a1.address, a2.address, tokenId), "No transfer allowed yet");

      await contract.connect(owner).setLocked(false);
      expect(await contract.balanceOf(a2.address)).to.equal(0);
      await contract.connect(a1)["safeTransferFrom(address,address,uint256)"](a1.address, a2.address, tokenId);
      expect(await contract.balanceOf(a2.address)).to.equal(1);
    });

    it('basic', async () => {
      await contract.connect(owner).setLocked(false);

      var tokenId;
      await contract.connect(a1).mint(1, {value: MINT_PRICE});
      tokenId = await contract.tokenOfOwnerByIndex(a1.address, 0);
      await contract.connect(a1)["safeTransferFrom(address,address,uint256)"](a1.address, a2.address, tokenId);
      expect(await contract.balanceOf(a1.address)).to.equal(0);
      expect(await contract.balanceOf(a2.address)).to.equal(1);
      expect(await contract.ownerOf(tokenId)).to.equal(a2.address);
      expect(await contract.tokenOfOwnerByIndex(a2.address, 0)).to.equal(tokenId);

      await contract.connect(a1).mint(1, {value: MINT_PRICE});
      tokenId = await contract.tokenOfOwnerByIndex(a1.address, 0);
      await contract.connect(a1)["safeTransferFrom(address,address,uint256)"](a1.address, a2.address, tokenId);
      expect(await contract.balanceOf(a2.address)).to.equal(2);
      expect(await contract.ownerOf(tokenId)).to.equal(a2.address);
      expect(await contract.tokenOfOwnerByIndex(a2.address, 1)).to.equal(tokenId);
    });
  });

});
