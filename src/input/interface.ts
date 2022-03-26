import * as yargs from 'yargs';
import { ProcessingPayload } from '../processing';

interface inputCommand {
    produceYargsCommand():any;
    start(args:yargs.Arguments):Promise<ProcessingPayload[]>;
};

export type { inputCommand };