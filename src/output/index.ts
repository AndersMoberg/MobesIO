import yargs = require("yargs");
import { ProcessingPayload } from "../processing";
import * as fs from 'fs';
import { stringify } from 'csv-stringify';

interface NotionStyle {
    Name: string,
    URL: string,
    Datum: Date,
    Skapare: string
}

function decideFilePath(path) {
    let finalpath = path;
    if (path == "output.csv") {
        finalpath = newPath(path);
    }
    console.log();
    console.log("filepath is " + finalpath)
    return finalpath;
}

function newPath(oldpath) {
    const parsedPath = require('path').parse(oldpath);

    let date = new Date().toISOString();
    date = date.replace(/T/, ' ');
    date = date.replace(/\..+/, '');
    date = date.replace(" ", "_");
    date = date.replace(":", "");
    date = date.replace(":", "");

    return parsedPath.name + "_" + date + parsedPath.ext;
}


function stringifyPromise(json): Promise<any> {
    return new Promise((resolve, reject) => {
        stringify(json, {
            header: true,
            cast: {
                date: function (date: Date) {
                    return date.toISOString()
                }
            }
        }, function (err, output) {
            if (err) { reject(err); }
            resolve(output);
        })
    })
}

async function csvSaveFile(path, object) {
    fs.writeFileSync(decideFilePath(path), await stringifyPromise(object));
    console.log("success!");
}

export async function output(data: ProcessingPayload[], args: yargs.Arguments) {
    let final: NotionStyle[] = [];
    data.forEach(item => {
        final.push({
            Name: item.description,
            URL: item.url && item.url.toString(),
            Datum: item.contentOriginalDate || item.listingDate,
            Skapare: item.source
        })
    })
    await csvSaveFile("output.csv", final);
}

