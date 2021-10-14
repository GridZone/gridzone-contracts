require("dotenv").config();
const { ethers } = require("hardhat");
const whiteList = require("./airdropWhitelist.js");

async function main() {
    const signerWallet = new ethers.Wallet.fromMnemonic(process.env.SIGNER_SEED);
    
    console.log(`Signer address: ${signerWallet.address}`);
    console.log('');

    const totalCount = whiteList.length;
    for (var i = 0; i < totalCount; i ++) {
        const id = whiteList[i][0];
        const address = whiteList[i][1];
        const contractAddress = whiteList[i][2];
        const modelId = whiteList[i][3];
        const quantity = whiteList[i][4];
        const nonce = whiteList[i][5];

        const message = ethers.utils.solidityKeccak256(
            ["address", "uint256", "address", "uint256", "uint256"],
            [contractAddress, modelId, address, quantity, nonce]
        );
        const signature = await signerWallet.signMessage(ethers.utils.arrayify(message));
        console.log(`db.nfttransactions.updateMany({_id: ObjectId('${id}')}, {$set: {nonce: ${nonce}, signature:'${signature}'}});`);
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });