import express from 'express';
import { createServer } from "http";
import { Server } from "socket.io";
import cors from 'cors';
import bodyParser from 'body-parser';
import facturacionController from './controllers/csFacturacion.js'
import sessionSocket from './controllers/csSessionSocket.js'
import { pool } from './conections/conexMysql.js';
import emailController from './sendEmail.js';
import * as XLSX from 'xlsx';

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
    }

    socket.on('verifyDocument', (resData) => {
        if ((resData || "").id == "server") {
            let listSessionConnect = facturacionController.verificacionDocumentos(resData);
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
        socket.to(`${listClient.id}`).emit("sessionConnect", listSessionDisconnet);
        console.log('user disconnected');
    });


    app.post('/sunat-notification', async (req, res) => {

        let arrDocumento = (((req || []).body || [])[0] || {});

        let [verifyDocument] = await pool.query(`SELECT * FROM TB_DOCUMENTOS_ERROR_SUNAT WHERE CODIGO_DOCUMENTO = ${(arrDocumento || {}).CODIGO_DOCUMENTO};`);

        if (!(verifyDocument || []).length) {
            await pool.query(`INSERT INTO TB_DOCUMENTOS_ERROR_SUNAT(CODIGO_DOCUMENTO,NRO_CORRELATIVO,NOM_ADQUIRIENTE,NRO_DOCUMENTO,TIPO_DOCUMENTO_ADQUIRIENTE,OBSERVACION,ESTADO_SUNAT,ESTADO_COMPROBANTE,CODIGO_ERROR_SUNAT,FECHA_EMISION)
                            VALUES(${(arrDocumento || {}).CODIGO_DOCUMENTO},
                            '${(arrDocumento || {}).NRO_CORRELATIVO}',
                            '${(arrDocumento || {}).NOM_ADQUIRIENTE}',
                            '${(arrDocumento || {}).NRO_DOCUMENTO}',
                            '${(arrDocumento || {}).TIPO_DOCUMENTO_ADQUIRIENTE}',
                            '${(arrDocumento || {}).OBSERVACION}',
                            '${(arrDocumento || {}).ESTADO_SUNAT}',
                            '${(arrDocumento || {}).ESTADO_COMPROBANTE}',
                            '${(arrDocumento || {}).CODIGO_ERROR_SUNAT}',
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
                            CODIGO_ERROR_SUNAT = '${(arrDocumento || {}).CODIGO_ERROR_SUNAT}'`);
            res.send('RECEPCION EXITOSA..!!');
        }

        let [documentList] = await pool.query(`SELECT * FROM TB_DOCUMENTOS_ERROR_SUNAT;`);
        socket.emit("sendNotificationSunat", documentList);

        let errDocument = [
            {
                'ID.FACTURA': (arrDocumento || {}).CODIGO_DOCUMENTO,
                'NUM.FACTURA': (arrDocumento || {}).NRO_CORRELATIVO,
                'FEC.EMISION' : (arrDocumento || {}).FECHA_EMISION,
                'NOM.CLIENTE': (arrDocumento || {}).NOM_ADQUIRIENTE,
                'NUM.DOCUMENTO': (arrDocumento || {}).NRO_DOCUMENTO,
            }
        ]

        const workSheet = XLSX.utils.json_to_sheet((errDocument || []));
        const workBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workBook, workSheet, "attendance");
        const xlsFile = XLSX.write(workBook, { bookType: "xlsx", type: "buffer" });

        emailController.sendEmail('andrecanalesv@gmail.com', `FACTURA CON RUC ERRADO`, xlsFile, 'Documento_rechazado')
            .catch(error => res.send(error));

    });


    let listSessionConnect = await sessionSocket.connect(codeTerminal);
    socket.to(`${listClient.id}`).emit("sessionConnect", listSessionConnect);

    console.log('a user connected');
});

httpServer.listen(3200, async () => {
    console.log('listening on *:3200');
});