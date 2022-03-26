import * as yargs from 'yargs';
import * as ytdl from "ytdl-core";
import * as fs from 'fs';
import { ProcessingPayload } from "../../processing";
import * as childProcess from 'child_process'
import { isConstructorDeclaration } from 'typescript';
import * as cliProgress from "cli-progress";
import { exit } from 'yargs';
import js2MDTable from '../../helper/markdown';
//import { markdownTable } from 'markdown-table';

// function turnObjectIntoStringArray(objectArray:any[]):string[][] {
//     let headersObj:any = {}
//     let headers:string[] = [];
//     let entries:string[][] = [];

//     for (let index = 0; index < objectArray.length; index++) {
//         const object = objectArray[index];
//         for (const key in object) {
//             if (Object.prototype.hasOwnProperty.call(object, key)) {
//                 headersObj[key] = null;
//             }
//         }
//     }

//     for (const key in headersObj) {
//         headers.push(key);
//     }

//     for (let index = 0; index < objectArray.length; index++) {
//         const object = objectArray[index];
//         let stringArray:string[] = [];

//         for (let index = 0; index < headers.length; index++) {
//             const header = headers[index];
//             if (Object.prototype.hasOwnProperty.call(object, header)) {
//                 stringArray.push(object[header].toString());
//             } else {
//                 stringArray.push("");
//             }
//         }

//         entries.push(stringArray);
//     }

//     return [].concat(headers).concat(entries);
// }

function newPath(oldpath) {
    let date = new Date().toISOString();
    date = date.replace(/T/, ' ');
    date = date.replace(/\..+/, '');
    date = date.replace(" ", "_");
    date = date.replace(":", "");
    date = date.replace(":", "");

    return date + ".md";
}


function decideFilePath(path) {
    let finalpath = path;
    if (typeof path != "string") {
        finalpath = newPath("");
    }
    console.log();
    console.log("filepath is " + finalpath)
    return finalpath;
}

export interface ytInfo {
    Segment:string,
    Sec:number
}

function stripCommasAndWhitespace(params:string): string {
    params = params.trim();
    params = params.replace(",,","");
    if(params.search(/^\,/) != -1) {
        params = params.substring(1);
    }
    let result = params.search(/\n,/);
    if(result != -1) {
        params = params.substring(0,result);
    }
    params = params.trim();
    return params;
}

function download(payload:ProcessingPayload): ytInfo {
    const session = childProcess.spawnSync("yt-dlp",[
        "-f",
        "mp4",
        "--restrict-filenames",
        payload.url.toString()
    ]);
    if( session.status != 0) {
        throw new Error(payload.url + " | " + stripCommasAndWhitespace(session.output.toString()));
    }

    const sessionToGetFilepath = childProcess.spawnSync("yt-dlp",[
        "-s",
        "--get-filename",
        "--restrict-filenames",
        payload.url.toString()
    ]);

    const sessionToGetLength = childProcess.spawnSync("yt-dlp",[
        "-s",
        "--get-duration",
        payload.url.toString()
    ]);

    let length:string = stripCommasAndWhitespace(sessionToGetLength.output.toString());
    let lengthProper:string = length.match(/[0-9]*/g).filter((value:string) => value.search(/[0-9]/) != -1)[0]
    let lengthNumber:number = parseInt(lengthProper);

    let final:ytInfo = {
        Segment: stripCommasAndWhitespace(sessionToGetFilepath.output.toString()),
        Sec: lengthNumber
    }

    return final;
}

export default function yt(payload:ProcessingPayload[], args:yargs.Arguments) {
    const style = {...cliProgress.Presets.shades_classic}
    const bar1 = new cliProgress.SingleBar({clearOnComplete: true}, style);
    bar1.start(payload.length, 0);

    let finalPayload:ytInfo[] = [];
    const errorArray:string[] = [];

    payload.forEach((payload, index) => {
        bar1.update(index);
        try {
            if(payload.url) {
                const info:ytInfo = download(payload);
                finalPayload.push({...info});
            }
        } catch(e) {
            errorArray.push(e.message);
        }
    });
    bar1.stop();

    console.log("Downloaded " + finalPayload.length + " links successfully");
    console.log();
    console.log("Printing failures");
    console.log("Was unable to download " + errorArray.length + " links");
    console.log();

    errorArray.forEach(error => console.log(error));

    console.log();
    const mdTable:string = js2MDTable(finalPayload);
    fs.writeFileSync(decideFilePath(args.output), mdTable);
}