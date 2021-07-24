const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");
const { expectRevert } = require('@openzeppelin/test-helpers');
const sigUtil = require('eth-sig-util');

const { polygonMainnet: network_ } = require("../../parameters");
const ZONE_ABI = require("../../abis/ZONE_ABI.json");
const { sendEth } = require('../utils/Ethereum');

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


describe('BiconomyMetaTxRelayUpgradeable', () => {

  let owner, biconomyForwarder;
  let gasPriceInZone;
  let zoneToken, relayContract;
  let implArtifact;
  let domainData;
  let chainId, chainIdSalt;

  before(async () => {
    [deployer, a1, a2, ...accounts] = await ethers.getSigners();

    implArtifact = await deployments.getArtifact("BiconomyMetaTxRelayUpgradeable");

    owner = await ethers.getSigner(network_.Global.ownerAddress);
    biconomyForwarder = network_.BiconomyMetaTxRelay.biconomyForwarder;
    gasPriceInZone = network_.BiconomyMetaTxRelay.gasPriceInZone;

    zoneToken = new ethers.Contract(network_.ZONE.tokenAddress, ZONE_ABI, deployer);
    decimals = await zoneToken.decimals();

    chainId = (await ethers.provider.getNetwork()).chainId;
    chainIdSalt = '0x' + chainId.toString(16).padStart(64, '0');
  });

  beforeEach(async () => {
    await deployments.fixture(["hardhat_polygonMainnet"])

    const proxyContract = await ethers.getContract("BiconomyMetaTxRelayUpgradeableProxy");
    relayContract = new ethers.Contract(proxyContract.address, implArtifact.abi, a1);

    await sendEth(a1.address, signingKey.address, '1');
    await sendEth(a1.address, owner.address, '1');

    domainData = {
      name: "BiconomyMetaTxRelayUpgradeable",
      version: "1",
      verifyingContract: relayContract.address,
      salt: chainIdSalt,
    };
  });

  describe('metadata', () => {
    it('should has the correct addresses', async () => {

      expect(await relayContract.owner()).to.equal(owner.address);
      expect(await relayContract.zoneToken()).to.equal(zoneToken.address);
      expect(await relayContract.gasPriceInZone()).to.equal(gasPriceInZone);
      expect(await relayContract.trustedForwarder()).to.equal(biconomyForwarder);
    });
  });

  describe('basic condition', () => {
    it('should have role', async () => {
      const DEFAULT_ADMIN_ROLE = await relayContract.DEFAULT_ADMIN_ROLE();
      const ALLOWED_CONTRACTS = await relayContract.ALLOWED_CONTRACTS();

      expect(await relayContract.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.equal(true);
      expect(await relayContract.hasRole(ALLOWED_CONTRACTS, relayContract.address)).to.equal(true);
    });

    it('should be set with correct the gasPriceInZone by owner', async () => {
      const newGasPriceInZone = 2000000000;
      await expectRevert(relayContract.setGasPriceInZone(newGasPriceInZone), "revert Ownable: caller is not the owner");
      await relayContract.connect(owner).setGasPriceInZone(newGasPriceInZone);
      expect(await relayContract.gasPriceInZone()).to.equal(newGasPriceInZone);
    });

    it('should be set with correct the biconomyForwarder by owner', async () => {
      await expectRevert(relayContract.setBiconomyForwarder(a1.address), "revert Ownable: caller is not the owner");
      await relayContract.connect(owner).setBiconomyForwarder(a1.address);
      expect(await relayContract.trustedForwarder()).to.equal(a1.address);
    });
  });

  describe('Call the contract method directly', () => {
    it('should be deposited and withdrawn correctly', async () => {
      await zoneToken.connect(owner).transfer(a1.address, toAmount(1000));
      await zoneToken.connect(a1).approve(relayContract.address, toAmount(1000));

      // deposit
      await relayContract.connect(a1).deposit(toAmount(500));
      expect(await relayContract.balanceOf(a1.address)).to.equal(toAmount(500));
      await relayContract.connect(a1).deposit(toAmount(500));
      expect(await relayContract.balanceOf(a1.address)).to.equal(toAmount(1000));

      // withdraw
      await relayContract.connect(a1).withdraw(toAmount(400));
      expect(await zoneToken.balanceOf(a1.address)).to.equal(toAmount(400));
      expect(await relayContract.balanceOf(a1.address)).to.equal(toAmount(600));
    });
  });

  describe('Call the contract method by meta transaction', () => {
    it("Should be able to send transaction successfully", async () => {
      await zoneToken.connect(owner).transfer(signingKey.address, toAmount(1000));
      await zoneToken.connect(signingKey).approve(relayContract.address, toAmount(1000));

      // deposit
      let nonce = await relayContract.getNonce(signingKey.address);
      const depositFunctionSignature = relayContract.interface.encodeFunctionData("deposit", [toAmount(500)]);
      let { r, s, v } = await getTransactionData(domainData, nonce, depositFunctionSignature);

      await relayContract.executeMetaTransaction(signingKey.address, depositFunctionSignature, r, s, v);

      expect(await relayContract.getNonce(signingKey.address)).to.equal(parseInt(nonce) + 1);
      expect(await relayContract.balanceOf(signingKey.address)).to.equal(toAmount(500));

      // withdraw
      nonce = await relayContract.getNonce(signingKey.address);
      const withdrawFunctionSignature = relayContract.interface.encodeFunctionData("withdraw", [toAmount(300)]);
      let { r:r1, s:s1, v:v1 } = await getTransactionData(domainData, nonce, withdrawFunctionSignature);

      await expectRevert(relayContract.relayMetaTransaction(signingKey.address, relayContract.address, withdrawFunctionSignature, r1, s1, v1),
        "revert Function can only be called through the trusted Forwarder");

      await relayContract.connect(owner).setBiconomyForwarder(a1.address);
      await relayContract.connect(a1).relayMetaTransaction(signingKey.address, relayContract.address, withdrawFunctionSignature, r1, s1, v1)

      expect(await relayContract.getNonce(signingKey.address)).to.equal(parseInt(nonce) + 1);
      const balance = await relayContract.balanceOf(signingKey.address);
      const fee = await relayContract.balanceOf(owner.address);
      expect(fee).to.gte(0);
      expect(balance.add(fee)).to.equal(toAmount(200));
    });
  });
});
