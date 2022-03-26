import * as yargs from 'yargs';
import type { inputCommand } from '../interface'

import { Todoist } from 'todoist';
import { ProcessingPayload } from '../../processing';
import { processTodoistItems } from './commonmarkHelper';

export class todoistApi implements inputCommand {
    private td: any;

    public get TD(): any {
        return this.td;
    }

    constructor() {}

    public produceYargsCommand():any {
        return {
            command:'td [project]',
            describe:'Todoist API as input\n(Inbox project by default)'
        };
    }

    async start(args:yargs.Arguments):Promise<ProcessingPayload[]> {
        console.log("Todoist API attempt..");
        if(!args.apikey) {
            throw new Error("No API key! Cannot connect to Todoist.");
        }
        this.td = Todoist(args.apikey as string);
        const rawData = await this.getRawDataFromTodoist(args.project as string);
        console.log("Tasks filtered! %d items!", rawData.length);
        return await processTodoistItems(rawData);
    }

    todoistFilter(item:any, project_id:any) {
        if (item.project_id != project_id) {
            return false;
        }
        if (item.is_deleted !== 0 || item.date_completed !== null || item.due !== null) {
            return false;
        }
        return true;
    }

    async getRawDataFromTodoist(projectName:string):Promise<any[]> {
        await this.td.sync();
        console.log("Todoist API success!");
        
        const items = this.td.items.get()
        const projects = this.td.projects.get();

        const projectNameToUse = projectName || 'Inbox';
        const project = projects.find(project => project.name === projectNameToUse);
    
        if(project === undefined) {
            throw new Error("Could not find project name " + projectNameToUse);
        }

        console.log("Adding tasks that match these conditions:");
        console.log(" * Tasks in the project named " + project.name);
        console.log(" * Tasks without due dates");
        console.log(" * Tasks that are not completed");
        console.log(" * Tasks that haven't been deleted");
    
        return items.filter(item => this.todoistFilter(item,project.id));
    }
}