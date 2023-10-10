const parser = require("node-html-parser");
const fs = require('fs')
const https = require("https")
const { createObjectCsvWriter } = require('csv-writer');

getSite();

interface Item {
    quality: string
    skin: string
    weapon: string
    collection: string
}

interface SkinFamily {
    count: number
    link: URL
    members: Map<string, URL>
}

async function getSite() {
    console.log("fetching counterstrike.fandom.com for skin list");

    let options = {
        hostname: "counterstrike.fandom.com",
        path: "/wiki/Skins/List",
        method: "GET",
        headers: {}
    }

    let response = "";
    let items: Item[] = [];
    let skinFamilyNames: Set<string> = new Set<string>()

    let req = https.request(options, (res) => {
        res.on('data', d => {
            response += d.toString();
        });

        res.on('end', async () => {
            let root = parser.parse(response);
            console.log(root);
            let collectionNames: string[] = [];
            root.querySelectorAll("h4").forEach(el => {
                // console.log(el.childNodes[-1].childNodes[0]);
                collectionNames.push(el.querySelector('a').childNodes[0].rawText);
            });

            let k = 0;

            root.querySelectorAll(".wikitable").forEach(table => {

                table.querySelectorAll('tr').forEach((row, idx) => {
                    if (idx == 0) {
                        return;
                    }

                    let skin: Item = {collection: "", quality: "", skin: "", weapon: ""}

                    skin.collection = collectionNames[k];
                    skin.weapon = row.querySelector('a').childNodes[0].rawText;
                    skin.skin = row.querySelectorAll('span')[0].childNodes[0].rawText.replaceAll("*", "").trim();
                    skin.quality = row.querySelectorAll('span')[1].childNodes[0].rawText;

                    items.push(skin);

                });

                k++;

            })
            console.log(items);

            // only return unique
            skinFamilyNames = new Set(items.map(i => i.skin))

            // Convert the array to a JSON string
            const jsonString = JSON.stringify(items, null, 2); // The second argument is for pretty formatting

            // Specify the file path and name
            const filePath = './csSkins.json';

            // Write the JSON string to the file
            fs.writeFile(filePath, jsonString, (err) => {
                if (err) {
                    console.error('Error writing to file:', err);
                } else {
                    console.log('Data written to file successfully.');
                }
            });

            console.log("fetching csgostash.com for skin families");

            let skinFamilies: Map<string, SkinFamily> = new Map<string, SkinFamily>()
            let i = 0
            for (const skinFamilyName of skinFamilyNames) {
                const url = new URL('https://csgostash.com/family/');
                url.pathname = url.pathname.concat(skinFamilyName.replaceAll(" ", "+"))

                const skinFamily = await fetchSkinFamilyFromCS2Stash(url)
                skinFamilies.set(skinFamilyName, skinFamily)

                i++
                console.log(`${Math.round(i / skinFamilyNames.size * 100)}% done`)
            }

            // Create a CSV writer
            const csvWriter = createObjectCsvWriter({
                path: 'skinFamilies.csv', // Specify the CSV file path
                header: [
                    { id: 'skinFamilyName', title: 'Skin Family Name' },
                    { id: 'count', title: 'Count' },
                    { id: 'link', title: 'Link' },
                    { id: 'members', title: 'Members' },
                ],
            });

            // Prepare data for CSV writing
            const csvData = [];
            skinFamilies.forEach((skinFamily, skinFamilyName) => {
                csvData.push({
                    skinFamilyName,
                    count: skinFamily.count,
                    link: skinFamily.link.toString(),
                    members: Array.from(skinFamily.members.keys()).join(', '),
                });
            });

            // Write the data to the CSV file
            csvWriter.writeRecords(csvData)
                .then(() => console.log('CSV file created successfully.'))
                .catch((error) => console.error('Error writing CSV file:', error))
        })
    });

    req.end();
}

async function fetchSkinFamilyFromCS2Stash(skinFamilyUrl: URL) {
    const members = new Map<string, URL>();
    let skinFamily: SkinFamily

    try {
        const response = await fetch(skinFamilyUrl);
        const html = await response.text();
        const root = parser.parse(html);

        // Select all result boxes except ad boxes
        const boxes = root.querySelectorAll('.result-box:not(:has(.abbu-body-resultbox))');

        // Iterate through the elements and save data to the Map
        boxes.forEach((element) => {
            const key = element.querySelector('h3 > a').rawText.trim();
            const href = new URL(element.querySelector('a:has(> img)').getAttribute('href'));

            if (key && href) {
                members.set(key, href);
            }
        });

        skinFamily = {
            count: boxes.length,
            link: skinFamilyUrl,
            members: members
        }

    } catch (error) {
        console.error('Error: ', error);
    }

    return skinFamily
}
