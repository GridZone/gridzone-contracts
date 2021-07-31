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

### Staking

```text
npx hardhat deploy --network mainnet --tags mainnet_GridZoneStakingBot_deploy
npx hardhat deploy --network mainnet --tags mainnet_GridZoneStakingBot_verify
```

### NYM

```text
npx hardhat deploy --network mainnet --tags mainnet_NYM_deploy
npx hardhat deploy --network mainnet --tags mainnet_NYM_verify
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

### BiconomyMetaTxRelay

```text
npx hardhat deploy --network polygonMainnet --tags polygonMainnet_BiconomyMetaTxRelayUpgradeable_deploy
npx hardhat deploy --network polygonMainnet --tags polygonMainnet_BiconomyMetaTxRelayUpgradeable_verify
```

### Ride NFT

```text
npx hardhat deploy --network polygonMainnet --tags polygonMainnet_RideNft_deploy
npx hardhat deploy --network polygonMainnet --tags polygonMainnet_RideNft_verify
```

### NymFashion NFT

```text
npx hardhat deploy --network polygonMainnet --tags polygonMainnet_NymFashionNft_deploy
npx hardhat deploy --network polygonMainnet --tags polygonMainnet_NymFashionNft_verify
```

#### Grant RideNftFactory and NymFashionFactory the FACTORIES role on the BiconomyMetaTxRelay

* execute grantRole of BiconomyMetaTxRelay contract. The parameters are the value of BiconomyMetaTxRelay.FACTORIES and the address of factory contracts.

## Print out deployed contracts

```text
npx hardhat run --network mainnet scripts/addresses.js
```