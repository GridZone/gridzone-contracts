module.exports = {
  mainnet: {
    Global: {
      ownerAddress: "0xab0B18523e8fe8CBF947C55632e8aB5Ce936ae8c",
    },
    ZONE: {
      tokenAddress: "0xC1D9B5A0776d7C8B98b8A838e5a0DD1Bc5Fdd53C",
      vaultAddress: "0x7205731e9643235Aa313D46552c7aa81E559fB6F",
    },
    GenesisSaleRewardAirdrop: {
      adminAddress: "0x401903c872A0569cdFe21f9BcDfa0f6D0a3D4D00",  // TODO: Update with correct address
    },
  },
  ropsten: {
    Global: {
      ownerAddress: "0xb88B8041E91adB1F084d1bB20B425c3D640B97E9",
    },
    ZONE: {
      tokenAddress: "0x68793924974cC3D1c32A26e7648A84f7f93e3A45",
      vaultAddress: "0x6CdeD499E788eC7be89E4A4aC183065B1f38Cb16",
    },
    GenesisSaleRewardAirdrop: {
      adminAddress: "0x401903c872A0569cdFe21f9BcDfa0f6D0a3D4D00",
    },
  },

  polygonMainnet: {
    Global: {
      ownerAddress: "0xF55b56C7a98412fB96e9b191974Ab8fc49547064",  // TODO: Update after ZONE token deployed on Polygon Mainnet
      adminAddress: "0xeFd9928Aa5A192C0267CdAed43235006B7A28628",  // TODO: Update with correct address. It's used for airdrop
      slpZoneEth: "0xcBF6f78981e63Ef813cb71852d72A060b583EECF",  // TODO: Update after ZONE token deployed on Polygon Mainnet
    },
    ZONE: {
      tokenAddress: "0x3a3Df212b7AA91Aa0402B9035b098891d276572B",  // TODO: Update after ZONE token deployed on Polygon Mainnet
    },
    BiconomyMetaTxRelay: {
      gasPriceInZone: 1000000000,
      biconomyForwarder: "0x86C80a8aa58e0A4fa09A69624c31Ab2a6CAD56b8",
    },
  },
  polygonMumbai: {
    Global: {
      ownerAddress: "0xb88B8041E91adB1F084d1bB20B425c3D640B97E9",
      adminAddress: "0xeFd9928Aa5A192C0267CdAed43235006B7A28628",  // TODO: Update with correct address. It's used for airdrop
      slpZoneEth: "0x5B45C620B4316B9316542C65B0680d4E621E9CCF",
      sushiRouter: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",  // This is only needed to add SLP on the Mumbai, because Sushi doesn't support well Mumbai
      WETH: "0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa",  // This is only needed to add SLP on the Mumbai, because Sushi doesn't support well Mumbai
    },
    ZONE: {
      tokenAddress: "0x5248c77c11699082A92b9B6617F884bAF63787de",
    },
    BiconomyMetaTxRelay: {
      gasPriceInZone: 1000000000,
      biconomyForwarder: "0x9399BB24DBB5C4b782C70c2969F58716Ebbd6a3b",
    },
  },
};
