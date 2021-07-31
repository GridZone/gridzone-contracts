require("dotenv").config();
const { ethers } = require("hardhat");
const whiteList = require("./airdropWhitelist.js");

async function main() {
    const signerWallet = new ethers.Wallet.fromMnemonic(process.env.SIGNER_SEED);
    const verifierContract = process.env.VERIFIER_CONTRACT;
    
    console.log(`Signer address: ${signerWallet.address}`);
    console.log(`Verifier contract address: ${verifierContract}`);
    console.log('');

    const totalCount = whiteList.length;
    for (var i = 0; i < totalCount; i ++) {
        const user = whiteList[i][0];

        const message = ethers.utils.solidityKeccak256(
            ["address", "address"],
            [verifierContract, user]
        );
        const signature = await signerWallet.signMessage(ethers.utils.arrayify(message));
        console.log(`${user}: ${signature}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });