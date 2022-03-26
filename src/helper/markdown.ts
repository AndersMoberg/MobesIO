import { string } from "yargs";
import { ytInfo } from "../output/ytd";

export default function js2MDTable(array:ytInfo[]):string {
    let headers:any = {};
    let final:string = "";

    for (let index = 0; index < array.length; index++) {
        const object = array[index];
        for (const key in object) {
            if (Object.prototype.hasOwnProperty.call(object, key)) {
                headers[key] = true;
            }
        }
    }

    for (const key in headers) {
        if (Object.prototype.hasOwnProperty.call(headers, key)) {
            final += "| " + key + " ";
        }
    }
    final += "|\n";

    for (const key in headers) {
        if (Object.prototype.hasOwnProperty.call(headers, key)) {
            final += "| ";
            for (let index = 0; index < key.length; index++) {
                final += "-";
            }
            final += " ";
        }
    }
    final += "|\n";

    //console.log(array);

    for (let index = 0; index < array.length; index++) {
        const object = array[index];
        for (const key in headers) {
            final += "| ";
            if(key == "Segment") {
                final += "[["
            } 
            final += <string>(object[key] || "");
            if(key == "Segment") {
                final += "]]"
            } 
        }
        final += "|\n";
    }

    final += "| Total                            | |\n"
    final += "<!-- TBLFM: @>$>=sum(@I..@-1) -->"
    //| Segment                                                                                                                                   | Sec   |

    return final;
}
