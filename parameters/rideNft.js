const { ethers } = require("hardhat");
const { BigNumber, utils } = ethers;
const parseEther = utils.parseEther;

module.exports = {
  Models: {
    classes: [
      0, // Legendary
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1, // Classic
      1,
      1,
      1,
      1,
      1,
      2, // Cyberpunk Cars
      2,
      2,
      2,
      2,
      2,
      3, // Cyberpunk Bikes
      3,
      3,
      3,
      3,
      3,
    ],
    names: [
      "Fantom",
      "Futuro",
      "Baron",
      "Avantguard",
      "Memento",
      "Outrun",
      "Nitro",
      "Bandit",
      "Apex",
      "Bavarian",
      "Dash",
      "Commando",
      "Hippie",
      "Minion",
      "Yello",
      "Nosferatu",
      "SubZero",
      "Punisher",
      "Juggernaut",
      "ZZ Top",
      "Zond",
      "Akira",
      "Taurus",
      "Hornet",
      "Brute",
      "Samourai",
      "Wasp",
    ],
    metafileUris: [
      "ipfs://QmcYgRqdmkDSxKj56AEt5ANxRg7FALDavv4jeYPYkN4F37",
      "ipfs://QmVeV8ikCLEYzWG1x6wK9zi3KhDUvY7RJpRo2s6yGWwbNw",
      "ipfs://QmYqKpjcLYnB3iDE8NLdLTL5zybDo3y57arTdawSnAugaB",
      "ipfs://QmSY65jrAhTT75TdnTVpkVRMF11tq3Pjehiim1vGqBqQha",
      "ipfs://QmYGMgPUpFpssbCAoZ5meh72dndZjRres4bAybA7dqBvzT",
      "ipfs://QmNMkrzdAYNVRtE6YF8G55uzj9iXkdRFvW26nsJ5JeKmFt",
      "ipfs://QmQUyLhNCqKQjMiqbaq8bvP6Q4mJ1JZN9HyqF1WJaRTW4N",
      "ipfs://Qmecu8qKxRfWcw9AgDfV48G5RLh6LEQySMPh7rRKhuU4Pa",
      "ipfs://QmWzwN9A5DhDMcerLiPjPS4pocyDLvvcD9gygpnD3PYnho",
      "ipfs://Qmcu6Y82gdhTLeqWrzwv7txsxQ1DiUCkSRxNW3dFrN3ech",
      "ipfs://QmWbWskriZuy8vBCARzmjLqxZvGwWUoQU5boNbm63Q3HED",
      "ipfs://QmQcxSKTRY1CTkgoRest8RBYPHQG7VBWf3XGSJzaervtH5",
      "ipfs://QmXUKXqvmDaJSNvpWrKK6e2RrFbdkbhCLGoaWkNtq76fqj",
      "ipfs://QmbA2tTGHeSRXeMNmYLaiwhxVjtsACj1Ub6wHUy76n6u3K",
      "ipfs://QmaaKc8QqhnraHLYLn1ddmBM3PuUVKu2NxTz3nSfcBhzxC",
      "ipfs://QmNbsTi6hExwGGMepqRJT918xt5x7vNbNYcNuUottPGGPa",
      "ipfs://Qmd4E2r9W9XidrW4HPbADExw92tbawacVxtBUHJqv11Q7m",
      "ipfs://QmY2d44EcYg8HT2hXN1AQQRPomT8PtSi1NkXCHat32dqFA",
      "ipfs://QmPK6sVijvaPmHFvBsKR4Z9VZvTHaNxsF9zdDziTDVv8C6",
      "ipfs://QmP2FfF3nhXQTspTRGg8JTnjpfhFY2TjGjswggJh62TgfS",
      "ipfs://Qmeu4Yrq6d5fcbL7fSFeFyjpteGTG9uLMs13w3GyZSjfC9",
      "ipfs://Qmcdo7o3efixKWCWHzKjAozgGAsjkGWP3cRVa6W1UX8Tqj",
      "ipfs://QmSAhzBGurioJGh984Y7M4X1MWkoW5c3Z1jyeDep6E9Eq9",
      "ipfs://QmWomSGHyVVFbw1HJgjhHXaCCgbTDAszrYm1Eb3NmBvEiU",
      "ipfs://QmfFC2EPP1CvBnjbK3q1oGxgYCBHjMMeu9HZQuweN8xd1N",
      "ipfs://Qmbeb24JnrP6zemVB3j6ERNSYiMQxvQJVscKKVnzTasf4a",
      "ipfs://QmTqNijnf1dJfeQJBkqSZng1dU3RWnXRYD63SwizdFxBoY",
    ],
    capacities: [
      10,
      20,
      20,
      20,
      20,
      15,
      20,
      20,
      20,
      10,
      40,
      40,
      40,
      40,
      40,
      10,
      30,
      40,
      80,
      80,
      80,
      10,
      40,
      80,
      40,
      80,
      80
    ],
    mintPrices: [
      parseEther("1"),
      parseEther("0.1"),
      parseEther("0.1"),
      parseEther("0.1"),
      parseEther("0.1"),
      parseEther("0.5"),
      parseEther("0.1"),
      parseEther("0.1"),
      parseEther("0.1"),
      parseEther("1"),
      parseEther("0.05"),
      parseEther("0.05"),
      parseEther("0.05"),
      parseEther("0.05"),
      parseEther("0.1"),
      parseEther("1"),
      parseEther("0.05"),
      parseEther("0.05"),
      parseEther("0.01"),
      parseEther("0.01"),
      parseEther("0.01"),
      parseEther("1"),
      parseEther("0.05"),
      parseEther("0.01"),
      parseEther("0.05"),
      parseEther("0.01"),
      parseEther("0.01"),
    ],
    defaultColors: [
      ["0x00ff0000"],
      ["0x001446ab"],
      ["0x00e68e34"],
      ["0x00ffffff"],
      ["0x001f4c11"],
      ["0x00ff0000"],
      ["0x00511bc2"],
      ["0x00db3d1d"],
      ["0x00ffffff"],
      ["0x00ff0000"],
      ["0x000315a1"],
      ["0x00f4b164"],
      ["0x00fd00ff"],
      ["0x0051bc29"],
      ["0x00fece26"],
      ["0x00ff0000"],
      ["0x00114abe"],
      ["0x004c2298"],
      ["0x00ff0000"],
      ["0x008e185b"],
      ["0x0023b1b5"],
      ["0x00ff0000"],
      ["0x001bf9a7"],
      ["0x002699fb"],
      ["0x00d929b9"],
      ["0x00ffffff"],
      ["0x00f9a41a"],
    ],
    bonuses: [
      10,
      3,
      3,
      3,
      3,
      5,
      3,
      3,
      3,
      10,
      2,
      2,
      2,
      2,
      3,
      10,
      2,
      1,
      2,
      1,
      1,
      10,
      2,
      1,
      2,
      1,
      1,
    ]
  },
};
