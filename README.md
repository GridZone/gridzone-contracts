# GridZone Contracts

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

### Staking

```text
npx hardhat deploy --network mainnet --tags mainnet_ZoneStakingUpgradeable
```

### NYM

```text
npx hardhat deploy --network mainnet --tags mainnet_NymUpgradeable
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
| NymLib                   | [0x5e4233192C27A26ac10f84F4e748f56a8187a230](https://etherscan.io/address/0x5e4233192C27A26ac10f84F4e748f56a8187a230) | [0x06454E306DBCB79C7C139d5e8977ac455f812f52](https://goerli.etherscan.io/address/0x06454E306DBCB79C7C139d5e8977ac455f812f52) |
| PriceOracle              | [0x5B2B0d0f50b03451633604E7524f2d4adc61CC09](https://etherscan.io/address/0x5B2B0d0f50b03451633604E7524f2d4adc61CC09) | [0xDcF7C8664c2191589C5170bF73c6faC5c7cC7bd6](https://goerli.etherscan.io/address/0xDcF7C8664c2191589C5170bF73c6faC5c7cC7bd6) |
| GridZone Rides (GZR)     | [0x6C7489265fBCC42c9ab11f4Cf4987c7f175bcf30](https://etherscan.io/address/0x6C7489265fBCC42c9ab11f4Cf4987c7f175bcf30) | [0x606eBC0dd72238E8ca5B1F50BA78a3Cc1f3A8986](https://goerli.etherscan.io/address/0x606eBC0dd72238E8ca5B1F50BA78a3Cc1f3A8986) |
| LP Staking               | [0x6031C257Fb1C855Fe59fC68ee5B2Bfa9433cCE28](https://etherscan.io/address/0x6031C257Fb1C855Fe59fC68ee5B2Bfa9433cCE28) | [0xd35A00A07e79B72457245Fc665c4D78609744414](https://goerli.etherscan.io/address/0xd35A00A07e79B72457245Fc665c4D78609744414) |
| Zone Staking             | [0xc5EAFb53765991459743ae84d879BcA469b49dD2](https://etherscan.io/address/0xc5EAFb53765991459743ae84d879BcA469b49dD2) | [0xceA9c9b7Baf80C0c4eAD2139393ddD51d45e7690](https://goerli.etherscan.io/address/0xcea9c9b7baf80c0c4ead2139393ddd51d45e7690) |
| NYM                      | [0xF0ed050306C5f02eD9B579d7C4569F0cb87b6E12](https://etherscan.io/address/0xF0ed050306C5f02eD9B579d7C4569F0cb87b6E12) | [0x52FC32680f8015b8E9e16a0c82072CEEd7E170B8](https://goerli.etherscan.io/address/0x52FC32680f8015b8E9e16a0c82072CEEd7E170B8) |


| Contracts on Polygon     | Mainnet Address                                                                                                          | Mumbai  Address                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| ZONE                     | [0x5Ab64dAAAa458d8f2019C0a3F2275FDc27e498D1](https://polygonscan.com/address/0x5Ab64dAAAa458d8f2019C0a3F2275FDc27e498D1) | [0x5248c77c11699082A92b9B6617F884bAF63787de](https://mumbai.polygonscan.com/address/0x5248c77c11699082A92b9B6617F884bAF63787de) |
| ProxyAdmin               | [0x0C762a36b46FcCAF1351b4122Eb2CEAF062f6d8B](https://polygonscan.com/address/0x0C762a36b46FcCAF1351b4122Eb2CEAF062f6d8B) | [0xd35bd944019a32B54C185eF0B863096e89afAdcA](https://mumbai.polygonscan.com/address/0xd35bd944019a32B54C185eF0B863096e89afAdcA) |
| BiconomyMetaTxRelay      | [0x92a456c2a4a068400305dAdFe6b0c6C60A64F0E4](https://polygonscan.com/address/0x92a456c2a4a068400305dAdFe6b0c6C60A64F0E4) | [0x2A7870CA37A02B53B6ca310904da3B9ce5ab8707](https://mumbai.polygonscan.com/address/0x2A7870CA37A02B53B6ca310904da3B9ce5ab8707) |
| GridZone Fashion (GZF)   | [0x844a77CA0E982eB1A971c9709D778959E906D902](https://polygonscan.com/address/0x844a77CA0E982eB1A971c9709D778959E906D902) | [0x81A140D74900B2f4D2f3c462cE752638d16938fb](https://mumbai.polygonscan.com/address/0x81A140D74900B2f4D2f3c462cE752638d16938fb) |
| GridZone Mask (GZM)      | [0x11a2C8836012638E0457Ba4dbA352b55A0068894](https://polygonscan.com/address/0x11a2C8836012638E0457Ba4dbA352b55A0068894) |  |
