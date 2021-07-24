const { ethers } = require("hardhat");
const { polygonMumbai: network_ } = require("../parameters");
const { UInt256Max } = require("../test/utils/Ethereum");

const ERC20_ABI = require("../node_modules/@openzeppelin/contracts/build/contracts/ERC20.json").abi;

async function main() {
    const [deployer] = await ethers.getSigners();

    const zoneToken = new ethers.Contract(network_.ZONE.tokenAddress, ERC20_ABI, deployer);
    const wethToken = new ethers.Contract(network_.Global.WETH, ERC20_ABI, deployer);

    console.log(`Approving Sushi LP token on ZONE token ...`);
    try {
        const gas = await zoneToken.estimateGas.approve(network_.Global.sushiRouter, UInt256Max());
        console.log(`The estimated gas: ${gas.toString()}`);
        const tx = await zoneToken.approve(network_.Global.sushiRouter, UInt256Max());
        console.log(`The txid: ${tx.hash}`)
        const receipt = await tx.wait();
        if (!receipt || !receipt.blockNumber) {
            console.error(`The transaction failed`);
            return;
        }
    } catch(e) {
        console.error(e);
        return;
    }

    console.log(`Approving Sushi LP token on WETH token ...`);
    try {
        const gas = await wethToken.estimateGas.approve(network_.Global.sushiRouter, UInt256Max());
        console.log(`The estimated gas: ${gas.toString()}`);
        const tx = await wethToken.approve(network_.Global.sushiRouter, UInt256Max());
        console.log(`The txid: ${tx.hash}`)
        const receipt = await tx.wait();
        if (!receipt || !receipt.blockNumber) {
            console.error(`The transaction failed`);
            return;
        }
    } catch(e) {
        console.error(e);
        return;
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });