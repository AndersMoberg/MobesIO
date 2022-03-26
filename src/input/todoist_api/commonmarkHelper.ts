import { ProcessingPayload } from "../../processing";
import * as commonmark from 'commonmark'

function getContent(cm:commonmark.Node):string {
    return cm.type === "link" ? cm.destination : cm.literal;
}

function walkAndFindContentUrl(cm:commonmark.Node):any {
    let walker = cm.walker();
    let event, node;
    let found = {};

    while ((event = walker.next())) {
        node = event.node;

        if (event.entering) {
            const content = getContent(node);
            if(!content) {
                continue;
            }
            if(!found[node.type] || found[node.type] != content) {
                found[node.type] ? found[node.type] += content : found[node.type] = content;
            }
        }
    }

    return found;
}

function isURL(name:string):boolean {
    const regxp = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
    return name.search(regxp) !== -1;
}

export async function processTodoistItems(rawData:any[]):Promise<ProcessingPayload[]> {
    let final:ProcessingPayload[] = [];
    let cm:commonmark.Parser = new commonmark.Parser;
    rawData.forEach(async (item) => {
        const url = cm.parse(item.content);
        const result = walkAndFindContentUrl(url);
        if(isURL(result.text as string) && !result.link) {
            result.link = result.text;
            result.text = undefined;
        }
        
        final.push({
            description: result.text,
            url: result.link ? new URL(result.link as string) : undefined,
            listingDate: new Date(item.date_added),
            originalEntry: item
        });
    });
    return final;
}