import express from 'express';
import { createServer } from "http";
import { Server } from "socket.io";
import cors from 'cors';
import bodyParser from 'body-parser';
import facturacionController from './controllers/csFacturacion.js'
import sessionSocket from './controllers/csSessionSocket.js'
import { pool } from './conections/conexMysql.js';
import securityRoutes from './routes/security.routes.js';
import configurationRoutes from './routes/configuration.routes.js';
import frontRetailRoutes from './routes/frontRetail.routes.js';
import emailController from './sendEmail.js';
import tokenController from './controllers/csToken.js';
import CryptoJS from 'crypto-js';
import { prop } from './keys.js';
import * as cron from 'node-cron';
import templateHtmlController from './template/csTemplatesHtml.js';

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
app.use('/settings', async (req, res, next) => {
    const token = req.header('Authorization') || "";

    let resValidation = tokenController.verificationToken(token);

    if ((resValidation || {}).isValid) {
        next()
    } else {
        return res.status(401).json('Access denied');
    }
}, configurationRoutes);

app.use('/frontRetail', frontRetailRoutes);

const task_1 = cron.schedule('00 10 * * *', () => {
    console.log('00 10');
    emitVerificationDoc();
});

const task_2 = cron.schedule('00 15 * * *', () => {
    console.log('00 15');
    emitVerificationDoc();
});

const task_3 = cron.schedule('00 19 * * *', () => {
    console.log('00 19');
    emitVerificationDoc();
});

task_1.start();
task_2.start();
task_3.start();

function emitVerificationDoc() {
    io.emit('consultingToFront', 'emitVerificationDoc');
}

