import yargs = require("yargs");
import { ProcessingPayload } from "../../processing";
import { inputCommand } from "../interface";
import { parse } from "csv-parse/sync";
import * as fs from 'fs';

export class notionCsv implements inputCommand {
    constructor() {}

    public produceYargsCommand():any {
        return {
            command:'ncsv [file]',
            describe:'Notion CSV as input\n(Name,Datum,URL)'
        };
    }

    async start(args:yargs.Arguments):Promise<ProcessingPayload[]> {
        if(!args.file) {
            throw new Error("No filepath for CSV!"); 
        }

        let final:ProcessingPayload[] = [];
        let input:string = fs.readFileSync(args.file as string).toString();

        parse(input,{columns: true}).forEach(element => {
            final.push({
                description: element.Name,
                url: element.URL && new URL(element.URL),
                listingDate: new Date(element.Datum),
                originalEntry: element
            })
        });
        
        return final
    }
}