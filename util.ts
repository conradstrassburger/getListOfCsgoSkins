const fs = require('fs')


export interface Item {
    quality: string
    skin: string
    weapon: string
    collection: string
    link?: URL
}

export interface SkinFamily {
    count: number
    link: URL
    members: [string, URL][]
}

export function readJsonToMap<T>(path: string) {
    let result: Map<string, T>

    try {
        const data = fs.readFileSync(path, 'utf8')
        result = new Map(JSON.parse(data))
    } catch (error) {
        console.error('Error parsing JSON:', error);
    }

    return result
}

export function readJson<T>(path: string) {
    let result: T

    try {
        const data = fs.readFileSync(path, 'utf8')
        result = JSON.parse(data)
    } catch (error) {
        console.error('Error parsing JSON:', error);
    }

    return result
}


export function writeJson(object: any, filePath: string) {
    // Convert the array to a JSON string
    const jsonString = JSON.stringify(object, null, 2); // The second argument is for pretty formatting

    // Write the JSON string to the file
    fs.writeFile(filePath, jsonString, (err) => {
        if (err) {
            console.error('Error writing to file:', err);
        } else {
            console.log('Data written to file successfully.');
        }
    });
}