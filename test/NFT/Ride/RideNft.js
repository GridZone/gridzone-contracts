const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");
const { expectRevert } = require('@openzeppelin/test-helpers');
const sigUtil = require('eth-sig-util');

const { polygonMainnet: network_ } = require("../../../parameters");
const ZONE_ABI = require("../../../abis/ZONE_ABI.json");
const { sendEth, UInt256Max, AddressZero } = require('../../utils/Ethereum');

var decimals = 0;
const toAmount = (qty) => {
  return ethers.utils.parseUnits(qty.toString(), decimals);
}

const privateKey = "0x68619b8adb206de04f676007b2437f99ff6129b672495a6951499c6c56bc2fa6";
const signingKey = new ethers.Wallet(privateKey, ethers.provider);

const domainType = [
  {
    name: "name",
    type: "string"
  },
  {
    name: "version",
    type: "string"
  },
  {
    name: "verifyingContract",
    type: "address"
  },
  {
    name: "salt",
    type: "bytes32"
  },
];

const metaTransactionType = [
  {
    name: "nonce",
    type: "uint256"
  },
  {
    name: "from",
    type: "address"
  },
  {
    name: "functionSignature",
    type: "bytes"
  }
];

const getTransactionData = async (domainData, nonce, functionSignature) => {

  const message = {
    nonce: parseInt(nonce),
    from: signingKey.address,
    functionSignature: functionSignature
  };
  const dataToSign = {
      types: {
          EIP712Domain: domainType,
          MetaTransaction: metaTransactionType
      },
      domain: domainData,
      primaryType: "MetaTransaction",
      message: message
  };

  const signature = sigUtil.signTypedData_v4(Buffer.from(privateKey.substring(2, 66), 'hex'), {
      data: dataToSign
  });

  let r = signature.slice(0, 66);
  let s = "0x".concat(signature.slice(66, 130));
  let v = "0x".concat(signature.slice(130, 132));
  let value = parseInt(v, 16);
  if (![27, 28].includes(value)) {
    v = (value + 27).toString(16);
  }

  return { r, s, v };
}

let implArtifact;
const getRideContract = (contractAddress, signer) => {
  return new ethers.Contract(contractAddress, implArtifact.abi, signer);
}

