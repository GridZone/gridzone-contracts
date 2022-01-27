const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");
const { expectRevert } = require('@openzeppelin/test-helpers');
const sigUtil = require('eth-sig-util');
const { BigNumber, utils } = ethers;
const parseEther = utils.parseEther;

const { polygonMainnet: network_ } = require("../../parameters");
const ZONE_ABI = require("../../abis/ZONE_ABI.json");
const { sendEth, etherBalance } = require('../utils/Ethereum');

const limit = 300;
const reward = parseEther('0.2');
const zoneReward = parseEther('20');
const zoneExtraReward = zoneReward.mul(2500).div(10000);

const INFO_CLAIMED = 0;
const INFO_CLAIMED_REWARD = 1;
const INFO_CLAIMED_ZONE_REWARD = 2;
const INFO_CLAIMED_EXTRA_REWARD = 3;

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

describe('GZRewardsUpgradeable', () => {

  let owner, vault;
  let zoneToken, contract;
  let contractArtifact;
  
  before(async () => {
    [deployer, a1, a2, ...accounts] = await ethers.getSigners();

    contractArtifact = await deployments.getArtifact("GZRewardsUpgradeable");

    owner = await ethers.getSigner(network_.Global.ownerAddress);
    vault = await ethers.getSigner(network_.ZONE.vaultAddress);
    zoneToken = new ethers.Contract(network_.ZONE.tokenAddress, ZONE_ABI, deployer);
  });

  beforeEach(async () => {
    await deployments.fixture(["hardhat_polygonMainnet_GZRewards"])

    const proxyContract = await ethers.getContract("GZRewardsUpgradeableProxy");
    contract = new ethers.Contract(proxyContract.address, contractArtifact.abi, a1);

    await sendEth(a1.address, owner.address, '1');
  });

  describe('basic', () => {
    it('initial set', async () => {
      expect(await contract.owner()).to.equal(owner.address);
      expect(await contract.zoneToken()).to.equal(zoneToken.address);
      expect(await contract.admin()).to.equal(owner.address);
      expect(await contract.limit()).to.equal(limit);
      expect(await contract.claimedCount()).to.equal(0);
      expect(await contract.reward()).to.equal(reward);
      expect(await contract.zoneReward()).to.equal(zoneReward);
      expect(await contract.zoneExtraReward()).to.equal(zoneExtraReward);
    });

    it('Should be set by only owner', async () => {
      await expectRevert(contract.setAdmin(a2.address), "Ownable: caller is not the owner");
      await contract.connect(owner).setAdmin(a2.address);
      expect(await contract.admin()).to.equal(a2.address);

      await expectRevert(contract.setLimit(150), "Ownable: caller is not the owner");
      await contract.connect(owner).setLimit(150);
      expect(await contract.limit()).to.equal(150);

      await expectRevert(contract.setReward(parseEther('0.2')), "Ownable: caller is not the owner");
      await contract.connect(owner).setReward(parseEther('0.2'));
      expect(await contract.reward()).to.equal(parseEther('0.2'));

      await expectRevert(contract.setZoneReward(parseEther('3'), 1000), "Ownable: caller is not the owner");
      await contract.connect(owner).setZoneReward(parseEther('3'), 1000);
      expect(await contract.zoneReward()).to.equal(parseEther('3'));
      expect(await contract.zoneExtraReward()).to.equal(parseEther('3').mul(1000).div(10000));

      await expectRevert(contract.withdraw(), "Ownable: caller is not the owner");
      await contract.connect(owner).withdraw();
    });

    it('withdraw', async () => {
      await sendEth(a1.address, contract.address, '1');
      await zoneToken.connect(vault).transfer(contract.address, parseEther('1000'));

      const ethBalanceBefore = await etherBalance(owner.address);
      const zoneBalanceBefore = await zoneToken.balanceOf(owner.address);
      await contract.connect(owner).withdraw();
      expect(await etherBalance(contract.address)).to.equal(0);
      expect(await zoneToken.balanceOf(contract.address)).to.equal(0);
      expect((await etherBalance(owner.address)).gt(ethBalanceBefore)).equal(true);
      expect(await zoneToken.balanceOf(owner.address)).to.equal(zoneBalanceBefore.add(parseEther('1000')));
    });
  });

  describe('claim', () => {
    beforeEach(async () => {
      await sendEth(a1.address, contract.address, '1');
      await zoneToken.connect(vault).transfer(contract.address, parseEther('1000'));
      await contract.connect(owner).setAdmin(a2.address);
    });

    it('doAirdropBySignature should be succeed', async () => {
      const message = ethers.utils.solidityKeccak256(
        ["address", "address", "bool"],
        [contract.address, a1.address, false]
      );
      const signature = await a2.signMessage(ethers.utils.arrayify(message));

      const ethBalanceBefore = await etherBalance(a1.address);
      const zoneBalanceBefore = await zoneToken.balanceOf(a1.address);
      const contractEthBalance = await etherBalance(contract.address);
      const contractZoneBalance = await zoneToken.balanceOf(contract.address);

      await contract.doAirdropBySignature(a1.address, false, signature);

      expect((await etherBalance(a1.address)).gt(ethBalanceBefore)).equal(true);
      expect(await zoneToken.balanceOf(a1.address)).to.equal(zoneBalanceBefore.add(zoneReward));
      expect(await etherBalance(contract.address)).to.equal(contractEthBalance.sub(reward));
      expect(await zoneToken.balanceOf(contract.address)).to.equal(contractZoneBalance.sub(zoneReward));

      const info = await contract.getClaimedInfo(a1.address);
      expect(info[INFO_CLAIMED]).to.equal(true);
      expect(info[INFO_CLAIMED_REWARD]).to.equal(reward);
      expect(info[INFO_CLAIMED_ZONE_REWARD]).to.equal(zoneReward);
      expect(info[INFO_CLAIMED_EXTRA_REWARD]).to.equal(0);
    });

    it('doAirdropBySignature should be succeed with extra reward', async () => {
      const message = ethers.utils.solidityKeccak256(
        ["address", "address", "bool"],
        [contract.address, a1.address, true]
      );
      const signature = await a2.signMessage(ethers.utils.arrayify(message));

      const ethBalanceBefore = await etherBalance(a1.address);
      const zoneBalanceBefore = await zoneToken.balanceOf(a1.address);
      const contractEthBalance = await etherBalance(contract.address);
      const contractZoneBalance = await zoneToken.balanceOf(contract.address);

      await expectRevert(contract.doAirdropBySignature(a2.address, false, signature), "Not allowed");
      await contract.doAirdropBySignature(a1.address, true, signature);

      expect((await etherBalance(a1.address)).gt(ethBalanceBefore)).equal(true);
      expect(await zoneToken.balanceOf(a1.address)).to.equal(zoneBalanceBefore.add(zoneReward).add(zoneExtraReward));
      expect(await etherBalance(contract.address)).to.equal(contractEthBalance.sub(reward));
      expect(await zoneToken.balanceOf(contract.address)).to.equal(contractZoneBalance.sub(zoneReward).sub(zoneExtraReward));

      const info = await contract.getClaimedInfo(a1.address);
      expect(info[INFO_CLAIMED]).to.equal(true);
      expect(info[INFO_CLAIMED_REWARD]).to.equal(reward);
      expect(info[INFO_CLAIMED_ZONE_REWARD]).to.equal(zoneReward);
      expect(info[INFO_CLAIMED_EXTRA_REWARD]).to.equal(zoneExtraReward);
    });

    it('doAirdropBySignature should be allowed only once per account', async () => {
      const message = ethers.utils.solidityKeccak256(
        ["address", "address", "bool"],
        [contract.address, a1.address, false]
      );
      const signature = await a2.signMessage(ethers.utils.arrayify(message));

      await contract.doAirdropBySignature(a1.address, false, signature);
      await expectRevert(contract.doAirdropBySignature(a1.address, false, signature), "Already claimed");
    });

    it('doAirdropBySignature should be limited', async () => {
      const message = ethers.utils.solidityKeccak256(
        ["address", "address", "bool"],
        [contract.address, a1.address, false]
      );
      const signature = await a2.signMessage(ethers.utils.arrayify(message));

      await contract.connect(owner).setLimit(1);
      await contract.doAirdropBySignature(a1.address, false, signature);
      await expectRevert(contract.doAirdropBySignature(a1.address, false, signature), "Reached to limit");
    });

    // it('doAirdropBySignature should be succeed by meta transaction', async () => {
    //   const chainId = (await ethers.provider.getNetwork()).chainId;
    //   const chainIdSalt = '0x' + chainId.toString(16).padStart(64, '0');

    //   const message = ethers.utils.solidityKeccak256(
    //     ["address", "address", "bool"],
    //     [contract.address, a1.address, true]
    //   );
    //   const signature = await a2.signMessage(ethers.utils.arrayify(message));

    //   const domainData = {
    //     name: "GZRewards",
    //     version: "1",
    //     verifyingContract: contract.address,
    //     salt: chainIdSalt,
    //   };
    //   nonce = await contract.getNonce(signingKey.address);
    //   const functionSignature = contract.interface.encodeFunctionData("doAirdropBySignature", [a1.address, true, signature]);
    //   let { r, s, v } = await getTransactionData(domainData, nonce, functionSignature);

    //   const ethBalanceBefore = await etherBalance(a1.address);
    //   const zoneBalanceBefore = await zoneToken.balanceOf(a1.address);
    //   const contractEthBalance = await etherBalance(contract.address);
    //   const contractZoneBalance = await zoneToken.balanceOf(contract.address);

    //   await contract.executeMetaTransaction(signingKey.address, functionSignature, r, s, v);

    //   expect((await etherBalance(a1.address)).gt(ethBalanceBefore)).equal(true);
    //   expect(await zoneToken.balanceOf(a1.address)).to.equal(zoneBalanceBefore.add(zoneReward).add(zoneExtraReward));
    //   expect(await etherBalance(contract.address)).to.equal(contractEthBalance.sub(reward));
    //   expect(await zoneToken.balanceOf(contract.address)).to.equal(contractZoneBalance.sub(zoneReward).sub(zoneExtraReward));
    // });
  });
});
