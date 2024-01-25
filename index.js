import express from 'express';
import { createServer } from "http";
import { Server } from "socket.io";
import cors from 'cors';
import bodyParser from 'body-parser';
import facturacionController from './controllers/csFacturacion.js'
import sessionSocket from './controllers/csSessionSocket.js'
import securityRoutes from './routes/security.routes.js';
import configurationRoutes from './routes/configuration.routes.js';
import Jwt from 'jsonwebtoken';
import { prop } from './keys.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } })

app.use(cors({
    origin: '*'
}));

app.use(bodyParser.json({ limit: '1000000mb' }));
app.use(bodyParser.urlencoded({ limit: '1000000mb', extended: true }));

var listClient = { id: '' };
var agenteList = [];

app.use('/security', securityRoutes);
app.use('/settings', configurationRoutes);

io.use(function (socket, next) {
    let token = socket.handshake.query.token || socket.handshake.headers.token;
    if (token) {
        Jwt.verify(token, prop.keyCrypt, function (err, decoded) {
            if (err) return next(new Error('Authentication error'));
            socket.decoded = decoded;
            next();
        });
    }
    else {
        next(new Error('Authentication error'));
    }
}).on('connection', async (socket) => {
    let codeQuery = socket.handshake.query.code;
    let codeTerminal = socket.handshake.headers.code;
    let isIcg = socket.handshake.headers.icg;

    if (socket.decoded.aud == 'AGENTE') {
        let indexAgente = (agenteList || []).findIndex((data, i) => (data || {}).code == codeTerminal);

        if (indexAgente != -1) {
            agenteList[indexAgente]['id'] = socket.id;
        } else {
            agenteList.push({ id: socket.id, code: codeTerminal });
        }
    }

    if (codeQuery == 'app') {
        listClient.id = socket.id;
        let listSessionConnect = await sessionSocket.connect();
        socket.emit("sessionConnect", listSessionConnect);
    }

    //EMITE DESDE EL SERVIDOR
    socket.on('verifyDocument', async (resData) => {
        if (socket.decoded.aud == 'SERVER') {
            let listSessionConnect = await facturacionController.verificacionDocumentos(resData);
            socket.to(`${listClient.id}`).emit("sessionConnect", listSessionConnect);
        }
    });

    //EMITE DESDE EL AGENTE PY
    socket.on('petitionFront', (data) => {
        if (socket.decoded.aud == 'AGENTE') {
            let selectAgente = (agenteList || []).find((data) => (data || {}).id == socket.id);
            socket.broadcast.emit("sendDataFront", data, selectAgente.code);
        }
    });

    socket.on('resTransaction', (data) => {
      if (socket.decoded.aud == 'AGENTE') {
        console.log(data);
          let selectAgente = (agenteList || []).find((data) => (data || {}).id == socket.id);
          socket.broadcast.emit("dataTransaction", data, selectAgente.code);
      }
    });

    //EMITE DESDE EL FRONT
    socket.on('comunicationFront', (data) => {
        if (socket.decoded.aud == 'ADMINISTRADOR') {
            socket.broadcast.emit("consultingToFront", 'ready');
        }
    });

    socket.on('emitTransaction', (data) => {
      if (socket.decoded.aud == 'ADMINISTRADOR') {
          socket.broadcast.emit("searchTransaction", 'ready');
      }
  });

    socket.on('conexion:serverICG', (data) => {
        socket.broadcast.emit("conexion:serverICG:send", data);
    });

    socket.on('disconnect', async () => {
        if (codeTerminal == "SRVFACT") {
            sessionSocket.disconnectServer();
            socket.broadcast.emit("status:serverSUNAT:send", { 'code': 'SRVFACT', 'online': 'false' });
        } else if (isIcg != 'true') {
            console.log(`disconnect ${codeTerminal} - idApp`, listClient.id);
            let listSessionDisconnet = await sessionSocket.disconnect(codeTerminal);
            socket.to(`${listClient.id}`).emit("sessionConnect", listSessionDisconnet);
        }

        if (isIcg == 'true') {
            socket.broadcast.emit("conexion:serverICG:send", [{'code': codeTerminal,'isConect' : '0'}]);
        }

        
        console.log('user disconnected');
    });

    socket.on('status:serverSUNAT', (data) => {
        socket.broadcast.emit("status:serverSUNAT:send", data);
    });


    if (codeTerminal != "SRVFACT" && isIcg != 'true') {
        let listSessionConnect = await sessionSocket.connect(codeTerminal);
        socket.to(`${listClient.id}`).emit("sessionConnect", listSessionConnect);
    }

    console.log(`connect ${codeTerminal} - idApp`, listClient.id);
    console.log('a user connected');
});

httpServer.listen(3200, async () => {
    console.log('listening on *:3200');
});