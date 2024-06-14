import express from 'express';
import { createServer } from "http";
import { Server } from "socket.io";
import cors from 'cors';
import bodyParser from 'body-parser';
import facturacionController from './controllers/csFacturacion.js'
import sessionSocket from './controllers/csSessionSocket.js'
import emailController from './sendEmail.js';
import { pool } from './conections/conexMysql.js';
import * as cron from 'node-cron';
import { EventEmitter } from "events";
import securityRoutes from "./routes/security.routes.js";
import frontRetailRoutes from "./routes/frontRetail.routes.js";
import { prop as defaultResponse } from "./const/defaultResponse.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

app.use(
  cors({
    origin: "*",
  })
);

app.use(bodyParser.json({ limit: "1000000mb" }));
app.use(bodyParser.urlencoded({ limit: "1000000mb", extended: true }));

app.use("/security", securityRoutes);


const emiter = new EventEmitter();

var listClient = { id: '' };
var agenteList = [];

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
    //console.log("'verifyDocument'", resData);
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

  socket.on('responseStock', (data) => {
    console.log(data);
    socket.to(`${listClient.id}`).emit("dataStock", data);
  });

  socket.on('resTransaction', (data) => {
    console.log(data);
    let response = JSON.parse(data);
    let body = [
      {
        code: codeTerminal,
        transaciones: response[0]['remCount']
      }
    ];

    socket.to(`${listClient.id}`).emit("dataTransaction", body);

  });

  socket.on('resClient', async (data) => {
    console.log('resClient', data);
    let response = JSON.parse(data);
    // let [tiendaExist] = await pool.query(`SELECT * FROM TB_CLIENTES_BLANCO WHERE SERIE_TIENDA = ${codeTerminal};`);
    //console.log('tiendaExist', tiendaExist);
    /*if ((tiendaExist || []).length) {
      await pool.query(`UPDATE TB_CLIENTES_BLANCO SET NUMERO_CLIENTES = ${response[0]['clientCant']} WHERE SERIE_TIENDA = ${codeTerminal});`);
    } else {
      await pool.query(`INSERT INTO TB_CLIENTES_BLANCO(SERIE_TIENDA,NUMERO_CLIENTES)VALUES(${codeTerminal},${response[0]['clientCant']});`);
    }*/

    let body = [
      {
        code: codeTerminal,
        clientCant: response[0]['clientCant']
      }
    ];

    socket.to(`${listClient.id}`).emit("sendDataClient", body);

  });


  socket.on('emitTransaction', (data) => {
    console.log('emitTransaction');
    socket.broadcast.emit("searchTransaction", 'ready');
  });

  socket.on('cleanClient', (data) => {
    console.log('cleanClient');
    socket.broadcast.emit("searchCantCliente", 'ready');
  });


  socket.on('comunicationFront', (data) => {
    console.log('comunicationFront');
    socket.broadcast.emit("consultingToFront", 'ready');
  });

  socket.on('comunicationStock', (data) => {
    console.log('comunicationStock');
    socket.broadcast.emit("searchStock", 'ready');
  });



  socket.on('emitCleanClient', (data) => {
    console.log('cleanClient');
    socket.broadcast.emit("limpiarCliente", 'ready');
  });

  socket.on('conexion:serverICG', (data) => {
    socket.broadcast.emit("conexion:serverICG:send", data);
  });

  socket.on('disconnect', async () => {
    if (codeTerminal == "SRVFACT") {
      await pool.query(`UPDATE TB_ESTATUS_SERVER_BACKUP SET ESTATUS_CONEXION = 0 WHERE ID_ESTATUS_SERVER = 1;`);
      setTimeout(async () => {
        let [conexionList] = await pool.query(`SELECT * FROM TB_ESTATUS_SERVER_BACKUP;`);
        if (!((conexionList || [])[0] || {}).ESTATUS_CONEXION) {
          await pool.query(`UPDATE TB_ESTATUS_SERVER_BACKUP SET OLD_ESTATUS = 0 WHERE ID_ESTATUS_SERVER = 1;`);
          sessionSocket.disconnectServer();
        }
      }, 300000);

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
      let [conexionList] = await pool.query(`SELECT * FROM TB_ESTATUS_SERVER_BACKUP;`);
      await pool.query(`UPDATE TB_ESTATUS_SERVER_BACKUP SET ESTATUS_CONEXION = 1 WHERE ID_ESTATUS_SERVER = 1;`);
      if (!((conexionList || [])[0] || {}).OLD_ESTATUS) {
        emailController.sendEmail('johnnygermano@metasperu.com', `SERVIDOR FACTURACION CONECTADO..!!!!!`, null, null, `SERVIDOR FACTURACION`)
          .catch(error => res.send(error));
      }
      await pool.query(`UPDATE TB_ESTATUS_SERVER_BACKUP SET OLD_ESTATUS = 1 WHERE ID_ESTATUS_SERVER = 1;`);

    }
  }


  app.post("/frontRetail/search/stock", async (req, res) => {
    let dataServer = (req || {}).body || [];
    console.log((req || {}).body || []);
    /*let codigoTienda = (((req || {}).body || [])[0] || {}).cCodigoTienda;
    
    let dataResponse = [];
    let dataProcess = [];

    let dataServer = (req || {}).body || [];

    let tiendasList = [
      { code: '7A', property: 'bbw_jockey', ready: false },
      { code: '9N', property: 'vs_m_aventura', ready: false },
      { code: '7J', property: 'bbw_m_aventura', ready: false },
      { code: '7E', property: 'bbw_rambla', ready: false },
      { code: '9D', property: 'vs_rambla', ready: false },
      { code: '9B', property: 'vs_p_norte', ready: false },
      { code: '7C', property: 'bbw_s_miguel', ready: false },
      { code: '9C', property: 'vs_s_miguel', ready: false },
      { code: '7D', property: 'bbw_salaverry', ready: false },
      { code: '9I', property: 'vs_salaverry', ready: false },
      { code: '9G', property: 'vs_m_sur', ready: false },
      { code: '9H', property: 'vs_puruchuco', ready: false },
      { code: '9M', property: 'vs_ecom', ready: false },
      { code: '7F', property: 'bbw_ecom', ready: false },
      { code: '9K', property: 'vs_m_plaza', ready: false },
      { code: '9L', property: 'vs_minka', ready: false },
      { code: '9F', property: 'vs_full', ready: false },
      { code: '7A7', property: 'bbw_asia', ready: false }
    ];

    let tiendaIndex = tiendasList.findIndex((property) => (property || {}).code == codigoTienda);
    tiendasList[tiendaIndex]['ready'] = true;

    let countReady = 0;

    tiendasList.filter((tienda) => {
      if ((tienda || {}).ready == true) {
        countReady += 1;
      }
    });

    if (countReady == 1) {
      
      dataProcess = dataServer;
     
      (dataProcess || []).filter((data, i) => {
        
        let isExist = dataResponse.find((res) => (res || {}).cCodigoBarra == (data || {}).cCodigoBarra);

        if (typeof isExist != 'undefined') {
          let codigoExist = (data || {}).cCodigoTienda;
          let valueSock = tiendasList.find((property) => (property || {}).code == codigoExist);

          let index = dataResponse.findIndex((dataIndex) => (dataIndex || {}).cCodigoBarra == (data || {}).cCodigoBarra);
          dataResponse[index][valueSock.property] = (data || {}).cStock;

        } else {
          let codigoTienda = (data || {}).cCodigoTienda;
         
          let valueSock = tiendasList.find((property) => (property || {}).code == codigoTienda);

          dataResponse.push({
            "cPreferencia": (data || {}).cPreferencia,
            "cCodigoBarra": (data || {}).cCodigoBarra,
            "cDescripcion": (data || {}).cDescripcion,
            "cDepartamento": (data || {}).cDepartamento,
            "cSeccion": (data || {}).cSeccion,
            "cFamilia": (data || {}).cFamilia,
            "cSubfamilia": (data || {}).cSubfamilia,
            "cTalla": (data || {}).cTalla,
            "cColor": (data || {}).cColor,
            "bbw_jockey": 0,
            "vs_m_aventura": 0,
            "bbw_m_aventura": 0,
            "bbw_rambla": 0,
            "vs_rambla": 0,
            "vs_p_norte": 0,
            "bbw_s_miguel": 0,
            "vs_s_miguel": 0,
            "bbw_salaverry": 0,
            "vs_salaverry": 0,
            "vs_m_sur": 0,
            "vs_puruchuco": 0,
            "vs_ecom": 0,
            "bbw_ecom": 0,
            "vs_m_plaza": 0,
            "vs_minka": 0,
            "vs_full": 0,
            "bbw_asia": 0
          });
          
          let index = dataResponse.findIndex((dataIndex) => (dataIndex || {}).cCodigoBarra == (data || {}).cCodigoBarra);
          dataResponse[index][(valueSock || {})['property']] = (data || {}).cStock;
          
        }
      });
      console.log(dataResponse);
      
    }*/

    //socket.to(`${listClient.id}`).emit("dataStock", dataServer);
    res.json(defaultResponse.success.default);
  });


  app.post('/facturas-pendiente', async (req, res) => {
    let request = ((req || []).body || [])
    console.log((((req || []).body || [])));


    let bodyHTML = `<p>Verificar el servidor, se detecta que hay facturas con estado pendiente.</p>
    
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
        <tbody>`;

    (request || []).filter((factura) => {
      bodyHTML += `
              <tr>
                  <td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center;border-right:0px">${(factura || {}).CODIGO_DOCUMENTO}</td>
                  <td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center">${(factura || {}).NRO_CORRELATIVO}</td>
                  <td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center;border-right:0px">${(factura || {}).FECHA_EMISION}</td>
                  <td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center;border-right:0px">${(factura || {}).NOM_ADQUIRIENTE}</td>
                  <td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center">${(factura || {}).NRO_DOCUMENTO}</td>
              </tr>`;
    });

    bodyHTML += `
        </tbody>
    </table>`;


    emailController.sendEmail(['itperu@metasperu.com', 'johnnygermano@metasperu.com'], `ALERTA FACTURAS EN COLA PENDIENTE`, bodyHTML, null, null)
      .catch(error => res.send(error));

    res.send('RECEPCION EXITOSA..!!');
  });

  app.post('/sunat-notification', async (req, res) => {

    let arrDocumento = (((req || []).body || [])[0] || {});
    let tiendasList = [
      { code: '7A', name: 'BBW JOCKEY', email: 'bbwjockeyplaza@grupodavid.com' },
      { code: '9N', name: 'VS MALL AVENTURA', email: 'vsmallaventura@grupodavid.com' },
      { code: '7J', name: 'BBW MALL AVENTURA', email: 'bbwmallaventura@grupodavid.com' },
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
      { code: '9K', name: 'VS MEGA PLAZA', email: 'vsmegaplaza@grupodavid.com' },
      { code: '9L', name: 'VS MINKA', email: 'vsoutletminka@grupodavid.com' },
      { code: '9F', name: 'VSFA JOCKEY FULL', email: 'vsfajockeyplaza@grupodavid.com' },
      { code: '7A7', name: 'BBW ASIA', email: 'bbwasia@grupodavid.com' }
    ];

    if ((arrDocumento || {}).CODIGO_ERROR_SUNAT == 2800 || (arrDocumento || {}).CODIGO_ERROR_SUNAT == 1032 || (arrDocumento || {}).CODIGO_ERROR_SUNAT == 2022 || (arrDocumento || {}).CODIGO_ERROR_SUNAT == 1083 || (arrDocumento || {}).CODIGO_ERROR_SUNAT == 1033) {
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

      /*let errDocument = [
          {
              'ID.FACTURA': (arrDocumento || {}).CODIGO_DOCUMENTO,
              'NUM.FACTURA': (arrDocumento || {}).NRO_CORRELATIVO,
              'FEC.EMISION': (arrDocumento || {}).FECHA_EMISION,
              'NOM.CLIENTE': (arrDocumento || {}).NOM_ADQUIRIENTE,
              'NUM.DOCUMENTO': (arrDocumento || {}).NRO_DOCUMENTO,
          }
      ]*/

      var bodyHTML = `<p>Buenos días, adjunto los datos de una factura emitida con numero de RUC errado.</p> 
        
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

        emailController.sendEmail([(selectedLocal || {}).email || '', 'johnnygermano@metasperu.com', 'josecarreno@metasperu.com'], `FACTURA CON RUC ERRADO ${(selectedLocal || {}).name || ''}`, bodyHTML, null, null)
          .catch(error => res.send(error));
      }
    }

  });

  console.log(`connect ${codeTerminal} - idApp`, listClient.id);
  console.log('a user connected');
});



httpServer.listen(3200, async () => {
  console.log('listening on *:3200');
});