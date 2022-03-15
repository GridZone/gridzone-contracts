const { ethers } = require("hardhat");
const { BigNumber, utils } = ethers;
const parseEther = utils.parseEther;

// const GAS_PRICE_GWEI = 80;

module.exports = {
  gasPrice: (typeof GAS_PRICE_GWEI !== 'undefined') ? BigNumber.from(10).pow(9).mul(GAS_PRICE_GWEI) : undefined,

  mainnet: {
    Global: {
      ownerAddress: "0xab0B18523e8fe8CBF947C55632e8aB5Ce936ae8c",
      proxyAdmin: "0x341B280dE890a46E96961f04d438214c76F1E2d6",
    },
    ZONE: {
      tokenAddress: "0xC1D9B5A0776d7C8B98b8A838e5a0DD1Bc5Fdd53C",
      governorTimelock: "0xBa168554Bc2F231516b6Cf3808A1DD8a3A351C01",
      vaultAddress: "0x7205731e9643235Aa313D46552c7aa81E559fB6F",
    },
    NymLib: {
      contractAddress: "0x5e4233192C27A26ac10f84F4e748f56a8187a230",
    },
    PriceOracle: {
      contractAddress: "0x5B2B0d0f50b03451633604E7524f2d4adc61CC09",
      lpZoneEth: "0x95332661B2e36a02dC05E6fb7c31193f0690C90F", // Uniswap V2 ZONE/ETH
      usePoolPrice: true,
      zoneReserveInLP: 3888,
      ethReserveInLP: 1,
    },
    LPStaking: {
      zonePerMinute: parseEther('4.2035'),
      minDepositAmountInEth: parseEther('0.1'),
    },
    ZoneStaking: {
      enables: [false, true, true, true],
      lockDays: [30, 60, 90, 180],
      rewardRates: [0, 500, 800, 2000], // 0%, 5%, 8%, 20%
    },
    NYM: {
      baseURI: "ipfs://QmXQtSG5VoWfi9dM5fcpJ4dqGG4ECoiDRDTS7pr5nHJsJE/",
    },
    Airdrop: {
      adminAddress: "0xab0B18523e8fe8CBF947C55632e8aB5Ce936ae8c",  // TODO: Update with correct address
    },
  },

  goerli: {
    Global: {
      ownerAddress: "0x401903c872A0569cdFe21f9BcDfa0f6D0a3D4D00", // "0xb88B8041E91adB1F084d1bB20B425c3D640B97E9",
      proxyAdmin: "0x7bC3487097F6495D3d0d2944Df80B161612293a9",
    },
    ZONE: {
      tokenAddress: "0x862E80fFDDB68230CFc9850e767260A9595C93Eb",
      governorTimelock: "0x464141184F1E36D984888534C32817CBaE74955B",
      vaultAddress: "0x6CdeD499E788eC7be89E4A4aC183065B1f38Cb16",
    },
    NymLib: {
      contractAddress: "0x06454E306DBCB79C7C139d5e8977ac455f812f52",
    },
    PriceOracle: {
      contractAddress: "0xDcF7C8664c2191589C5170bF73c6faC5c7cC7bd6",
      lpZoneEth: "0xbeBA86D9718276c545cA45A25BF10A370DBA3A86", // Uniswap V2 ZONE/ETH
      usePoolPrice: true,
      zoneReserveInLP: 3888,
      ethReserveInLP: 1,
    },
    LPStaking: {
      zonePerMinute: parseEther('4.2035'),
      minDepositAmountInEth: parseEther('0.1'),
    },
    ZoneStaking: {
      enables: [false, true, true, true],
      lockDays: [30, 60, 90, 180],
      rewardRates: [0, 500, 800, 2000], // 0%, 5%, 8%, 20%
    },
    NYM: {
      baseURI: "ipfs://QmXQtSG5VoWfi9dM5fcpJ4dqGG4ECoiDRDTS7pr5nHJsJE/",
    },
    Airdrop: {
      adminAddress: "0x401903c872A0569cdFe21f9BcDfa0f6D0a3D4D00",
    },
  },

  rinkeby: {
    Global: {
      ownerAddress: "0x401903c872A0569cdFe21f9BcDfa0f6D0a3D4D00", // "0xb88B8041E91adB1F084d1bB20B425c3D640B97E9",
      proxyAdmin: "0x09647ac37619cdc3fD384cAf3428615b650108ca",
    },
    ZONE: {
      tokenAddress: "0x862E80fFDDB68230CFc9850e767260A9595C93Eb",
      vaultAddress: "0x6CdeD499E788eC7be89E4A4aC183065B1f38Cb16",
    },
    NymLib: {
      contractAddress: "0x053477e68bDaBbCcEDcDB316F64a029089b85221",
    },
    PriceOracle: {
      contractAddress: "0xc1389875f0125F691886D911d48F390dC4E1bFcD",
      lpZoneEth: "0x0000000000000000000000000000000000000000", // Uniswap V2 ZONE/ETH
      usePoolPrice: false,
      zoneReserveInLP: 3888,
      ethReserveInLP: 1,
    },
  },

  polygonMainnet: {
    Global: {
      ownerAddress: "0xab0B18523e8fe8CBF947C55632e8aB5Ce936ae8c",
      // ownerAddress: "0x4879712c5d1a98c0b88fb700daff5c65d12fd729",  // TODO: Update after ZONE token deployed on Polygon Mainnet
      proxyAdmin: "0x0C762a36b46FcCAF1351b4122Eb2CEAF062f6d8B",
    },
    ZONE: {
      tokenAddress: "0x5Ab64dAAAa458d8f2019C0a3F2275FDc27e498D1",
      vaultAddress: "",
      // tokenAddress: "0x3a3Df212b7AA91Aa0402B9035b098891d276572B",  // TODO: Remove after lpZoneEth updated with correct address
      // vaultAddress: "0xB34eD85bc0B9DA2fA3C5e5d2f4B24f8EE96CE4E9", // TODO: Update after ZONE token deployed on Polygon Mainnet
    },
    NymLib: {
      contractAddress: "0xEcDE46B0FeD555f7f9E4B685B6722440EEd2D445",
    },
    PriceOracle: {
      contractAddress: "0x2B8B8897896ff5c444D247c36022E97315e13e8B", // TODO: It should be redeployed for new NFTs
      lpZoneEth: "0x0000000000000000000000000000000000000000",  // TODO: Update after SLP created on SushiSwap
      // lpZoneEth: "0xcBF6f78981e63Ef813cb71852d72A060b583EECF",  // TODO: Remove after lpZoneEth updated with correct address
      usePoolPrice: false,
      zoneReserveInLP: 3888,
      ethReserveInLP: 1,
    },
    BiconomyMetaTxRelay: {
      gasPriceInZone: 1000000000,
      biconomyForwarder: "0x86C80a8aa58e0A4fa09A69624c31Ab2a6CAD56b8",
    },
  },

  polygonMumbai: {
    Global: {
      ownerAddress: "0x401903c872A0569cdFe21f9BcDfa0f6D0a3D4D00", // "0xb88B8041E91adB1F084d1bB20B425c3D640B97E9",
      proxyAdmin: "0xd35bd944019a32B54C185eF0B863096e89afAdcA",
      sushiRouter: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",  // This is only needed to add SLP on the Mumbai, because Sushi doesn't support well Mumbai
      WETH: "0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa",  // This is only needed to add SLP on the Mumbai, because Sushi doesn't support well Mumbai
    },
    ZONE: {
      tokenAddress: "0x5248c77c11699082A92b9B6617F884bAF63787de",
      vaultAddress: "0xb88B8041E91adB1F084d1bB20B425c3D640B97E9",
    },
    NymLib: {
      contractAddress: "0xe4C974bdc8CdFcb7e5e503E833BDf76FB9404B2b",
    },
    PriceOracle: {
      contractAddress: "0x684F0baaF8910Bfc098AE8D02A3959F50B44aE27",
      lpZoneEth: "0x5B45C620B4316B9316542C65B0680d4E621E9CCF",
      usePoolPrice: false,
      zoneReserveInLP: 2000,
      ethReserveInLP: 1,
    },
    BiconomyMetaTxRelay: {
      gasPriceInZone: 1000000000,
      biconomyForwarder: "0x9399BB24DBB5C4b782C70c2969F58716Ebbd6a3b",
    },
  },
};
