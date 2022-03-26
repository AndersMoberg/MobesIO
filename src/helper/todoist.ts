import yargs = require("yargs");
import { ProcessingPayload } from "../processing";
import * as cliProgress from "cli-progress";

const delayMs:number = 750;

export async function removeTickets(todoist:any, payload:ProcessingPayload[], args:yargs.Arguments) {
    function delay(ms):Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    console.log("Deleting " + payload.length + " tickets");
    console.log(delayMs + "ms cooldown between each ticket deletion");

    const bar1 = new cliProgress.SingleBar({clearOnComplete: true}, cliProgress.Presets.shades_classic);
    bar1.start(payload.length, 0);

    for await (const iterator of payload) {
        await delay(delayMs).then(todoist.items.complete(iterator.originalEntry))
        bar1.increment();
    }

    bar1.stop();
}