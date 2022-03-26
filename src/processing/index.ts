import yargs = require("yargs");
import * as cliProgress from "cli-progress";
import * as https from 'https';
import * as ytdl from 'ytdl-core'

const { Parser } = require("htmlparser2");
const { DomHandler } = require("domhandler");

import { VirtualConsole, JSDOM } from "jsdom";

export interface ProcessingPayload {
    description:string;
    url?:URL;
    source?:string;
    tags?:string[];
    listingDate?:Date;
    contentOriginalDate?:Date;
    lengthSeconds?:number;
    originalEntry:any;
}


function getTwitterContentFromEmbedAPI(url):Promise<any> {
    return new Promise(function (resolve, reject) {
      const twiturl = "https://publish.twitter.com/oembed?url=" + url;
      https.get(twiturl, (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(rawData));
          } catch (e) {
            reject(e.message);
          }
        });
      
      }).on('error', (e) => {
        reject(e);
      });
    });
}

function parseHTML(HTML:string):Promise<any> {
    return new Promise<any>((resolve, reject) => {
        const parser = new Parser(new DomHandler((error, dom) => {
            if (error) {
                reject("couldn't do it");
            } else {
                // Parsing completed, do something
                resolve(dom);
            }
        }));
        parser.write(HTML);
        parser.end();
    })
}

async function JSDOMtime(url) {
    const virtualConsole = new VirtualConsole();
    virtualConsole.on("error", () => { });
    virtualConsole.on("warn", () => { });
    virtualConsole.on("info", () => { });
    virtualConsole.on("dir", () => { });
    return await JSDOM.fromURL(url, { runScripts: "outside-only", virtualConsole, pretendToBeVisual: true });
  }

async function fetchTitleViaJSOM(url):Promise<any> {
    const root = await JSDOMtime(url);
    const title = root.window.document.querySelector("title");
    const author = root.window.document.querySelector("link[rel~=author]")
    return { Name: title.textContent, Skapare: author && author.getAttribute("href") };
}

async function youtubeData(url:URL):Promise<any> {
    const data = await ytdl.getBasicInfo(url.href);
    
    return {
        Name: data.videoDetails.title,
        Skapare: data.videoDetails.author.name,
        OriginalDatum: data.videoDetails.publishDate,
        URL: data.videoDetails.video_url,
        Seconds: data.videoDetails.lengthSeconds
    }
}

export async function process_TodoistItems(items:ProcessingPayload[], args:yargs.Arguments):Promise<ProcessingPayload[]> {
    const style = {...cliProgress.Presets.shades_classic,format: ' {bar} {percentage}% | ETA: {eta}s | {value}/{total} | {filename}'}
    const bar1 = new cliProgress.SingleBar({clearOnComplete: true}, style);
    bar1.start(items.length, 0);

    for (let index = 0; index < items.length; index++) {
        const item = items[index];
        bar1.update(index,{filename:(item.url && item.url.href) || item.description})
        
        if(!item.url) {
            continue;
        } else if(!item.description && item.url) {
            let content;
            try {
                content = await fetchTitleViaJSOM(item.url.href);
            } catch (error) {}

            if(content) {
                item.description = content.Name || item.description;
            }
        }
        
        if(item.url.host.search("youtube.com") != -1 || item.url.host.search("youtu.be") != -1) {
            let content;
            try {
                content = await youtubeData(item.url);
            } catch (error) {
                continue;
            }
            
            item.description = content.Name;
            item.url = content.URL;
            item.lengthSeconds = content.Seconds;
            item.source = content.Skapare;
            item.contentOriginalDate = new Date(content.OriginalDatum);
        }
        else if(item.url.href.search(/twitter.com.*status/g) != -1) {
            let content;
            try {
                content = await getTwitterContentFromEmbedAPI(item.url.href);
            } catch (error) {
                if((error as string).search("Unexpected token < in JSON at position 0") != -1) {
                    item.description = "Deleted Tweet / Twitter account";
                }
                continue;
            }

            if(content.error) {
                item.description = content.error;
                continue;
            }

            item.description = content.html.match(/(?:<p.*?>)(.*)(?=<\/p>)/)[1];
            item.source = content.author_name;
        } else {
            // No OP
        }
        
    }

    bar1.stop();
    

    return items;
}