app.post('/control-asistencia', async (req, res) => {

    let empleadoList = (((req || []).body || [])[0] || {});
    let tiendasList = [
        { code: '7A', name: 'BBW JOCKEY', email: 'bbwjockeyplaza@grupodavid.com' },
        { code: '9A', name: 'VSBA JOCKEY', email: 'vsjockeyplaza@grupodavid.com' },
        { code: 'PC', name: 'AEO JOCKEY', email: 'americaneaglejp@grupodavid.com' },
        { code: 'PB', name: 'AEO ASIA', email: 'aeopopupasia@grupodavid.com' },
        { code: '7E', name: 'BBW LA RAMBLA', email: 'bbwlarambla@grupodavid.com' },
        { code: '9D', name: 'VS LA RAMBLA', email: 'vslarambla@grupodavid.com' },
        { code: '9B', name: 'VS PLAZA NORTE', email: 'vsplazanorte@grupodavid.com' },
        { code: '7C', name: 'BBW SAN MIGUEL', email: 'bbwsanmiguel@grupodavid.com' },
        { code: '9C', name: 'VS SAN MIGUEL', email: 'vssanmiguel@grupodavid.com' },
        { code: '7D', name: 'BBW SALAVERRY', email: 'bbwsalaverry@grupodavid.com' },
        { code: '9I', name: 'VS SALAVERRY', email: 'vssalaverry@grupodavid.com' },
        { code: '9G', name: 'VS MALL DEL SUR', email: 'vsmalldelsur@grupodavid.com' },
        { code: '9H', name: 'VS PURUCHUCO', email: 'vspuruchuco@grupodavid.com' },
        { code: '9M', name: 'VS ECOMMERCE', email: 'vsecommpe@grupodavid.com' },
        { code: '7F', name: 'BBW ECOMMERCE', email: 'bbwecommperu@grupodavid.com' },
        { code: 'PA', name: 'AEO ECOMMERCE', email: 'aeecompe@grupodavid.com' },
        { code: '9K', name: 'VS MEGA PLAZA', email: 'vsmegaplaza@grupodavid.com' },
        { code: '9L', name: 'VS MINKA', email: 'vsoutletminka@grupodavid.com' },
        { code: '9F', name: 'VSFA JOCKEY FULL', email: 'vsfajockeyplaza@grupodavid.com' },
        { code: '7A7', name: 'BBW ASIA', email: 'bbwasia@grupodavid.com' }
    ];
    console.log("empleadoList", empleadoList);
    let [verifyEmpleado] = await pool.query(`SELECT * FROM TB_REGISTROEMPLEADOS WHERE CODEMPLEADO = ${(empleadoList || {}).CODEMPLEADO} ORDER by ID_REG_EMPLEADO DESC LIMIT 1`);


    console.log("verifyEmpleado", verifyEmpleado);

    if (((verifyEmpleado || [])[0] || {}).INPUT && ((verifyEmpleado || [])[0] || {}).OUTPUT < 1) {

        await pool.query(`UPDATE TB_REGISTROEMPLEADOS SET
            HORAIN ='${(empleadoList || {}).NOM_ADQUIRIENTE}',
            HORAOUT = '${(empleadoList || {}).NRO_DOCUMENTO}',
            OUTPUT = 'true',
            HORAS = '${(empleadoList || {}).TIPO_DOCUMENTO_ADQUIRIENTE}',
            NUMVENTAS = '${(empleadoList || {}).OBSERVACION}',
            Z = '${(empleadoList || {}).ESTADO_SUNAT}',
            CAJA = '${(empleadoList || {}).ESTADO_COMPROBANTE}' WHERE CODEMPLEADO = ${(empleadoList || {}).CODEMPLEADO};`);

        res.send('RECEPCION EXITOSA..!!');
    }

    if (((verifyEmpleado || [])[0] || {}).INPUT < 1) {

        await pool.query(`INSERT INTO TB_REGISTROEMPLEADOS(FO,CODEMPLEADO,DIA,HORAIN,HORAOUT,INPUT,OUTPUT,HORAS,VENTAS,NUMVENTAS,Z,CAJA,HORASNORMAL,HORASEXTRA,COSTEHORA,COSTEHORAEXTRA,CODMOTIVO,CODMOTIVOENTRADA,TERMINAL)
        VALUES(${(empleadoList || {}).FO},
        '${(empleadoList || {}).CODEMPLEADO}',
        '${(empleadoList || {}).DIA}',
        '${(empleadoList || {}).HORAIN}',
        '${(empleadoList || {}).HORAOUT}',
        '${(empleadoList || {}).HORAS}',
        'true',
        'false',
        '${(empleadoList || {}).VENTAS}',
        '${(empleadoList || {}).NUMVENTAS}',
        '${(empleadoList || {}).Z}',
        '${(empleadoList || {}).CAJA}',
        '${(empleadoList || {}).HORASNORMAL}',
        '${(empleadoList || {}).HORASEXTRA}',
        '${(empleadoList || {}).COSTEHORA}',
        '${(empleadoList || {}).COSTEHORAEXTRA}',
        '${(empleadoList || {}).CODMOTIVO}',
        '${(empleadoList || {}).CODMOTIVOENTRADA}',
        '${(empleadoList || {}).TERMINAL}');`);

        res.send('RECEPCION EXITOSA..!!');
    }

    res.send('RECEPCION NO INSERT');




/*
    if (!((empleadoList || [])[0] || {}).HORAIN && (!verifyEmpleado.length || verifyEmpleado.length == 1)) {
        await pool.query(`INSERT INTO TB_REGISTROEMPLEADOS(FO,CODEMPLEADO,DIA,HORAIN,HORAOUT,HORAS,VENTAS,NUMVENTAS,Z,CAJA,HORASNORMAL,HORASEXTRA,COSTEHORA,COSTEHORAEXTRA,CODMOTIVO,CODMOTIVOENTRADA,TERMINAL)
                            VALUES(${(empleadoList || {}).FO},
                            '${(empleadoList || {}).CODEMPLEADO}',
                            '${(empleadoList || {}).DIA}',
                            '${(empleadoList || {}).HORAIN}',
                            '${(empleadoList || {}).HORAOUT}',
                            '${(empleadoList || {}).HORAS}',
                            '${(empleadoList || {}).VENTAS}',
                            '${(empleadoList || {}).NUMVENTAS}',
                            '${(empleadoList || {}).Z}',
                            '${(empleadoList || {}).CAJA}',
                            '${(empleadoList || {}).HORASNORMAL}',
                            '${(empleadoList || {}).HORASEXTRA}',
                            '${(empleadoList || {}).COSTEHORA}',
                            '${(empleadoList || {}).COSTEHORAEXTRA}',
                            '${(empleadoList || {}).CODMOTIVO}',
                            '${(empleadoList || {}).CODMOTIVOENTRADA}',
                            '${(empleadoList || {}).TERMINAL}');`);

        res.send('RECEPCION EXITOSA..!!');
    }

    if (!(empleadoList || {}).HORAOUT && verifyEmpleado.length && verifyEmpleado.length >= 1) {

        if (!(empleadoList || {}).HORAOUT) {
            await pool.query(`UPDATE TB_REGISTROEMPLEADOS SET
            HORAIN ='${(empleadoList || {}).NOM_ADQUIRIENTE}',
            HORAOUT = '${(empleadoList || {}).NRO_DOCUMENTO}',
            HORAS = '${(empleadoList || {}).TIPO_DOCUMENTO_ADQUIRIENTE}',
            NUMVENTAS = '${(empleadoList || {}).OBSERVACION}',
            Z = '${(empleadoList || {}).ESTADO_SUNAT}',
            CAJA = '${(empleadoList || {}).ESTADO_COMPROBANTE}' WHERE CODEMPLEADO = ${(empleadoList || {}).CODEMPLEADO};`);
        }

        res.send('RECEPCION EXITOSA..!!');
    }
*/
    //let [documentList] = await pool.query(`SELECT * FROM TB_DOCUMENTOS_ERROR_SUNAT;`);
    //socket.to(`${listClient.id}`).emit("sendControlAsistencia", documentList);


});

