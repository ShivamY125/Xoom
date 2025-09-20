import { rejects } from "assert";
import { resolve } from "path";

import * as mediasoup from "mediasoup";
import os from "os";
import Config from "./config/config.js";
const totalThreads = os.cpus().length; // this is max no of allowed workers.

//console.log(totalThreads);


export const createWorkers = ()=> new Promise(async(resolve,reject)=> {
    let workers = [];
    
    // loop to crerate each worker. 
    for(let i=0;i<totalThreads;i++){
       const worker = await mediasoup.createWorker({
        // rtcmina dn max port are arbitary port just for traffic routing.
        // useful fro networking rule.
        rtcMinPort: Config.WorkerSettings.rtcMinPort,
        rtcMaxPort: Config.WorkerSettings.rtcMaxPort,
        logLevel: Config.WorkerSettings.logLevel,
        Logtags: Config.WorkerSettings.logTags
       });
       
       worker.on('died', ()=> {
        // this should never happen
        console.log("Worker has died");
        process.exit(1);
        // kill whole program.
       })

       workers.push(worker);
    }
    resolve(workers);
});