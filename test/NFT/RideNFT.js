const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");
const { expectRevert } = require('@openzeppelin/test-helpers');
const sigUtil = require('eth-sig-util');
const { BigNumber, utils } = ethers;
const parseEther = utils.parseEther;

const { mainnet: network_ } = require("../../parameters");
const { Models } = require("../../parameters/rideNft");
const ZONE_ABI = require("../../abis/ZONE_ABI.json");
const { sendEth, UInt256Max, AddressZero } = require('../utils/Ethereum');

const MODEL_BONUS = 0;
const MODEL_CLASS = 1;
const MODEL_NAME = 2;
const MODEL_METAFILE_URI = 3;
const MODEL_CAPACITY = 4;
const MODEL_SUPPLY = 5;
const MODEL_MINT_PRICE = 6;

describe('MultiModelNftUpgradeable', () => {

  let owner;
  let zoneToken, priceOracle;
  let contractArtifact, priceOracleArtifact
  
  before(async () => {
    [deployer, a1, a2, ...accounts] = await ethers.getSigners();

    contractArtifact = await deployments.getArtifact("MultiModelNftUpgradeable");
    priceOracleArtifact = await deployments.getArtifact("PriceOracleUpgradeable");

    owner = await ethers.getSigner(network_.Global.ownerAddress);

    zoneToken = new ethers.Contract(network_.ZONE.tokenAddress, ZONE_ABI, deployer);
  });

  beforeEach(async () => {
    await deployments.fixture(["hardhat_mainnet_rideNft"])

    const rideNftUpgradeableProxy = await ethers.getContract("RideNftUpgradeableProxy");
    contract = new ethers.Contract(rideNftUpgradeableProxy.address, contractArtifact.abi, a1);

    const priceOracleProxyContract = await ethers.getContract("PriceOracleUpgradeableProxy");
    priceOracle = new ethers.Contract(priceOracleProxyContract.address, priceOracleArtifact.abi, a1);

    await sendEth(a1.address, owner.address, '1');
  });

  describe('initial value', () => {
    it('initial address', async () => {
      expect(await contract.owner()).to.equal(owner.address);
      expect(await contract.zoneToken()).to.equal(zoneToken.address);
    });

    it('models should be set correctly', async () => {
      expect(await contract.modelCount()).to.equal(Models.classes.length);
      for (let i = 0; i < Models.classes.length; i ++) {
        const model = await contract.models(i);
        expect(model[MODEL_BONUS]).to.equal(Models.bonuses[i]);
        expect(model[MODEL_CLASS]).to.equal(Models.classes[i]);
        expect(model[MODEL_NAME]).to.equal(Models.names[i]);
        expect(model[MODEL_METAFILE_URI]).to.equal(Models.metafileUris[i]);
        expect(model[MODEL_CAPACITY]).to.equal(Models.capacities[i]);
        expect(model[MODEL_SUPPLY]).to.equal(0);
        expect(model[MODEL_MINT_PRICE]).to.equal(Models.mintPrices[i]);

        const defaultColor = await contract.getDefaultColor(i);
        expect(defaultColor.length).to.equal(Models.defaultColors[i].length);
        for (let j = 0; j < defaultColor.length; j ++) {
          expect(defaultColor[j]).to.equal(Models.defaultColors[i][j]);
        }
      }
      expect(await contract.zoneToken()).to.equal(zoneToken.address);
    });
  });

  describe('PriceOracle', () => {
    it('should has the correct addresses in', async () => {
      expect(await priceOracle.owner()).to.equal(owner.address);
      expect(await priceOracle.zoneToken()).to.equal(zoneToken.address);
      expect(await priceOracle.lpZoneEth()).to.equal(network_.PriceOracle.lpZoneEth);
      expect(await priceOracle.usePoolPrice()).to.equal(network_.PriceOracle.usePoolPrice);
      expect(await priceOracle.zoneReserveInLP()).to.equal(0);
      expect(await priceOracle.ethReserveInLP()).to.equal(0);
    });

    it('should return the correct price', async () => {
      await priceOracle.mintPriceInZone(parseEther("1"));
      const priceInZone = await priceOracle.callStatic.mintPriceInZone(parseEther("1"));
      expect(priceInZone.div(parseEther("1")).toNumber()).to.greaterThan(0);
    });
  });

  describe('basic methods', () => {
    it('setModelUri method', async () => {
      const uri0 = "https://test_uri0";
      await expectRevert(contract.setModelUri(0, uri0), "Ownable: caller is not the owner");
      await contract.connect(owner).setModelUri(0, uri0);
      const model = await contract.models(0);
      expect(model[MODEL_METAFILE_URI]).to.equal(uri0);
    });

    it('setModelMintPrice method', async () => {
      const price = parseEther("0.3");
      await expectRevert(contract.setModelMintPrice(0, price), "Ownable: caller is not the owner");
      await contract.connect(owner).setModelMintPrice(0, price);
      const model = await contract.models(0);
      expect(model[MODEL_MINT_PRICE]).to.equal(price);
    });
  });

  describe('mint', () => {
    it('mint methods', async () => {
      let modelId = 0;
      let priceInZone = await contract.callStatic.mintPriceInZone(modelId);
      await zoneToken.connect(owner).transfer(a1.address, priceInZone);
      await zoneToken.connect(a1).approve(contract.address, priceInZone);
      let balanceOfOwner = await zoneToken.balanceOf(owner.address);

      await expectRevert(contract.mint(Models.classes.length), "Invalid model");

      // mint
      let tokenId = 1;
      await contract.mint(modelId);
      expect(await zoneToken.balanceOf(owner.address)).to.equal(balanceOfOwner.add(priceInZone));
      expect(await contract.balanceOf(a1.address)).to.equal(1);
      expect(await contract.ownerOf(tokenId)).to.equal(a1.address);
      expect(await contract.totalSupply()).to.equal(1);
      expect(await contract.tokenByIndex(0)).to.equal(tokenId);
      expect(await contract.tokenOfOwnerByIndex(a1.address, 0)).to.equal(tokenId);
      expect(await contract.modelIds(tokenId)).to.equal(modelId);

      const model = await contract.models(modelId);
      expect(model[MODEL_SUPPLY]).to.equal(1);

      // The color should be same with the default color
      let color = await contract.tokenColorById(tokenId);
      expect(color.length).to.equal(1);
      expect(parseInt(color[0]) === parseInt(Models.defaultColors[modelId][0])).to.equal(true);
      // The name should be zero length
      expect(await contract.tokenNameById(tokenId)).to.equal("");
    });

    it('mintWithParams methods', async () => {
      let modelId = 1;
      let priceInZone = await contract.callStatic.mintPriceInZone(modelId);
      await zoneToken.connect(owner).transfer(a1.address, priceInZone);
      await zoneToken.connect(a1).approve(contract.address, priceInZone);
      let balanceOfOwner = await zoneToken.balanceOf(owner.address);

      // mint
      let tokenId = 1;
      await expectRevert(contract.mintWithParams(modelId, "token1", [0x01010101, 0x10101010]), "Color length mismatch");
      await contract.mintWithParams(modelId, "token1", [0x01010101]);
      expect(await zoneToken.balanceOf(owner.address)).to.equal(balanceOfOwner.add(priceInZone));
      expect(await contract.balanceOf(a1.address)).to.equal(1);
      expect(await contract.ownerOf(tokenId)).to.equal(a1.address);
      expect(await contract.totalSupply()).to.equal(1);
      expect(await contract.tokenByIndex(0)).to.equal(tokenId);
      expect(await contract.tokenOfOwnerByIndex(a1.address, 0)).to.equal(tokenId);
      expect(await contract.modelIds(tokenId)).to.equal(modelId);

      // The color should be same with the default color
      let color = await contract.tokenColorById(tokenId);
      expect(color.length).to.equal(1);
      expect(parseInt(color[0]) === 0x01010101).to.equal(true);
      // The name should be zero length
      expect(await contract.tokenNameById(tokenId)).to.equal("token1");
    });

    it('should be limited by capacity', async () => {
      let modelId = 0;
      let priceInZone = await contract.callStatic.mintPriceInZone(modelId);

      // mint
      for (let i = 0; i < Models.capacities[modelId]; i ++) {
        await zoneToken.connect(owner).transfer(a1.address, priceInZone);
        await zoneToken.connect(a1).approve(contract.address, priceInZone);
        await contract.mint(modelId);
      }
      await expectRevert(contract.mint(modelId), "Exceeds capacity");
    });
  });

  describe('airdrop', () => {
    it('doAirdrop should be failed with incorrect pramaters', async () => {
      let modelId = 0;
      await expectRevert(contract.doAirdrop(modelId, [a1.address]), "Restricted access to minters");
      const ALLOWED_MINTERS = await contract.ALLOWED_MINTERS();
      await expectRevert(contract.grantRole(ALLOWED_MINTERS, a2.address), "AccessControl: sender must be an admin to grant");
      await contract.connect(owner).grantRole(ALLOWED_MINTERS, a2.address);

      await expectRevert(contract.connect(a2).doAirdrop(modelId, [
        "0xa23cff7a4f319445e4584897941bf478b4931abc",
        "0x2e811568b0fb4b6e9077c4cd2d57c34f554b835d",
        "0x5dce3cf1bbdd8fee714cf7ec1f00b817cbcf2160",
        "0xd4ce1744799b189c7a19a3d3ce0aac8de60f781b",
        "0xe38fd1c83bb7883adc4b5b910c6f6e8311da3b6f",
        "0xa66bf5d22d48b69a08746d28c711f6d56d44480e",
        "0x3374c353f4bcd5772a0d4def26e3857e2a45cab2",
        "0xc79bd3a1cf2e6935136a4a9833f1aa67ae67d9aa",
        "0x87d67301a24d7b94224cdefcf943417162ae7007",
        "0xef3fdc051bac5ccb7aa1de3a0c2b3a463cb6c677",
        "0x468e7f6f6438864dd31ef61961dfd3e01b69180f",
        "0x21cbbc3639d35bf216c8ecc111876a96177e465c",
        "0x2a8ac196905afff02550b547af6110c87f504b8e",
        "0xdc31df63ca0b6de64bc62d81844e8956d2476541",
        "0x809676df9f7ef012b1201e767575bc9b5aebd108",
        "0x88168d089f75f5cd93f777ec16bbb178a7c7b512",
        "0xb0823fffac86c709c658db3f8765e9da8c7d9647",
        "0x1688888ebdab05737cf752acf7d11d82f21ac5f2",
        "0x4a5bb1c9347a0d4f7e06a29239162f03647d9232",
        "0xb67dfcf4dec5944101d363ef4ec8bfb1996eff82",
        "0x5f60ad4ed6777500005b4179deff0eec362b5c25",
        "0x9cdb1804156f362aa5900478e1465c917a5f6a3a",
        "0x2c5651d9c4d9a9031ff789845f2d44c82f194033",
        "0x187c77e1c74057b5ae98f90b45e4303cb7361c76",
        "0x13991cc1ffae4cf57c5caefb951826ffa54a88af",
        "0xec578146b22d7ef5f6e5c69fdde00bdaa5f0b33b",
        "0x3b54a04374a884cb70f45abcc0539037bcfb9da2",
        "0x73c52612f72075361bd707934dbc2b4358c58f32",
        "0xc599c65767d1527bda5064676aa6de96c65a2ad4",
        "0xad25daf8b180d846c78fe7b4aabd83f881d6b733",
        "0x9f7ae94f69d27bc1e8f895f21d8c13cdcbe3bdf0",
      ]), "Exceeds limit");
    });

    it('doAirdrop should be succeed with correct pramaters', async () => {
      let modelId = 0;
      expect(await contract.airdropNonces(accounts[0].address)).to.equal(0);
      expect(await contract.airdropNonces(accounts[1].address)).to.equal(0);
      expect(await contract.airdropNonces(accounts[2].address)).to.equal(0);

      const ALLOWED_MINTERS = await contract.ALLOWED_MINTERS();
      await contract.connect(owner).grantRole(ALLOWED_MINTERS, a2.address);
      await contract.connect(a2).doAirdrop(modelId, [
        accounts[0].address,
        accounts[1].address,
        accounts[2].address,
      ]);
      expect(await contract.totalSupply()).to.equal(3);
      expect(await contract.ownerOf(1)).to.equal(accounts[0].address);
      expect(await contract.ownerOf(2)).to.equal(accounts[1].address);
      expect(await contract.ownerOf(3)).to.equal(accounts[2].address);

      expect(await contract.airdropNonces(accounts[0].address)).to.equal(0);
      expect(await contract.airdropNonces(accounts[1].address)).to.equal(0);
      expect(await contract.airdropNonces(accounts[2].address)).to.equal(0);
    });

    it('doAirdropBySignature should be succeed with correct pramaters', async () => {
      let modelId = 0;
      let nonce = 0;
      const ALLOWED_MINTERS = await contract.ALLOWED_MINTERS();
      await contract.connect(owner).grantRole(ALLOWED_MINTERS, a2.address);

      const message = ethers.utils.solidityKeccak256(
        ["address", "uint256", "address", "uint256", "uint256"],
        [contract.address, modelId, accounts[0].address, 2, nonce]
      );
      const signature = await a2.signMessage(ethers.utils.arrayify(message));

      await contract.doAirdropBySignature(modelId, accounts[0].address, 2, signature);
      expect(await contract.totalSupply()).to.equal(2);
      expect(await contract.ownerOf(1)).to.equal(accounts[0].address);
      expect(await contract.airdropNonces(accounts[0].address)).to.equal(2);

      await expectRevert(contract.doAirdropBySignature(modelId, accounts[0].address, 2, signature), "Invalid signature");
    });
  });

});
