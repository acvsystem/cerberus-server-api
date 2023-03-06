import express from 'express';
import { createServer } from "http";
import { Server } from "socket.io";
import cors from 'cors';
import bodyParser from 'body-parser';
import facturacionController from './controllers/csFacturacion.js'
import sessionSocket from './controllers/csSessionSocket.js'

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } })

app.use(cors());
app.use(bodyParser.json({ limit: '1000000mb' }));
app.use(bodyParser.urlencoded({ limit: '1000000mb', extended: true }));

var listClient = { id: '' };

io.on('connection', async (socket) => {
    let codeQuery = socket.handshake.query.code;
    let codeTerminal = socket.handshake.headers.code;

    if (codeQuery == 'app') {
        listClient.id = socket.id;
        let listSessionConnect = await sessionSocket.connect(codeTerminal);
        socket.emit("sessionConnect", listSessionConnect);
    }

    socket.on('verifyDocument', async (resData) => {
        if ((resData || "").id == "server") {
            let listSessionConnect = await facturacionController.verificacionDocumentos(resData);
            console.log(`verifyDocument ${codeTerminal} - idApp`, listClient.id);
            socket.to(`${listClient.id}`).emit("sessionConnect", listSessionConnect);
        }
    });

    socket.on('petitionFront', (data) => {
        socket.broadcast.emit("sendDataFront", data);
    });

    socket.on('comunicationFront', (data) => {
        socket.broadcast.emit("consultingToFront", 'ready');
    });

    socket.on('disconnect', async () => {
        let listSessionDisconnet = await sessionSocket.disconnect(codeTerminal);
        console.log(`disconnect ${codeTerminal} - idApp`, listClient.id);
        socket.to(`${listClient.id}`).emit("sessionConnect", listSessionDisconnet);
        console.log('user disconnected');
    });


    let listSessionConnect = await sessionSocket.connect(codeTerminal);
    console.log(`connect ${codeTerminal} - idApp`, listClient.id);
    socket.to(`${listClient.id}`).emit("sessionConnect", listSessionConnect);

    console.log('a user connected');
});

httpServer.listen(3200, async () => {
    console.log('listening on *:3200');
});