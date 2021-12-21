require("dotenv").config();
const fs = require('fs');

const INPUT_PATH = "./scripts/NYM/nymTraits.csv";
const OUTPUT_PATH = "./scripts/NYM/metafile/";

const TRAITS = [
    'Skin',
    'Eyes',
    'Tatoo',
    'Makeup Face',
    'Makeup Lips',
    'Piercing',
    'Neon Gadget',
    'Cyber Gadget',
    'Background',
    'Hairstyle',
    'Hair Color',
    'Augmentation',
];

function main() {
    return new Promise((resolve, reject) => {
        fs.readFile(INPUT_PATH, async(err, data) => {
            if (err) return reject(err);
            
            const lines = data.toString().split('\n');
            for (let i = 0; i < lines.length; i ++) {
                const line = lines[i].replace('\r', '');
                const values = line.split(',');
                if (TRAITS.length < values.length) {
                    const tokenId = values[0];
                    var content = '{\n'
                    content += `\t"name": "NEONPUNK",\n`
                    content += `\t"description": "Created by GridZone",\n`
                    content += `\t"image": "ipfs://QmRhNZv27zedKVmZh44qS8KoksqtBPmWtfvawhJp8zp7gw/${tokenId}.jpg",\n`
                    content += `\t"attributes": [\n`
                    for (let j = 0; j < TRAITS.length; j ++) {
                        if (0 < j) content += `\t\t,\n`
                        content += `\t\t{\n`
                        content += `\t\t\t"trait_type": "${TRAITS[j]}",\n`
                        content += `\t\t\t"value": "${values[j+1]}"\n`
                        content += `\t\t}\n`
                    }
                    content += `\t]\n`
                    content += `}`

                    try {
                        await createMetafile(`${OUTPUT_PATH}/${values[0]}`, content);
                        console.log(`${tokenId} saved`);
                    } catch(e) {
                        console.log(`${tokenId} failed: ${e}`);
                    }
                }
            }
            resolve();
        })
    })
}

function createMetafile(filepath, content) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filepath, content, function (err) {
            if (err) return reject(err);
            resolve();
        });
    });
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });