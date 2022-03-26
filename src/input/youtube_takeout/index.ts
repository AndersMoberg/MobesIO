import yargs = require("yargs");
import { ProcessingPayload } from "../../processing";
import { inputCommand } from "../interface";
import { parse } from "csv-parse/sync";
import * as fs from 'fs';

export class youtubeTakeout implements inputCommand {
    constructor() {}

    public produceYargsCommand():any {
        return {
            command:'yt [file]',
            describe:'Youtube Takeout CSV as input'
        };
    }

    async start(args:yargs.Arguments):Promise<ProcessingPayload[]> {
        if(!args.file) {
            throw new Error("No filepath for CSV!"); 
        }

        let final:ProcessingPayload[] = [];
        let input:string = fs.readFileSync(args.file as string).toString();
        input = input.substr(input.search("Video Id"));

        parse(input,{columns: true,skip_empty_lines: true}).forEach(element => {
            final.push({
                description: element["Video Id"],
                url: new URL("https://www.youtube.com/watch?v=" + element["Video Id"]),
                listingDate: new Date(element["Time Added"]),
                originalEntry: element
            })
        });
        
        return final
    }
}