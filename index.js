import express from 'express';
import { createServer } from "http";
import { Server } from "socket.io";
import cors from 'cors';
import bodyParser from 'body-parser';
import facturacionController from './controllers/csFacturacion.js'
import sessionSocket from './controllers/csSessionSocket.js'
import emailController from './sendEmail.js';
import { pool } from './conections/conexMysql.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } })

app.use(cors());
app.use(bodyParser.json({ limit: '1000000mb' }));
app.use(bodyParser.urlencoded({ limit: '1000000mb', extended: true }));

var listClient = { id: '' };
var agenteList = [];




io.on('connection', async (socket) => {
    let codeQuery = socket.handshake.query.code;
    let codeTerminal = socket.handshake.headers.code;
    let isIcg = socket.handshake.headers.icg;

    let indexAgente = (agenteList || []).findIndex((data, i) => (data || {}).code == codeTerminal);

    if (indexAgente != -1) {
        agenteList[indexAgente]['id'] = socket.id;
    } else {
        agenteList.push({ id: socket.id, code: codeTerminal });
    }

    if (codeQuery == 'app') {
        console.log('app', socket.id);
        listClient.id = socket.id;
        let listSessionConnect = await sessionSocket.connect();
        socket.emit("sessionConnect", listSessionConnect);
        let [documentList] = await pool.query(`SELECT * FROM TB_DOCUMENTOS_ERROR_SUNAT;`);
        socket.emit("sendNotificationSunat", documentList);
    }

    socket.on('verifyDocument', async (resData) => {
        if ((resData || "").id == "server") {
            let listSessionConnect = await facturacionController.verificacionDocumentos(resData);
            socket.to(`${listClient.id}`).emit("sessionConnect", listSessionConnect);
        }
    });

    socket.on('petitionFront', (data) => {
        let selectAgente = (agenteList || []).find((data) => (data || {}).id == socket.id);
        if (typeof codeTerminal != 'undefined' && codeTerminal != '') {
            socket.broadcast.emit("sendDataFront", data, codeTerminal);
        }
    });

    socket.on('comunicationFront', (data) => {
        socket.broadcast.emit("consultingToFront", 'ready');
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


    if (codeTerminal != "SRVFACT" && isIcg != 'true') {
        let listSessionConnect = await sessionSocket.connect(codeTerminal);
        socket.to(`${listClient.id}`).emit("sessionConnect", listSessionConnect);
    } else {
        if (codeTerminal == "SRVFACT") {
            console.log('SERVIDOR', codeTerminal);
            emailController.sendEmail('', `SERVIDOR FACTURACION CONECTADO..!!!!!`, null, null, `SERVIDOR FACTURACION`)
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
            { code: '9F', name: 'VSFA JOCKEY FULL', email: 'vsfajockeyventas@grupodavid.com' },
            { code: '7A7', name: 'BBW ASIA', email: 'bbwasia@grupodavid.com' }
        ];

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
        socket.to(`${listClient.id}`).emit("sendNotificationSunat", documentList);

        /*let errDocument = [
            {
                'ID.FACTURA': (arrDocumento || {}).CODIGO_DOCUMENTO,
                'NUM.FACTURA': (arrDocumento || {}).NRO_CORRELATIVO,
                'FEC.EMISION': (arrDocumento || {}).FECHA_EMISION,
                'NOM.CLIENTE': (arrDocumento || {}).NOM_ADQUIRIENTE,
                'NUM.DOCUMENTO': (arrDocumento || {}).NRO_DOCUMENTO,
            }
        ]*/

        var bodyHTML = `<p>Buenos días, adjunto los datos de una factura emitida con numero de RUC errado (Cliente Con DNI, lo cual está prohibido para el caso de factura, para esos casos existen las boletas).</p> 
    
        <p>Lamentablemente no han cumplido con los procesos y métodos de validación que se les han proporcionado.</p>  
        
        <p>Quedo atento de la persona responsable de emitir dicha factura.</p>  
        
        <p>Realizar la NC con anticipo y/o vale.  Si tienen alguna inquietud me dejan saber.</p>
        
        <p>Saludos.
    
        <p><strong>Datos de factura emitida:</strong></p>
        
        <table align="left" cellspacing="0">
            <thead>
                <tr>
                    <th style="border: 1px solid #9E9E9E;border-right:0px" width="110px">ID.FACTURA</th>
                    <th style="border: 1px solid #9E9E9E;border-right:0px" width="110px">NUM.FACTURA</th>
                    <th style="border: 1px solid #9E9E9E;border-right:0px" width="110px">FEC.EMISION</th>
                    <th style="border: 1px solid #9E9E9E;border-right:0px" width="200px">NOM.CLIENTE</th>
                    <th style="border: 1px solid #9E9E9E" width="140px">NUM.DOCUMENTO</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center;border-right:0px">${(arrDocumento || {}).CODIGO_DOCUMENTO}</td>
                    <td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center">${(arrDocumento || {}).NRO_CORRELATIVO}</td>
                    <td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center;border-right:0px">${(arrDocumento || {}).FECHA_EMISION}</td>
                    <td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center;border-right:0px">${(arrDocumento || {}).NOM_ADQUIRIENTE}</td>
                    <td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center">${(arrDocumento || {}).NRO_DOCUMENTO}</td>
                </tr>
            </tbody>
        </table>`;

        console.log('sunat-notification', codeTerminal);

        let serie = ((arrDocumento || {}).NRO_CORRELATIVO || "").split('-')[0];

        let codigo = '';
        let selectedLocal = {};
        let count = 0;

        

        while (count <= 2) {
            count++;

            if (count == 2) {
                codigo = serie.substr(1, 3);
            }else{
                codigo = serie.substr(1, 2);
            }
            
            selectedLocal = tiendasList.find((data) => data.code == codigo);
            if (Object.keys(selectedLocal).length) {
                count = 2;
            }
        }
        console.log("CODIGO", codigo);
        console.log("TIENDA", selectedLocal);
        /* emailController.sendEmail((selectedLocal || {}).email || '', `FACTURA CON RUC ERRADO`, bodyHTML, null, null)
             .catch(error => res.send(error));*/
    });

    console.log(`connect ${codeTerminal} - idApp`, listClient.id);
    console.log('a user connected');
});

httpServer.listen(3200, async () => {
    console.log('listening on *:3200');
});