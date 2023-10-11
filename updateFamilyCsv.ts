import {createObjectCsvWriter} from "csv-writer";
const fs = require('fs')

function readFamilies() {
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
    const skinFamilies = readFamilies()

    // Create a CSV writer
    const csvWriter = createObjectCsvWriter({
        path: 'skinFamilies.csv', // Specify the CSV file path
        header: [
            {id: 'skinFamilyName', title: 'Skin Family Name'},
            {id: 'count', title: 'Count'},
            {id: 'link', title: 'Link'},
            {id: 'members', title: 'Members'},
        ],
    });

    // Prepare data for CSV writing
    const csvData = [];
    skinFamilies.forEach((skinFamily, skinFamilyName) => {
        csvData.push({
            skinFamilyName,
            count: skinFamily.count,
            link: skinFamily.link.toString(),
            members: skinFamily.members.map(m => m[0]).join(", "),
        });
    });

    // Write the data to the CSV file
    csvWriter.writeRecords(csvData)
        .then(() => console.log('CSV file created successfully.'))
        .catch((error) => console.error('Error writing CSV file:', error))
}

writeFamiliesCsv()