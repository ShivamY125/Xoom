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
app.use(cors({origin: '*'}));

const Port = process.env.NODE_PORT;
//--------------------------------------------------------------
// Importing Components------------------------------------ 

import {createWorkers} from "./createWorker.js";

import Config from "./config/config.js";


//-------------------------------------------------
// keys and cert from mkcert.
const key = fs.readFileSync('./config/create-cert-key.pem');
const cert = fs.readFileSync('./config/create-cert.pem');
const options = {key,cert};
// use mkcert keys from modules.
const httpsServer = https.createServer(options, app); 



// Setup socketio server
const io = new Server(httpsServer, {
    cors: [`https://localhost:${process.env.NODE_PORT}`]
})

// global Values.
// workers created below will live in this worker.
let workers = null;

// init ROuter , it is where our 1 router will live.

let router = null;


// initmediaSoup gets mediaSoup ready to do  things.
const initMediaSoup = async()=> {
   workers = await createWorkers();

  // console.log(workers);
  router = await workers[0].createRouter({mediaCodecs: Config.routerMediaCodecs})

}

initMediaSoup();



// Socket.io listeners
io.on("connection", (socket)=> {

  let thisClientProducerTransport = null;
    
    // socket is the client that just connected.
   console.log('call recieved');
    //  console.log(router.rtpCapabilities)
    // when client calls emitWithAck server gets two things event name and callback.
    socket.on('getRtpCap', (callback)=> {
     
      callback(router.rtpCapabilities);
    })

    // ack is acknwledgement wrking here like a callback .
    socket.on('create-producer-transport', async (data, ack)=> {
      
      // Here we are creating a Producer Transport.
      thisClientProducerTransport = await router.createWebRtcTransport({
           enableUdp: true,
           enableTcp: true,   // always use and prefer UDP in Webrtc.
           preferUdp: true,
           listenInfos: [
            {
              protocol: 'udp',
              ip: '127.0.0.1'
            },
            {
              protocol: 'tcp',
              ip: '127.0.0.1'
            }
           ]
      })
          console.log(thisClientProducerTransport);
      const clientTransportParams = {
          id: thisClientProducerTransport.id,
          iceParameters: thisClientProducerTransport.iceParameters,
          iceCandidates: thisClientProducerTransport.iceCandidates,
          dtlsParameters: thisClientProducerTransport.dtlsParameters
      }

      // once we get confirmation we will create atransport.
      ack(clientTransportParams);
    })

    socket.on('connect-transport', async(dtlsParameters, ack)=> {
     // Get the Dtls info from the client,a nd finish the connection
     // success will send succes and on fail send failure.
     try{
       // console.log("checking");
          await thisClientProducerTransport.connect(dtlsParameters)
          ack("success")
      } catch(err){
          console.log(err)
          ack("error");
      }
      
    })
})

httpsServer.listen(Port, (req,res)=> {
    console.log(`app is listening to port ${Port}`);
})