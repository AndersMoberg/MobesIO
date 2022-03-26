import * as yargs from 'yargs';
import { ProcessingPayload, process_TodoistItems } from './processing';
import { todoistApi } from './input/todoist_api'
import { inputCommand } from './input/interface';
import { Table } from "console-table-printer";
import conf from 'conf';
import { output } from './output';
import { removeTickets } from './helper/todoist';
import { notionCsv } from './input/notion_csv';
import { youtubeTakeout } from './input/youtube_takeout';
import yt from './output/ytd';

export class App {
    private config: conf = new conf();
    private commands: any = {
        todoist: new todoistApi(),
        notion: new notionCsv(),
        youtube: new youtubeTakeout()
    };

    constructor() { }

    generateCommands(): yargs.CommandModule[] {
        let finalCommands: yargs.CommandModule[] = []
        for (const command in this.commands) {
            finalCommands.push(
                {
                    ...this.commands[command].produceYargsCommand(),
                    handler: async (args: yargs.Arguments) => {
                        this.start(await this.commands[command].start(args), args);
                    }
                })
        }
        return finalCommands
    }

    readTodoistApiKeyFromFile(): string | undefined {
        return this.config.has('todoistapi') ? this.config.get('todoistapi') as string : undefined;
    }

    saveTodoistApiKeyToFile(key: string) {
        this.config.set('todoistapi', key);
    }

    async setup(): Promise<void> {
        await yargs.scriptName("io")
            .usage('$0 <cmd> [args]\n(always "dryrun" unless output action specified)')
            .command(this.generateCommands())
            .option('apikey', {
                default: this.readTodoistApiKeyFromFile(),
                describe: 'API key',
                type: 'string'
            })
            .option('cachekey', {
                describe: 'API key will be cached for future use',
                type: 'boolean'
            })
            .option('delete', {
                describe: 'Deletes tasks from Todoist after output action',
                type: 'boolean'
            })
            .option('notion', {
                describe: 'With data from input, save to Notion style CSV file',
                type: 'boolean'
            })
            .option('videodl', {
                describe: 'With data from input, run Youtube Downloader on all URLs. Results saved to generated Markdown file',
                type: 'boolean'
            })
            .option('output', {
                alias: 'o',
                describe: 'Path to output file, otherwise default based on timestamp',
                type: 'string'
            })
            .group(['apikey', 'cachekey', 'delete'], "Todoist")
            .group(['notion', 'videodl'], "Output format")
            .group(['output'], "Output filesystem")
            .demandCommand()
            .help(false)
            .version(false)
            .argv;
    }



    async start(payload: ProcessingPayload[], args: yargs.Arguments): Promise<void> {
        if (args.cachekey && args.apikey) {
            this.saveTodoistApiKeyToFile(args.apikey as string);
        }

        let doneAnything:boolean = false;
        if (args.notion) {
            const processingPayload: ProcessingPayload[] = await process_TodoistItems(payload, args);
            await output(processingPayload, args);
            if (args.delete) {
                const todoist: todoistApi = this.commands.todoist;
                await removeTickets(todoist.TD, processingPayload, args);
            }
            doneAnything = true;
        } 
        if (args.videodl) {
            const processingPayload: ProcessingPayload[] = await process_TodoistItems(payload, args);
            yt(processingPayload, args);
            doneAnything = true;
        } 
        
        if (!doneAnything) {
            this.printPayload(payload);
        }
    }

    printPayload(payload: ProcessingPayload[]): void {
        console.log("No output action defined. Dry run default")
        let table = new Table({
            disabledColumns: ["originalEntry", "url"]
        });
        table.addRows(payload.filter(
            item => {
                (item as any).listingDate = item.listingDate.toISOString();
                (item as any).urlpath = item.url && item.url.toString() || undefined;
                return true;
            }
        ))
        table.printTable();
    }
}