io.use(function (socket, next) {
    let token = socket.handshake.query.token;
    let hash = socket.handshake.headers.hash;

    if (hash) {
        var bytes = CryptoJS.AES.decrypt(hash, prop.keyCryptHash);
        var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8)) || {};

        if (Object.keys(decryptedData).length) {
            token = tokenController.createToken((decryptedData || {}).user, (decryptedData || {}).nivel);
        }
    }

    let resValidToken = tokenController.verificationToken(token);

    if ((resValidToken || {}).isValid) {
        socket.decoded = (resValidToken || {}).decoded;
        next();
    } else {
        next(new Error('Authentication error'))
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
        console.log('app', socket.id);
        listClient.id = socket.id;
        let listSessionConnect = await sessionSocket.connect();
        socket.emit("sessionConnect", listSessionConnect);
        let [documentList] = await pool.query(`SELECT * FROM TB_DOCUMENTOS_ERROR_SUNAT;`);
        socket.emit("sendNotificationSunat", documentList);
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
        let selectAgente = (agenteList || []).find((data) => (data || {}).id == socket.id);
        if (typeof codeTerminal != 'undefined' && codeTerminal != '') {
            socket.broadcast.emit("sendDataFront", data, codeTerminal);
        }
    });

    //EMITE DESDE EL FRONT
    socket.on('comunicationFront', (data) => {
        if (socket.decoded.aud == 'ADMINISTRADOR') {
            socket.broadcast.emit("consultingToFront", 'ready');
        }
    });

    socket.on('update:file:FrontAgent', (data) => {
        console.log(socket.decoded.aud);
        if (socket.decoded.aud == 'ADMINISTRADOR') {
            socket.broadcast.emit("update_file_Agente", data);
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
            socket.broadcast.emit("conexion:serverICG:send", [{ 'code': codeTerminal, 'isConect': '0' }]);
        }

        console.log('user disconnected');
    });

    socket.on('status:serverSUNAT', (data) => {
        socket.broadcast.emit("status:serverSUNAT:send", data);
    });

    let listSessionConnect = await sessionSocket.connect(codeTerminal);
    socket.to(`${listClient.id}`).emit("sessionConnect", listSessionConnect);

    if (codeTerminal != "SRVFACT" && isIcg != 'true') {
        let listSessionConnect = await sessionSocket.connect(codeTerminal);
        socket.to(`${listClient.id}`).emit("sessionConnect", listSessionConnect);
    } else {
        if (codeTerminal == "SRVFACT") {
            console.log('SERVIDOR', codeTerminal);
            emailController.sendEmail('johnnygermano@grupodavid.com', `SERVIDOR FACTURACION CONECTADO..!!!!!`, null, null, `SERVIDOR FACTURACION`)
                .catch(error => res.send(error));
        }
    }

    app.post('/sunat-notification', async (req, res) => {

        let arrDocumento = (((req || []).body || [])[0] || {});
        let tiendasList = [
            { code: '7A', name: 'BBW JOCKEY', email: 'bbwjockeyplaza@grupodavid.com' },
            { code: '9A', name: 'VSBA JOCKEY', email: 'vsjockeyplaza@grupodavid.com' },
            { code: 'PC', name: 'AEO JOCKEY', email: 'americaneaglejp@grupodavid.com' },
            { code: 'PB', name: 'AEO ASIA', email: 'aeopopupasia@grupodavid.com' },
            { code: '7E', name: 'BBW LA RAMBLA', email: 'bbwlarambla@grupodavid.com' },
            { code: '9D', name: 'VS LA RAMBLA', email: 'vslarambla@grupodavid.com' },
            { code: '9B', name: 'VS PLAZA NORTE', email: 'vsplazanorte@grupodavid.com' },
            { code: '7C', name: 'BBW SAN MIGUEL', email: 'bbwsanmiguel@grupodavid.com' },
            { code: '9C', name: 'VS SAN MIGUEL', email: 'vssanmiguel@grupodavid.com' },
            { code: '7D', name: 'BBW SALAVERRY', email: 'bbwsalaverry@grupodavid.com' },
            { code: '9I', name: 'VS SALAVERRY', email: 'vssalaverry@grupodavid.com' },
            { code: '9G', name: 'VS MALL DEL SUR', email: 'vsmalldelsur@grupodavid.com' },
            { code: '9H', name: 'VS PURUCHUCO', email: 'vspuruchuco@grupodavid.com' },
            { code: '9M', name: 'VS ECOMMERCE', email: 'vsecommpe@grupodavid.com' },
            { code: '7F', name: 'BBW ECOMMERCE', email: 'bbwecommperu@grupodavid.com' },
            { code: 'PA', name: 'AEO ECOMMERCE', email: 'aeecompe@grupodavid.com' },
            { code: '9K', name: 'VS MEGA PLAZA', email: 'vsmegaplaza@grupodavid.com' },
            { code: '9L', name: 'VS MINKA', email: 'vsoutletminka@grupodavid.com' },
            { code: '9F', name: 'VSFA JOCKEY FULL', email: 'vsfajockeyplaza@grupodavid.com' },
            { code: '7A7', name: 'BBW ASIA', email: 'bbwasia@grupodavid.com' }
        ];

        if ((arrDocumento || {}).CODIGO_ERROR_SUNAT == 2800 || (arrDocumento || {}).CODIGO_ERROR_SUNAT == 1032) {
            let [verifyDocument] = await pool.query(`SELECT * FROM TB_DOCUMENTOS_ERROR_SUNAT WHERE CODIGO_DOCUMENTO = ${(arrDocumento || {}).CODIGO_DOCUMENTO};`);
            let isEmailEnvio = ((verifyDocument || [])[0] || {}).ENVIO_EMAIL || 'false';
            console.log('verifyDocument', verifyDocument);

            if (!(verifyDocument || []).length) {
                await pool.query(`INSERT INTO TB_DOCUMENTOS_ERROR_SUNAT(CODIGO_DOCUMENTO,NRO_CORRELATIVO,NOM_ADQUIRIENTE,NRO_DOCUMENTO,TIPO_DOCUMENTO_ADQUIRIENTE,OBSERVACION,ESTADO_SUNAT,ESTADO_COMPROBANTE,CODIGO_ERROR_SUNAT,ENVIO_EMAIL,FECHA_EMISION)
                                VALUES(${(arrDocumento || {}).CODIGO_DOCUMENTO},
                                '${(arrDocumento || {}).NRO_CORRELATIVO}',
                                '${(arrDocumento || {}).NOM_ADQUIRIENTE}',
                                '${(arrDocumento || {}).NRO_DOCUMENTO}',
                                '${(arrDocumento || {}).TIPO_DOCUMENTO_ADQUIRIENTE}',
                                '${(arrDocumento || {}).OBSERVACION}',
                                '${(arrDocumento || {}).ESTADO_SUNAT}',
                                '${(arrDocumento || {}).ESTADO_COMPROBANTE}',
                                '${(arrDocumento || {}).CODIGO_ERROR_SUNAT}',
                                'false',
                                '${(arrDocumento || {}).FECHA_EMISION}');`);

                res.send('RECEPCION EXITOSA..!!');
            } else {
                await pool.query(`UPDATE TB_DOCUMENTOS_ERROR_SUNAT SET
                                NOM_ADQUIRIENTE ='${(arrDocumento || {}).NOM_ADQUIRIENTE}',
                                NRO_DOCUMENTO = '${(arrDocumento || {}).NRO_DOCUMENTO}',
                                TIPO_DOCUMENTO_ADQUIRIENTE = '${(arrDocumento || {}).TIPO_DOCUMENTO_ADQUIRIENTE}',
                                OBSERVACION = '${(arrDocumento || {}).OBSERVACION}',
                                ESTADO_SUNAT = '${(arrDocumento || {}).ESTADO_SUNAT}',
                                ESTADO_COMPROBANTE = '${(arrDocumento || {}).ESTADO_COMPROBANTE}',
                                CODIGO_ERROR_SUNAT = '${(arrDocumento || {}).CODIGO_ERROR_SUNAT}' WHERE CODIGO_DOCUMENTO = ${(arrDocumento || {}).CODIGO_DOCUMENTO};`);
                res.send('RECEPCION EXITOSA..!!');
            }

            let [documentList] = await pool.query(`SELECT * FROM TB_DOCUMENTOS_ERROR_SUNAT;`);
            socket.to(`${listClient.id}`).emit("sendNotificationSunat", documentList);

            var bodyHTML = templateHtmlController.errorSunat(arrDocumento);

            let serie = ((arrDocumento || {}).NRO_CORRELATIVO || "").split('-')[0];

            var codigo = serie.substr(1, 3);
            var selectedLocal = {};
            var count = 0;


            while (count <= 1) {

                if (count == 1) {
                    codigo = serie.substr(1, 2);
                }

                selectedLocal = tiendasList.find((data) => data.code == codigo) || {};
                if (Object.keys(selectedLocal).length) {
                    count = 1;
                }

                count++;
            }

            if (Object.keys(selectedLocal).length && isEmailEnvio != 'true') {
                console.log("sunat:codigo_tienda", codigo);
                console.log("sunat:tienda", selectedLocal);

                await pool.query(`UPDATE TB_DOCUMENTOS_ERROR_SUNAT SET ENVIO_EMAIL ='true' WHERE CODIGO_DOCUMENTO = ${(arrDocumento || {}).CODIGO_DOCUMENTO};`);

                emailController.sendEmail([(selectedLocal || {}).email || '', 'johnnygermano@grupodavid.com'], `FACTURA CON RUC ERRADO ${(selectedLocal || {}).name || ''}`, bodyHTML, null, null)
                    .catch(error => res.send(error));
            }
        }

    });

    console.log(`connect ${codeTerminal} - idApp`, listClient.id);
    console.log('a user connected');
});



httpServer.listen(4200, async () => {
    console.log('listening on *:4200');
});