const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");
const { expectRevert } = require('@openzeppelin/test-helpers');
const { BigNumber, utils } = ethers;
const parseEther = utils.parseEther;

const { mainnet: network_ } = require("../../parameters");
const { sendEth, UInt256Max, AddressZero, etherBalance } = require('../utils/Ethereum');

describe('GridZoneVIPUpgradeable', () => {

  let owner;
  let contractArtifact
  
  before(async () => {
    [deployer, a1, a2, ...accounts] = await ethers.getSigners();

    contractArtifact = await deployments.getArtifact("GridZoneVIPUpgradeable");

    owner = await ethers.getSigner(network_.Global.ownerAddress);
  });

  beforeEach(async () => {
    await deployments.fixture(["hardhat_mainnet_gridZoneVIP"])

    const proxy = await ethers.getContract("GridZoneVIPUpgradeableProxy");
    contract = new ethers.Contract(proxy.address, contractArtifact.abi, a1);

    await sendEth(a1.address, owner.address, '1');
  });

  describe('basic value', () => {
    it('initial value', async () => {
      expect(await contract.name()).to.equal("GRIDZONE VIP");
      expect(await contract.symbol()).to.equal("VIP");
      expect(await contract.owner()).to.equal(owner.address);

      expect(await contract.totalSupply()).to.equal(0);
    });

    it('owner functions', async () => {
      await expectRevert(contract.mint(a1.address, "1"), "Ownable: caller is not the owner");
      await contract.connect(owner).mint(a1.address, "1");
      expect(await contract.totalSupply()).to.equal(1);
    });
  });

  describe('mint', () => {
    it('mint methods', async () => {
      // mint
      const tokenId = 1;
      await contract.connect(owner).mint(a1.address, "ipfs://QmNZU7pHosAVixX8ritfBiswd1K3P7Ke6H4ERL6UWBpzrz");
      expect(await contract.totalSupply()).to.equal(1);
      expect(await contract.balanceOf(a1.address)).to.equal(1);
      expect(await contract.ownerOf(tokenId)).to.equal(a1.address);
      expect(await contract.tokenOfOwnerByIndex(a1.address, 0)).to.equal(tokenId);
      expect(await contract.tokenURI(tokenId)).to.equal("ipfs://QmNZU7pHosAVixX8ritfBiswd1K3P7Ke6H4ERL6UWBpzrz");
    });
  });

});
