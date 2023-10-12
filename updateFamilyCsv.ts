import {Item, readJson, readJsonToMap, SkinFamily} from "./util";

const {createObjectCsvWriter} = require('csv-writer');

const pricempireLink = "https://pricempire.com/item/cs2/skin"

function writeFamiliesCsv() {
    let skinFamilies = readJsonToMap<SkinFamily>('./skinFamilies.json')

    const gloves = readJson<Item[]>("./gloves.json")

    // create glove families in case there are multiple gloves with the same skin
    const gloveFamilies = new Map<string, SkinFamily>()
    gloves.forEach(glove => {
        const existingFamily = gloveFamilies.get(glove.skin)
        if (existingFamily) {
            existingFamily.count++
            existingFamily.members.push([glove.weapon, glove.link])
        } else {
            const skinFamily: SkinFamily = {
                link: glove.link,
                members: [[glove.weapon, glove.link]],
                count: 1,
            }
            gloveFamilies.set(glove.skin, skinFamily)
        }
    })

    gloveFamilies.forEach((gloveFamily, gloveFamilyName) => {
        const existingFamily = skinFamilies.get(gloveFamilyName)
        if (existingFamily) {
            existingFamily.count++
            existingFamily.members.push(...gloveFamily.members)
        } else {
            skinFamilies.set(gloveFamilyName, gloveFamily)
        }
    })

    // Create a CSV writer
    const csvWriter = createObjectCsvWriter({
        path: 'skinFamilies.csv', // Specify the CSV file path
        header: [
            {id: 'skinFamilyName', title: 'Skin Family Name'},
            {id: 'count', title: 'Count'},
            {id: 'link', title: 'Link'},
            {id: 'prices', title: 'Pricempire Link(s)'},
        ],
    });

    // Prepare data
    const csvData = [];
    skinFamilies.forEach((skinFamily, skinFamilyName) => {
        csvData.push({
            skinFamilyName,
            count: skinFamily.count,
            link: skinFamily.link.toString(),
            prices: skinFamily.members.map(m => convertLinkToHyperlinkFunction(createPricempireLink(m[1]), m[0])).join(", "),
        });
    });

    // Write the data to the CSV file
    csvWriter.writeRecords(csvData)
        .then(() => console.log('CSV file created successfully.'))
        .catch((error) => console.error('Error writing CSV file:', error))
}

function createPricempireLink(cs2StashLink: URL) {
    // pricempire clean special characters from their urls
    let nameFragment = cs2StashLink.toString().substring(cs2StashLink.toString().lastIndexOf("/"))
        .toLowerCase()
        // clean %-encoded special characters
        .replace(/-(?:%.{2})+/g, "")
        // clean actual special characters
        .replace(/[^a-zA-Z0-9 \-\/]/g, "")

    return pricempireLink.concat(nameFragment)
}

function convertLinkToHyperlinkFunction(link: string, label?: string) {
    return `=HYPERLINK("${link}"${label ? "; \"" + label + "\"" : ""})`
}

writeFamiliesCsv()