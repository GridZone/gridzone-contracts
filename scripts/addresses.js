const { deployments } = require("hardhat");

async function main() {
  const gridZoneStakingBot = await deployments.get("GridZoneStakingBot");
  const nymLib = await deployments.get("NymLib");
  const nym = await deployments.get("NYM");

  console.log("GridZoneStakingBot address: ", gridZoneStakingBot.address);
  console.log("");
  console.log("NymLib address: ", nymLib.address);
  console.log("NYM address: ", nym.address);
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
