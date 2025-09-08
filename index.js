import fs from "fs"; // This is used to read our keys. 
import https from "https"; // need this for secure express server.

// Project Setup & requirement.----------------------------------
import express from "express";
import {Server} from "socket.io";
import * as  mediasoup from "mediasoup";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
// Serves everthing in public folder statically.
app.use(express.static('public'));
app.use(cors());

const Port = process.env.NODE_PORT;
//--------------------------------------------------------------
// Importing Components------------------------------------ 

import  {createWorkers} from "./createWorker.js";

import Config from "./config/config.js";


//-------------------------------------------------
// keys and cert from mkcert.
const key = fs.readFileSync('./config/create-cert-key.pem');
const cert = fs.readFileSync('./config/create-cert.pem');
const options = {key,cert};
// use mkcert keys from modules.
const httpsServer = https.createServer(options, app); 

// httpsServer.get("/", (req,res)=> {
//     res.send("returned data");
// })

// Setup socketio server
const io = new Server(httpsServer, {
    cors: [`https://localhost:${process.env.NODE_PORT}`]
})

// workers created below will live in this worker.
let workers = null;

// initmediaSoup gets mediaSoup ready to do  things.
const initMediaSoup = async()=> {
   workers = await createWorkers();

  // console.log(workers);
}

initMediaSoup();

httpsServer.listen(Port, (req,res)=> {
    console.log(`app is listening to port ${Port}`);
})