describe('BaseNftUpgradeable', () => {

  const [rideUri] = "https://ipfs.io/ipfs/Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
  const mintPrice = 100;

  let owner;
  let zoneToken, relayContract, factory, proxyAdmin, priceOracle;
  let relayArtifact, priceOracleArtifact;
  let relayDomainData;
  let chainId, chainIdSalt;
  
  before(async () => {
    [deployer, a1, a2, ...accounts] = await ethers.getSigners();

    implArtifact = await deployments.getArtifact("BaseNftUpgradeable");
    relayArtifact = await deployments.getArtifact("BiconomyMetaTxRelayUpgradeable");
    priceOracleArtifact = await deployments.getArtifact("PriceOracleUpgradeable");

    owner = await ethers.getSigner(network_.Global.ownerAddress);

    zoneToken = new ethers.Contract(network_.ZONE.tokenAddress, ZONE_ABI, deployer);
    decimals = await zoneToken.decimals();

    chainId = (await ethers.provider.getNetwork()).chainId;
    chainIdSalt = '0x' + chainId.toString(16).padStart(64, '0');
  });

  beforeEach(async () => {
    await deployments.fixture(["hardhat_polygonMainnet"])

    factory = await ethers.getContract("RideNftFactory");
    impl = await ethers.getContract("BaseNftUpgradeable");
    proxyAdmin = await ethers.getContract("ProxyAdmin");
    nymLib = await ethers.getContract("NymLibUpgradeableProxy");

    const relayProxyContract = await ethers.getContract("BiconomyMetaTxRelayUpgradeableProxy");
    relayContract = new ethers.Contract(relayProxyContract.address, relayArtifact.abi, a1);
    const priceOracleProxyContract = await ethers.getContract("PriceOracleUpgradeableProxy");
    priceOracle = new ethers.Contract(priceOracleProxyContract.address, priceOracleArtifact.abi, a1);

    await sendEth(a1.address, signingKey.address, '1');
    await sendEth(a1.address, owner.address, '1');

    await relayContract.connect(owner).grantRole(await relayContract.FACTORIES(), factory.address);

    relayDomainData = {
      name: "BiconomyMetaTxRelayUpgradeable",
      version: "1",
      verifyingContract: relayContract.address,
      salt: chainIdSalt,
    };
  });

  describe('PriceOracle', () => {
    it('should has the correct addresses in', async () => {
      expect(await priceOracle.owner()).to.equal(owner.address);
      expect(await priceOracle.zoneToken()).to.equal(zoneToken.address);
      expect(await priceOracle.slpZoneEth()).to.equal(network_.PriceOracle.slpZoneEth);
      expect(await priceOracle.reserveWeight()).to.equal(network_.PriceOracle.slpReserveWeight);
      expect(await priceOracle.usePoolPrice()).to.equal(network_.PriceOracle.usePoolPrice);
      expect(await priceOracle.zoneReserveInSLP()).to.equal(network_.PriceOracle.zoneReserveInSLP);
      expect(await priceOracle.ethReserveInSLP()).to.equal(network_.PriceOracle.ethReserveInSLP);
    });

    it('should be correctly set', async () => {
      await expectRevert(priceOracle.activatePoolPrice(false, 3000, 2), "revert Ownable: caller is not the owner");
      await priceOracle.connect(owner).activatePoolPrice(false, 3000, 2);
      expect(await priceOracle.usePoolPrice()).to.equal(false);
      expect(await priceOracle.zoneReserveInSLP()).to.equal(3000);
      expect(await priceOracle.ethReserveInSLP()).to.equal(2);

      await expectRevert(priceOracle.setZoneEthSLP(network_.PriceOracle.slpZoneEth), "revert Ownable: caller is not the owner");
      await priceOracle.connect(owner).setZoneEthSLP(network_.PriceOracle.slpZoneEth);
      expect(await priceOracle.slpZoneEth()).to.equal(network_.PriceOracle.slpZoneEth);
      expect(await priceOracle.zoneReserveInSLP()).to.equal(0);
      expect(await priceOracle.ethReserveInSLP()).to.equal(0);

      await priceOracle.connect(owner).activatePoolPrice(true, 3000, 2);
      expect(await priceOracle.usePoolPrice()).to.equal(true);
      expect(await priceOracle.zoneReserveInSLP()).to.equal(0);
      expect(await priceOracle.ethReserveInSLP()).to.equal(0);

      await priceOracle.callStatic.mintPriceInZone(100);
      expect(await priceOracle.zoneReserveInSLP()).to.equal(0);
      expect(await priceOracle.ethReserveInSLP()).to.equal(0);

      await priceOracle.mintPriceInZone(100);
      expect((await priceOracle.zoneReserveInSLP()).gt(0)).to.equal(true);
      expect((await priceOracle.ethReserveInSLP()).gt(0)).to.equal(true);

      await expectRevert(priceOracle.setSLPReserveWeight(10001), "revert Ownable: caller is not the owner");
      await expectRevert(priceOracle.connect(owner).setSLPReserveWeight(10001), "The weight should be less than 10000");
      await priceOracle.connect(owner).setSLPReserveWeight(10000);
      expect(await priceOracle.reserveWeight()).to.equal(10000);
    });

    it('should return the correct price', async () => {
      let priceInZone = await priceOracle.callStatic.mintPriceInZone(100);
      expect(await priceOracle.getMintPriceInZone(100)).to.equal(priceInZone);

      await priceOracle.mintPriceInZone(100);
      priceInZone = await priceOracle.callStatic.mintPriceInZone(100);
      expect(await priceOracle.getMintPriceInZone(100)).to.equal(priceInZone);
    });
  });

  describe('RideNftFactory', () => {
    it('should has the correct addresses in', async () => {
      expect(await factory.owner()).to.equal(owner.address);
      expect(await factory.nymLib()).to.equal(nymLib.address);
      expect(await factory.priceOracle()).to.equal(priceOracle.address);
      expect(await factory.proxyAdminAddress()).to.equal(proxyAdmin.address);
      expect(await factory.impl()).to.equal(impl.address);
    });

    it('should be correctly deploy the ride contracts', async () => {
      await expectRevert(factory.createNFT("RideNft0", "RIDE0", [rideUri], 100, mintPrice, false, false, [0x01234567, 0x89ABCDEF]), "revert Ownable: caller is not the owner");
      await factory.connect(owner).createNFT("RideNft0", "RIDE0", [rideUri], 100, mintPrice, false, false, [0x01234567, 0x89ABCDEF]);

      expect(await proxyAdmin.getProxyAdmin(factory.nfts(0))).to.equal(proxyAdmin.address); // proxy admin

      const rideContract = getRideContract(await factory.nfts(0), a1);
      expect(await rideContract.owner()).to.equal(owner.address);
      expect(await rideContract.admin()).to.equal(owner.address);
      expect(await rideContract.nymLib()).to.equal(nymLib.address);
      expect(await rideContract.priceOracle()).to.equal(priceOracle.address);
      expect(await rideContract.tokenURI(0)).to.equal(rideUri);
      expect(await rideContract.capacity()).to.equal(100);
      expect(await rideContract.mintPrice()).to.equal(mintPrice);
      expect(await rideContract.zoneToken()).to.equal(zoneToken.address);
      expect(await rideContract.nameChangeable()).to.equal(false);
      expect(await rideContract.colorChangeable()).to.equal(false);
      expect(await rideContract.proxyRegistryAddress()).to.equal(AddressZero());
      const defaultColor = await rideContract.defaultColor();
      expect(defaultColor.length).to.equal(2);
      expect(parseInt(defaultColor[0]) === 0x01234567).to.equal(true);
      expect(parseInt(defaultColor[1]) === 0x89ABCDEF).to.equal(true);
    });

    it('should correctly handle the abnormal values while deploying', async () => {
      await expectRevert(factory.connect(owner).createNFT("", "RIDE0", [rideUri], 100, mintPrice, false, false, []), "revert Factory: name is empty");
      await expectRevert(factory.connect(owner).createNFT("RideNft0", "", [rideUri], 100, mintPrice, false, false, []), "revert Factory: symbol is empty");
    });

    it('should set the capacity as maximum value when it is input as 0', async () => {
      await factory.connect(owner).createNFT("RideNft0", "RIDE0", [rideUri], 0, mintPrice, false, false, []);
      const rideContract = getRideContract(await factory.nfts(0), a1);
      expect(await rideContract.capacity()).to.equal(UInt256Max());
    });

    it('should be able to deploy the multiple ride contracts', async () => {
      await factory.connect(owner).createNFT("RideNft0", "RIDE0", [rideUri], 100, mintPrice, true, false, []);
      const rideContract0 = getRideContract(await factory.nfts(0), a1);
      expect(await rideContract0.nameChangeable()).to.equal(true);
      expect(await rideContract0.colorChangeable()).to.equal(false);
      const defaultColor = await rideContract0.defaultColor();
      expect(defaultColor.length).to.equal(0);

      await factory.connect(owner).createNFT("RideNft1", "RIDE1", [rideUri], 100, mintPrice, false, true, []);
      const rideContract1 = getRideContract(await factory.nfts(1), a1);
      expect(await rideContract1.nameChangeable()).to.equal(false);
      expect(await rideContract1.colorChangeable()).to.equal(true);
    });
  });

  describe('basic methods', () => {
    it('setOpenseaProxyRegistry method', async () => {
      await factory.connect(owner).createNFT("RideNft0", "RIDE0", [rideUri], 100, mintPrice, true, false, []);
      const rideContract0 = getRideContract(await factory.nfts(0), a1);
      await expectRevert(rideContract0.setOpenseaProxyRegistry(a1.address), "revert Ownable: caller is not the owner");
      await rideContract0.connect(owner).setOpenseaProxyRegistry(a1.address);
      expect(await rideContract0.proxyRegistryAddress()).to.equal(a1.address);
    });

    it('setUris method', async () => {
      const uri0 = "https://test_uri0";
      const uri1 = "https://test_uri1";
      await factory.connect(owner).createNFT("RideNft0", "RIDE0", [rideUri], 100, mintPrice, true, false, []);
      const rideContract0 = getRideContract(await factory.nfts(0), a1);

      await expectRevert(rideContract0.setUris([uri0]), "revert Ownable: caller is not the owner");
      await expectRevert(rideContract0.connect(owner).setUris([]), "revert Metafiles must be specified at least one");
      await rideContract0.connect(owner).setUris([uri0, uri1]);
      expect(await rideContract0.tokenURI(1)).to.equal(uri1);
      expect(await rideContract0.tokenURI(2)).to.equal(uri0);
      expect(await rideContract0.tokenURI(3)).to.equal(uri1);
    });

    it('setMintPrice method', async () => {
      await factory.connect(owner).createNFT("RideNft0", "RIDE0", [rideUri], 100, mintPrice, true, false, []);
      const rideContract0 = getRideContract(await factory.nfts(0), a1);
      await expectRevert(rideContract0.setMintPrice(123), "revert Ownable: caller is not the owner");
      await rideContract0.connect(owner).setMintPrice(123);
      expect(await rideContract0.mintPrice()).to.equal(123);
      expect((await rideContract0.callStatic.mintPriceInZone()).toNumber()).to.greaterThan(0);
    });
  });

  describe('mint', () => {
    it('mint & mintWithParams methods', async () => {
      await factory.connect(owner).createNFT("RideNft0", "RIDE0", [rideUri], 100, mintPrice, true, true, [0x01234567, 0x89ABCDEF]);
      const rideContract0 = getRideContract(await factory.nfts(0), a1);
      const priceInZone = await rideContract0.callStatic.mintPriceInZone();
      await zoneToken.connect(owner).transfer(a1.address, priceInZone.mul(2));
      await zoneToken.connect(a1).approve(rideContract0.address, priceInZone.mul(2));

      // mint
      let tokenId = 1;
      await rideContract0.mint();
      expect(await zoneToken.balanceOf(rideContract0.address)).to.equal(priceInZone);
      expect(await rideContract0.balanceOf(a1.address)).to.equal(1);
      expect(await rideContract0.ownerOf(tokenId)).to.equal(a1.address);
      expect(await rideContract0.totalSupply()).to.equal(1);
      expect(await rideContract0.tokenByIndex(0)).to.equal(1);
      expect(await rideContract0.tokenOfOwnerByIndex(a1.address, 0)).to.equal(1);

      // The color should be same with the default color
      let color = await rideContract0.tokenColorById(tokenId);
      expect(color.length).to.equal(2);
      expect(parseInt(color[0]) === 0x01234567).to.equal(true);
      expect(parseInt(color[1]) === 0x89ABCDEF).to.equal(true);
      // The name should be zero length
      expect(await rideContract0.tokenNameById(tokenId)).to.equal("");

      // mintWithParams
      tokenId = 2;
      await rideContract0.mintWithParams("token1", [0x01010101, 0x10101010]);
      expect(await zoneToken.balanceOf(rideContract0.address)).to.equal(priceInZone.mul(2));
      expect(await rideContract0.balanceOf(a1.address)).to.equal(2);
      expect(await rideContract0.ownerOf(tokenId)).to.equal(a1.address);
      expect(await rideContract0.totalSupply()).to.equal(2);
      expect(await rideContract0.tokenByIndex(1)).to.equal(2);
      expect(await rideContract0.tokenOfOwnerByIndex(a1.address, 1)).to.equal(2);

      // The color should be same with the input color
      color = await rideContract0.tokenColorById(tokenId);
      expect(color.length).to.equal(2);
      expect(parseInt(color[0]) === 0x01010101).to.equal(true);
      expect(parseInt(color[1]) === 0x10101010).to.equal(true);
      // The name should be zero length
      expect(await rideContract0.tokenNameById(tokenId)).to.equal("token1");
    });

    it('mintWithParams should be failed when not allowed to change attributes', async () => {
      await factory.connect(owner).createNFT("RideNft0", "RIDE0", [rideUri], 100, mintPrice, false, true, [0x01234567, 0x89ABCDEF]);
      const rideContract0 = getRideContract(await factory.nfts(0), a1);
      let priceInZone = await rideContract0.callStatic.mintPriceInZone();
      await zoneToken.connect(owner).transfer(a1.address, priceInZone);
      await zoneToken.connect(a1).approve(rideContract0.address, priceInZone);
      await expectRevert(rideContract0.mintWithParams("token1", [0x01010101, 0x10101010]), "Nft: disabled to change name");

      await factory.connect(owner).createNFT("RideNft1", "RIDE1", [rideUri], 100, mintPrice*2, true, false, [0x01234567, 0x89ABCDEF]);
      const rideContract1 = getRideContract(await factory.nfts(1), a1);
      priceInZone = await rideContract1.callStatic.mintPriceInZone();
      await zoneToken.connect(owner).transfer(a1.address, priceInZone);
      await zoneToken.connect(a1).approve(rideContract1.address, priceInZone);
      await expectRevert(rideContract1.mintWithParams("token1", [0x01010101, 0x10101010]), "Nft: disabled to change color");
    });

    it('should be limited by capacity', async () => {
      await factory.connect(owner).createNFT("RideNft0", "RIDE0", [rideUri], 1, mintPrice, true, true, [0x01234567, 0x89ABCDEF]);
      const rideContract0 = getRideContract(await factory.nfts(0), a1);
      const priceInZone = await rideContract0.callStatic.mintPriceInZone();
      await zoneToken.connect(owner).transfer(a1.address, priceInZone.mul(2));
      await zoneToken.connect(a1).approve(rideContract0.address, priceInZone.mul(2));

      // mint
      await rideContract0.mint();
      await expectRevert(rideContract0.mint(), "Exceeds capacity");
    });

    it('withdraw', async () => {
      await factory.connect(owner).createNFT("RideNft0", "RIDE0", [rideUri], 100, mintPrice, true, true, [0x01234567, 0x89ABCDEF]);
      const rideContract0 = getRideContract(await factory.nfts(0), a1);
      const priceInZone = await rideContract0.callStatic.mintPriceInZone();
      await zoneToken.connect(owner).transfer(a1.address, priceInZone.mul(2));
      await zoneToken.connect(a1).approve(rideContract0.address, priceInZone.mul(2));

      // mint
      await rideContract0.mint();
      await rideContract0.mint();
      expect(await zoneToken.balanceOf(rideContract0.address)).to.equal(priceInZone.mul(2));

      // withdraw
      await expectRevert(rideContract0.withdraw(), "revert Ownable: caller is not the owner");
      const ownerBalance = await zoneToken.balanceOf(owner.address);
      await rideContract0.connect(owner).withdraw();
      expect(await zoneToken.balanceOf(owner.address)).to.equal(ownerBalance.add(priceInZone.mul(2)));
    });
  });

  describe('airdrop', () => {
    it('doAirdrop should be failed with incorrect pramaters', async () => {
      await factory.connect(owner).createNFT("RideNft0", "RIDE0", [rideUri], 10, mintPrice, true, true, [0x01234567, 0x89ABCDEF]);
      const rideContract0 = getRideContract(await factory.nfts(0), a1);

      await expectRevert(rideContract0.doAirdrop([a1.address]), "revert Restricted access to admin");
      await expectRevert(rideContract0.setAdmin(a2.address), "revert Ownable: caller is not the owner");
      await rideContract0.connect(owner).setAdmin(a2.address);

      await expectRevert(rideContract0.connect(a2).doAirdrop([]), "Nft: No account address");
      await expectRevert(rideContract0.connect(a2).doAirdrop([
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
      await expectRevert(rideContract0.connect(a2).doAirdrop([
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
      ]), "Exceeds capacity");
    });

    it('doAirdrop should be succeed with correct pramaters', async () => {
      await factory.connect(owner).createNFT("RideNft0", "RIDE0", [rideUri], 10, mintPrice, true, true, [0x01234567, 0x89ABCDEF]);
      const rideContract0 = getRideContract(await factory.nfts(0), a1);

      await rideContract0.connect(owner).setAdmin(a2.address);
      await rideContract0.connect(a2).doAirdrop([
        accounts[0].address,
        accounts[1].address,
        accounts[2].address,
      ]);
      expect(await rideContract0.totalSupply()).to.equal(3);
      expect(await rideContract0.ownerOf(1)).to.equal(accounts[0].address);
      expect(await rideContract0.ownerOf(2)).to.equal(accounts[1].address);
      expect(await rideContract0.ownerOf(3)).to.equal(accounts[2].address);
      await expectRevert(rideContract0.connect(a2).doAirdrop([accounts[0].address]), "Only one time airdrop is allowed per user");
    });

    it('doAirdropBySignature should be succeed with correct pramaters', async () => {
      await factory.connect(owner).createNFT("RideNft0", "RIDE0", [rideUri], 10, mintPrice, true, true, [0x01234567, 0x89ABCDEF]);
      const rideContract0 = getRideContract(await factory.nfts(0), a1);
      await rideContract0.connect(owner).setAdmin(a2.address);

      const message = ethers.utils.solidityKeccak256(
        ["address", "address"],
        [rideContract0.address, accounts[0].address]
      );
      const signature = await a2.signMessage(ethers.utils.arrayify(message));

      await rideContract0.doAirdropBySignature(accounts[0].address, signature);
      expect(await rideContract0.totalSupply()).to.equal(1);
      expect(await rideContract0.ownerOf(1)).to.equal(accounts[0].address);
      await expectRevert(rideContract0.doAirdropBySignature(accounts[0].address, signature), "Only one time airdrop is allowed per user");
    });
  });

  describe('name', () => {
    it('should be failed with incorrect pramaters', async () => {
      await factory.connect(owner).createNFT("RideNft0", "RIDE0", [rideUri], 100, mintPrice, true, false, []);
      const rideContract0 = getRideContract(await factory.nfts(0), a1);

      // mint
      const priceInZone = await rideContract0.callStatic.mintPriceInZone();
      await zoneToken.connect(owner).transfer(a1.address, priceInZone);
      await zoneToken.connect(a1).approve(rideContract0.address, priceInZone);
      await rideContract0.mint();

      await expectRevert(rideContract0.connect(owner).changeName(1, "token1"), "Nft: caller is not the token owner");
      await expectRevert(rideContract0.changeName(1, ""), "Nft: new name is same as the current one");
      await expectRevert(rideContract0.changeName(1, " test "), "Nft: invalid name");

      await factory.connect(owner).createNFT("RideNft0", "RIDE0", [rideUri], 100, mintPrice, false, true, []);
      const rideContract1 = getRideContract(await factory.nfts(1), a1);
      await zoneToken.connect(owner).transfer(a1.address, priceInZone);
      await zoneToken.connect(a1).approve(rideContract1.address, priceInZone);
      await rideContract1.mint();
      await expectRevert(rideContract1.changeName(1, "tocken1"), "Nft: disabled to change name");
    });

    it('should be correctly changed the name', async () => {
      await factory.connect(owner).createNFT("RideNft0", "RIDE0", [rideUri], 100, mintPrice, true, false, []);
      const rideContract0 = getRideContract(await factory.nfts(0), a1);

      // mint
      const priceInZone = await rideContract0.callStatic.mintPriceInZone();
      await zoneToken.connect(owner).transfer(a1.address, priceInZone.mul(2));
      await zoneToken.connect(a1).approve(rideContract0.address, priceInZone.mul(2));
      await rideContract0.mint();
      await rideContract0.mint();

      // change name
      await rideContract0.connect(a1).changeName(2, "token1");
      expect(await rideContract0.tokenNameById(2)).to.equal("token1");

      // should be failed to change with the duplicated name
      expect(await rideContract0.tokenNameById(1)).to.equal("");
      await expectRevert(rideContract0.changeName(1, "token1"), "Nft: name already reserved");
    });
  });

  describe('color', () => {
    it('should be failed with incorrect pramaters', async () => {
      await factory.connect(owner).createNFT("RideNft0", "RIDE0", [rideUri], 100, mintPrice, false, true, [0x01234567, 0x89ABCDEF]);
      const rideContract0 = getRideContract(await factory.nfts(0), a1);

      // mint
      const priceInZone = await rideContract0.callStatic.mintPriceInZone();
      await zoneToken.connect(owner).transfer(a1.address, priceInZone);
      await zoneToken.connect(a1).approve(rideContract0.address, priceInZone);
      await rideContract0.mint();

      await expectRevert(rideContract0.connect(owner).changeColor(1, []), "Nft: caller is not the token owner");
      await expectRevert(rideContract0.changeColor(1, [0x01010101]), "Nft: color length mismatch");

      await factory.connect(owner).createNFT("RideNft0", "RIDE0", [rideUri], 100, mintPrice, true, false, [0x01234567, 0x89ABCDEF]);
      const rideContract1 = getRideContract(await factory.nfts(1), a1);
      await zoneToken.connect(owner).transfer(a1.address, priceInZone);
      await zoneToken.connect(a1).approve(rideContract1.address, priceInZone);
      await rideContract1.mint();
      await expectRevert(rideContract1.changeColor(1, []), "Nft: disabled to change color");
    });

    it('should be correctly changed the color', async () => {
      await factory.connect(owner).createNFT("RideNft0", "RIDE0", [rideUri], 100, mintPrice, false, true, [0x01234567, 0x89ABCDEF]);
      const rideContract0 = getRideContract(await factory.nfts(0), a1);

      // mint
      const priceInZone = await rideContract0.callStatic.mintPriceInZone();
      await zoneToken.connect(owner).transfer(a1.address, priceInZone.mul(2));
      await zoneToken.connect(a1).approve(rideContract0.address, priceInZone.mul(2));
      await rideContract0.mint();
      await rideContract0.mint();

      // change name
      await rideContract0.connect(a1).changeColor(1, [0x01010101, 0x10101010]);
      let color = await rideContract0.tokenColorById(1);
      expect(color.length).to.equal(2);
      expect(parseInt(color[0]) === 0x01010101).to.equal(true);
      expect(parseInt(color[1]) === 0x10101010).to.equal(true);

      // reset to the default color
      await rideContract0.connect(a1).changeColor(1, []);
      color = await rideContract0.tokenColorById(1);
      expect(color.length).to.equal(2);
      expect(parseInt(color[0]) === 0x01234567).to.equal(true);
      expect(parseInt(color[1]) === 0x89ABCDEF).to.equal(true);
    });
  });

  describe('Call the contract method by meta transaction', () => {
    it('mint', async () => {
      await zoneToken.connect(owner).transfer(signingKey.address, toAmount(1000));
      await zoneToken.connect(signingKey).approve(relayContract.address, toAmount(1000));

      // deposit tx fee to the relay contract
      nonce = await relayContract.getNonce(signingKey.address);
      const depositFunctionSignature = relayContract.interface.encodeFunctionData("deposit", [toAmount(500)]);
      let { r, s, v } = await getTransactionData(relayDomainData, nonce, depositFunctionSignature);
      await relayContract.executeMetaTransaction(signingKey.address, depositFunctionSignature, r, s, v);

      // mint via the relay contract
      await factory.connect(owner).createNFT("RideNft0", "RIDE0", [rideUri], 100, mintPrice, true, true, [0x01234567, 0x89ABCDEF]);
      const rideContract0 = getRideContract(await factory.nfts(0), a1);
      const priceInZone = await rideContract0.callStatic.mintPriceInZone();
      await zoneToken.connect(signingKey).approve(rideContract0.address, priceInZone);

      const domainData = {
        name: await rideContract0.name(),
        version: "1",
        verifyingContract: rideContract0.address,
        salt: chainIdSalt,
      };
      nonce = await rideContract0.getNonce(signingKey.address);
      const mintFunctionSignature = rideContract0.interface.encodeFunctionData("mintWithParams", ["token1", [0x01010101, 0x10101010]]);
      let { r:r1, s:s1, v:v1 } = await getTransactionData(domainData, nonce, mintFunctionSignature);

      await relayContract.connect(owner).setBiconomyForwarder(a1.address);
      // await expectRevert(relayContract.connect(a1).relayMetaTransaction(signingKey.address, rideContract0.address, mintFunctionSignature, r1, s1, v1), "Relay: The contract is not allowed");
      // await relayContract.connect(owner).grantRole(await relayContract.ALLOWED_CONTRACTS(), rideContract0.address);
      await relayContract.connect(a1).relayMetaTransaction(signingKey.address, rideContract0.address, mintFunctionSignature, r1, s1, v1);

      expect(await rideContract0.getNonce(signingKey.address)).to.equal(parseInt(nonce) + 1);
      const balance = await relayContract.balanceOf(signingKey.address);
      const fee = await relayContract.balanceOf(owner.address);
      expect(fee).to.gte(0);
      expect(balance.add(fee)).to.equal(toAmount(500));

      expect(await zoneToken.balanceOf(rideContract0.address)).to.equal(priceInZone);
      expect(await rideContract0.balanceOf(signingKey.address)).to.equal(1);
      expect(await rideContract0.ownerOf(1)).to.equal(signingKey.address);
      expect(await rideContract0.totalSupply()).to.equal(1);
      expect(await rideContract0.tokenByIndex(0)).to.equal(1);
      expect(await rideContract0.tokenOfOwnerByIndex(signingKey.address, 0)).to.equal(1);

      // The color should be same with the input color
      color = await rideContract0.tokenColorById(1);
      expect(color.length).to.equal(2);
      expect(parseInt(color[0]) === 0x01010101).to.equal(true);
      expect(parseInt(color[1]) === 0x10101010).to.equal(true);
      // The name should be zero length
      expect(await rideContract0.tokenNameById(1)).to.equal("token1");
    });

    it('doAirdropBySignature', async () => {
      await factory.connect(owner).createNFT("RideNft0", "RIDE0", [rideUri], 10, mintPrice, true, true, [0x01234567, 0x89ABCDEF]);
      const rideContract0 = getRideContract(await factory.nfts(0), a1);
      await rideContract0.connect(owner).setAdmin(a2.address);

      const message = ethers.utils.solidityKeccak256(
        ["address", "address"],
        [rideContract0.address, accounts[0].address]
      );
      const signature = await a2.signMessage(ethers.utils.arrayify(message));

      const domainData = {
        name: await rideContract0.name(),
        version: "1",
        verifyingContract: rideContract0.address,
        salt: chainIdSalt,
      };
      nonce = await rideContract0.getNonce(signingKey.address);
      const functionSignature = rideContract0.interface.encodeFunctionData("doAirdropBySignature", [accounts[0].address, signature]);
      let { r, s, v } = await getTransactionData(domainData, nonce, functionSignature);
      await rideContract0.executeMetaTransaction(signingKey.address, functionSignature, r, s, v);

      expect(await rideContract0.totalSupply()).to.equal(1);
      expect(await rideContract0.ownerOf(1)).to.equal(accounts[0].address);
      await expectRevert(rideContract0.doAirdropBySignature(accounts[0].address, signature), "Only one time airdrop is allowed per user");
    });
  });
});
