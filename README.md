# GridZone Contracts

We detail a few of the core contracts.

<dl>
  <dt>Staking BOT</dt>
  <dd>The staking contract of GridZone token. Holders will be rewarded against to amount and days which they staked.</dd>
</dl>

<dl>
  <dt>NYM NFT</dt>
  <dd>The contract of NYM token. When a new user is registered, it will be minted for the user.</dd>
</dl>

<dl>
  <dt>GenesisSaleRewardAirdrop</dt>
  <dd>The airdrop contract for the rewards against the purchases in Genesis sales.</dd>
</dl>

## Installation
Pull the repository from GitHub and install its dependencies. You will need [npm](https://docs.npmjs.com/cli/install) installed.

```text
git clone https://github.com/GridZone/gridzone-contracts.git
cd gridzone-contracts
npm install
```

## Environment

Create files storing private key and infura API key.

```text
cp .env.template .env
```

Open .env with text editor, write the private, infra API key, and etherscan API key

## Compile

Compile the smart contracts.

```text
npx hardhat compile
```

## Deploy and Verify contracts on Ethereum Mainnet

You can deploy contracts and verify with etherscan API key.

### ProxyAdmin

```text
npx hardhat deploy --network mainnet --tags mainnet_ProxyAdmin_deploy
npx hardhat deploy --network mainnet --tags mainnet_ProxyAdmin_verify
```

### NymLib

```text
npx hardhat deploy --network mainnet --tags mainnet_NymLibUpgradeable
```

### PriceOracle

```text
npx hardhat deploy --network mainnet --tags mainnet_PriceOracleUpgradeable
```

### Rides NFT

```text
npx hardhat deploy --network mainnet --tags mainnet_RideNft
```

### NYM

```text
npx hardhat deploy --network mainnet --tags mainnet_NYM_deploy
npx hardhat deploy --network mainnet --tags mainnet_NYM_verify
```

### Staking

```text
npx hardhat deploy --network mainnet --tags mainnet_GridZoneStakingBot_deploy
npx hardhat deploy --network mainnet --tags mainnet_GridZoneStakingBot_verify
```

### GenesisSaleRewardAirdrop

```text
npx hardhat deploy --network mainnet --tags mainnet_GenesisSaleRewardAirdrop_deploy
npx hardhat deploy --network mainnet --tags mainnet_GenesisSaleRewardAirdrop_verify
```

## Deploy and Verify contracts on Polygon Mainnet

### ProxyAdmin

```text
npx hardhat deploy --network polygonMainnet --tags polygonMainnet_ProxyAdmin_deploy
npx hardhat deploy --network polygonMainnet --tags polygonMainnet_ProxyAdmin_verify
```

### NymLib

```text
npx hardhat deploy --network polygonMainnet --tags polygonMainnet_NymLibUpgradeable_deploy
npx hardhat deploy --network polygonMainnet --tags polygonMainnet_NymLibUpgradeable_verify
```

### PriceOracle

```text
npx hardhat deploy --network polygonMainnet --tags polygonMainnet_PriceOracleUpgradeable_deploy
npx hardhat deploy --network polygonMainnet --tags polygonMainnet_PriceOracleUpgradeable_verify
```

### BiconomyMetaTxRelay

```text
npx hardhat deploy --network polygonMainnet --tags polygonMainnet_BiconomyMetaTxRelayUpgradeable_deploy
npx hardhat deploy --network polygonMainnet --tags polygonMainnet_BiconomyMetaTxRelayUpgradeable_verify
```

### NymFashion NFT

```text
npx hardhat deploy --network polygonMainnet --tags polygonMainnet_NymFashionNft_deploy
npx hardhat deploy --network polygonMainnet --tags polygonMainnet_NymFashionNft_verify
```

#### Grant NymFashionFactory the FACTORIES role on the BiconomyMetaTxRelay

* execute grantRole of BiconomyMetaTxRelay contract. The parameters are the value of BiconomyMetaTxRelay.FACTORIES and the address of factory contracts.

## Contract Addresses

| Contracts on Ethereum    | Mainnet Address                                                                                                       | Goerli  Address                                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| ZONE                     | [0xC1D9B5A0776d7C8B98b8A838e5a0DD1Bc5Fdd53C](https://etherscan.io/address/0xC1D9B5A0776d7C8B98b8A838e5a0DD1Bc5Fdd53C) | [0x862E80fFDDB68230CFc9850e767260A9595C93Eb](https://goerli.etherscan.io/address/0x862E80fFDDB68230CFc9850e767260A9595C93Eb) |
| Timelock                 | [0x0e11aA601F7e114Ea64eA3fd4Eb838A3bfDFb8B9](https://etherscan.io/address/0x0e11aA601F7e114Ea64eA3fd4Eb838A3bfDFb8B9) | [0x464141184F1E36D984888534C32817CBaE74955B](https://goerli.etherscan.io/address/0x464141184F1E36D984888534C32817CBaE74955B) |
| GovernorAlpha            | [0x542ED9b1b50dC686e88404C73C062faA39568304](https://etherscan.io/address/0x542ED9b1b50dC686e88404C73C062faA39568304) | [0x3959c224d5475090d99188D65E318546Af161977](https://goerli.etherscan.io/address/0x3959c224d5475090d99188D65E318546Af161977) |
| VoteBox                  | [0xe2c6aF4Aa0a3923C245a51a0188515f3b36B841A](https://etherscan.io/address/0xe2c6aF4Aa0a3923C245a51a0188515f3b36B841A) | [0x57E21D288E7ccBfb332295e4f8Ca738512e6E075](https://goerli.etherscan.io/address/0x57E21D288E7ccBfb332295e4f8Ca738512e6E075) |
| ProxyAdmin               | [0x341B280dE890a46E96961f04d438214c76F1E2d6](https://etherscan.io/address/0x341B280dE890a46E96961f04d438214c76F1E2d6) | [0x7bC3487097F6495D3d0d2944Df80B161612293a9](https://goerli.etherscan.io/address/0x7bC3487097F6495D3d0d2944Df80B161612293a9) |
| PublicSale               | [0xf963b0Df7d18F11e05e12371407a1f6a4091206F](https://etherscan.io/address/0xf963b0Df7d18F11e05e12371407a1f6a4091206F) | [0x44fE947e4cb4D5c07c9Ed1a4724B3e6B7A946C91](https://goerli.etherscan.io/address/0x44fE947e4cb4D5c07c9Ed1a4724B3e6B7A946C91) |
| NymLib                   |  | [0x06454E306DBCB79C7C139d5e8977ac455f812f52](https://goerli.etherscan.io/address/0x06454E306DBCB79C7C139d5e8977ac455f812f52) |
| PriceOracle              |  | [0xDcF7C8664c2191589C5170bF73c6faC5c7cC7bd6](https://goerli.etherscan.io/address/0xDcF7C8664c2191589C5170bF73c6faC5c7cC7bd6) |
| GridZone Rides (GZR)     |  | [0x606eBC0dd72238E8ca5B1F50BA78a3Cc1f3A8986](https://goerli.etherscan.io/address/0x606eBC0dd72238E8ca5B1F50BA78a3Cc1f3A8986) |
| LP Staking               |  | [0xd35A00A07e79B72457245Fc665c4D78609744414](https://goerli.etherscan.io/address/0xd35A00A07e79B72457245Fc665c4D78609744414) |
| NYM                      |  |  |
| GenesisSaleRewardAirdrop |  |  |
| GridZoneStakingBot       |  |  |


| Contracts on Polygon     | Mainnet Address                                                                                                          | Mumbai  Address                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| ZONE                     | [0x5Ab64dAAAa458d8f2019C0a3F2275FDc27e498D1](https://polygonscan.com/address/0x5Ab64dAAAa458d8f2019C0a3F2275FDc27e498D1) | [0x5248c77c11699082A92b9B6617F884bAF63787de](https://mumbai.polygonscan.com/address/0x5248c77c11699082A92b9B6617F884bAF63787de) |
| ProxyAdmin               | [0x0C762a36b46FcCAF1351b4122Eb2CEAF062f6d8B](https://polygonscan.com/address/0x0C762a36b46FcCAF1351b4122Eb2CEAF062f6d8B) | [0xd35bd944019a32B54C185eF0B863096e89afAdcA](https://mumbai.polygonscan.com/address/0xd35bd944019a32B54C185eF0B863096e89afAdcA) |
| BiconomyMetaTxRelay      | [0x92a456c2a4a068400305dAdFe6b0c6C60A64F0E4](https://polygonscan.com/address/0x92a456c2a4a068400305dAdFe6b0c6C60A64F0E4) | [0x2A7870CA37A02B53B6ca310904da3B9ce5ab8707](https://mumbai.polygonscan.com/address/0x2A7870CA37A02B53B6ca310904da3B9ce5ab8707) |
| GridZone Fashion (GZF)   | [0x844a77CA0E982eB1A971c9709D778959E906D902](https://polygonscan.com/address/0x844a77CA0E982eB1A971c9709D778959E906D902) | [0x81A140D74900B2f4D2f3c462cE752638d16938fb](https://mumbai.polygonscan.com/address/0x81A140D74900B2f4D2f3c462cE752638d16938fb) |
| GridZone Mask (GZM)      | [0x11a2C8836012638E0457Ba4dbA352b55A0068894](https://polygonscan.com/address/0x11a2C8836012638E0457Ba4dbA352b55A0068894) |  |
