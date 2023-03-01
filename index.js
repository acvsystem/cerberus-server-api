import express from 'express';
import { createServer } from "http";
import { Server } from "socket.io";
import cors from 'cors';
import bodyParser from 'body-parser';
import * as csFacturacion from './controllers/csFacturacion.js'

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } })

app.use(cors());
app.use(bodyParser.json({ limit: '1000000mb' }));
app.use(bodyParser.urlencoded({ limit: '1000000mb', extended: true }));

io.on('connection', (socket) => {
    socket.on('verifyDocument', (resData) => {
        console.log(resData);
        if ((resData || "").id == "server") {
            csFacturacion.verificacionDocumentos(resData);
        }
    });

    socket.on('petitionFront', (data) => {
        socket.broadcast.emit("sendDataFront", data);
    });

    socket.on('comunicationFront', (data) => {
        socket.broadcast.emit("consultingToFront", 'ready');
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    console.log('a user connected');
});

httpServer.listen(3200, async () => {
    console.log('listening on *:3200'); 
   /*const result = await database.query('select * from TB_TERMINAL_TIENDA')
    console.log(result);*/
});