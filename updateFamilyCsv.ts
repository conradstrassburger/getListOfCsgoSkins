import {createObjectCsvWriter} from "csv-writer";

const fs = require('fs')

const pricempireLink = "https://pricempire.com/item/cs2/skin"

function readFamiliesJson() {
    let skinFamilies: Map<string, SkinFamily>

    try {
        const data = fs.readFileSync('./skinFamilies.json', 'utf8')
        skinFamilies = new Map(JSON.parse(data))
    } catch (error) {
        console.error('Error parsing JSON:', error);
    }

    return skinFamilies
}

function writeFamiliesCsv() {
    const skinFamilies = readFamiliesJson()

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