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
import recursosHumanosRoutes from "./routes/recursosHumanos.routes.js";
import frontRetailRoutes from "./routes/frontRetail.routes.js";
import { prop as defaultResponse } from "./const/defaultResponse.js";
import tokenController from './controllers/csToken.js';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Client } from "basic-ftp"

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*", methods: ["GET", "POST"], transports: ['websocket', 'polling'] } });
const uploadTraspasos = multer({ dest: 'uploads/traspasos' });

app.use(
  cors({
    origin: "*",
  })
);

app.use(bodyParser.json({ limit: "1000000mb" }));
app.use(bodyParser.urlencoded({ limit: "1000000mb", extended: true }));

app.use("/security", securityRoutes);
app.use("/recursos_humanos", recursosHumanosRoutes);
app.use("/sistema", frontRetailRoutes);

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

const task_4 = cron.schedule('*/15 * * * *', () => {
  console.log('/15 * * * *');
  emitVerificationSUNAT();
});

const task_5 = cron.schedule('00 9 * * 0', () => {
  console.log('00 10 * * 0');
  onVerificarCalendario();
});

task_1.start();
task_2.start();
task_3.start();
task_4.start();
task_5.start();

function emitVerificationSUNAT() {
  io.emit('consultingSUNAT', 'sunat');
}

function emitVerificationDoc() {
  io.emit('consultingToFront', 'emitVerificationDoc');
}

function onVerificarCalendario() {

  const now = new Date();
  now.setDate(now.getDate());
  let day = new Date(now).toLocaleDateString().split('/');

  pool.query(`SELECT CODIGO_TIENDA FROM TB_HORARIO_PROPERTY WHERE TRIM(SUBSTRING(RANGO_DIAS,1,9)) = '${parseInt(day[0]) + 1}-${parseInt(day[1])}-${parseInt(day[2])}' GROUP BY CODIGO_TIENDA;`).then(([calendarios]) => {
    let arCalendarios = ['9M', '9Q'];
    (calendarios || []).filter((c) => {
      arCalendarios.push((c || {}).CODIGO_TIENDA);
    });

    pool.query(`SELECT * FROM TB_LISTA_TIENDA;`).then(([tiendas]) => {

      let arTiendas = tiendas || [];
      let arTiendasFaltantes = [];

      (arTiendas || []).filter((tienda, i) => {
        if (!arCalendarios.includes((tienda || {}).SERIE_TIENDA)) {
          arTiendasFaltantes.push((tienda || {}).DESCRIPCION);
        }

        if ((arTiendas || []).length - 1 == i) {
          console.log('arTiendasFaltantes', arTiendasFaltantes);
          if ((arTiendasFaltantes || []).length) {
            let bodyHTML = `<p>Tiendas sin el horario creado. '${parseInt(day[0]) + 1}-${parseInt(day[1])}-${parseInt(day[2])}'</p>
        
            <table align="left" cellspacing="0" style="border-right: 1px solid #9e9e9e;">
                <thead>
                    <tr>
                        <th style="border: 1px solid #9E9E9E;border-right:0px;width: 250px;" width="110px">TIENDA</th>
                    </tr>
                </thead>
                <tbody>`;

            (arTiendasFaltantes || []).filter((tienda) => {
              bodyHTML += `
                      <tr>
                          <td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center;border-right:0px">${tienda}</td>
                      </tr>`;
            });

            bodyHTML += `
                </tbody>
            </table>`;

            emailController.sendEmail(['itperu@metasperu.com', 'carlosmoron@metasperu.com', 'fieldleaderbbw@metasperu.com', 'fieldleadervs@metasperu.com', 'johnnygermano@metasperu.com', 'josecarreno@metasperu.com'], `ALERTA TIENDAS SIN HORARIO CREADO`, bodyHTML, null, null)
              .catch(error => res.send(error));

          }
        }
      });
    });
  });
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
    socket.broadcast.emit("comprobantes:get:response", listSessionConnect);
    let [documentList] = await pool.query(`SELECT * FROM TB_DOCUMENTOS_ERROR_SUNAT;`);

  }

  const transport = socket.conn.transport.name; // in most cases, "polling"

  socket.conn.on("upgrade", () => {
    const upgradedTransport = socket.conn.transport.name; // in most cases, "websocket"
    console.log("upgradedTransport", upgradedTransport);
  });

  socket.on('consultAsistencia', async (configuracion) => {
    (configuracion || [])['socket'] = listClient.id;

    socket.emit("searchAsistencia", configuracion);
  });

  socket.on('reporteAssitencia', async (resData) => {
    print(resData)
    if ((resData || "").id == "server") {
      socket.to(`${(resData || [])['configuration']['socket']}`).emit("responseAsistencia", resData);
    }
  });

  socket.on('responseStock', (data) => {
    console.log(data);
    socket.to(`${listClient.id}`).emit("dataStock", data);
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

    socket.to(`${response[0].socket}`).emit("sendDataClient", body);

  });


  socket.on('cleanClient', (data) => {
    console.log('cleanClient');
    let socketID = (socket || {}).id;
    socket.broadcast.emit("searchCantCliente", data, socketID);
  });

  socket.on('emitCleanClient', (data) => {
    console.log('cleanClient');
    let socketID = (socket || {}).id;
    socket.broadcast.emit("limpiarCliente", data, socketID);
  });

  socket.on('cleanColaFront', (data) => {
    console.log('clearColaUpdatePanama');
    socket.broadcast.emit("clearColaUpdatePanama", data);
  });

  /* CONSULTAR DOCUMENTOS FALTANTES */

  socket.on('comprobantes:get', (data) => {
    console.log(
      `-----INIT SOLICITUD
       FRONTEND: comprobantes:get`
    );
    let configuration = {
      socket: (socket || {}).id
    };

    socket.broadcast.emit("comprobantesGetFR", configuration); //SE ENVIA AL PYTHON DEL FRONT RETAIL
  });

  socket.on('comprobantes:get:fr:response', (data) => {
    console.log(
      `-----ENVIO RESPUESTA DE FRONT RETAIL A BACKEND
       FRONT RETAIL: comprobantes:get:fr:response`
    );

    let selectAgente = (agenteList || []).find((data) => (data || {}).id == socket.id);
    if (typeof codeTerminal != 'undefined' && codeTerminal != '') {
      socket.broadcast.emit("comprobantesGetSBK", data, codeTerminal); // SE ENVIA AL PYTHON DEL SERVIDOR BACKUP
    }
  });

  socket.on('comprobantes:get:sbk:response', async (resData) => { // RESPUESTA DESDE EL SERVIDOR BACKUP
    console.log(
      `-----ENVIO RESPUESTA DE SERVIDOR BACKUP A BACKEND
       SERVIDOR BACKUP: comprobantes:get:sbk:response`
    );

    if ((resData || "").id == "server") {
      let tiendasList = [];
      let socketID = resData['frontData']['configuration']['socket'];

      pool.query(`SELECT * FROM TB_LISTA_TIENDA;`).then(([tienda]) => {

        (tienda || []).filter(async (td, i) => {
          tiendasList.push({ code: (td || {}).SERIE_TIENDA, name: (td || {}).DESCRIPCION });

          if (tienda.length - 1 == i) {
            let listSessionConnect = await facturacionController.verificacionDocumentos({ serverData: resData['serverData'], frontData: resData['frontData']['data'], codigoFront: resData['codigoFront'] }, tiendasList);
            console.log(
              `-----ENVIO RESPUESTA A FRONTEND
               BACKEND: comprobantes:get:response`
            );
            socket.to(`${socketID}`).emit("comprobantes:get:response", listSessionConnect); // SE ENVIA A FRONTEND
          }

        });
      });
    }
  });

  /* VERIFICACION DE TRANSACCIONES */

  socket.on('transacciones:get', (data) => { //ENVIA A FRONT RETAIL
    console.log(
      `-----INIT SOLICITUD
      FRONTEND: transacciones:get`
    );

    let configuration = {
      socket: (socket || {}).id
    };

    socket.broadcast.emit("transaccionesGetFR", configuration);
  });

  socket.on('transacciones:get:fr:response', (data) => { //RECIBE DE FRONT RETAIL
    console.log(
      `-----ENVIO RESPUESTA A FRONTEND
       BACKEND: transacciones:get:response`
    );

    let socketID = data['configuration']['socket'];
    let response = JSON.parse(data['data']);
    let body = [
      {
        code: codeTerminal,
        transaciones: response[0]['remCount']
      }
    ];

    socket.to(`${socketID}`).emit("transacciones:get:response", body); // ENVIA A FRONTEND
  });

  /* CONSULTA NOMBRES DE TERMINALES FRONT RETAIL */

  socket.on('terminales:get:name', (data) => {
    console.log(
      `-----INIT SOLICITUD
       FRONTEND: terminales:get:name`
    );

    let configuration = {
      socket: (socket || {}).id
    };

    socket.broadcast.emit("terminalesGetNameFR", configuration);
  });

  socket.on('terminales:get:name:fr:response', async (data) => {
    console.log(
      `-----ENVIO RESPUESTA DE FRONT RETAIL A BACKEND
       FRONT RETAIL: terminales:get:name:fr:response`
    );
    let socketID = data['configuration']['socket'];
    let response = JSON.parse(data['data']);
    socket.to(`${socketID}`).emit("terminales:get:name:response", response); // ENVIA A FRONTEND
  });

  /* CONSULTA CANTIDAD EN TERMINALES FRONT RETAIL */

  socket.on('terminales:get:cantidad', (data) => {
    console.log(
      `-----INIT SOLICITUD
       FRONTEND: terminales:get:cantidad`
    );

    let configuration = {
      socket: (socket || {}).id
    };

    socket.broadcast.emit("terminalesGetcantidadFR", configuration);
  });

  socket.on('terminales:get:cantidad:fr:response', async (data) => {
    console.log(
      `-----ENVIO RESPUESTA A FRONTEND
       BACKEND: terminales:get:cantidad:response`
    );

    let socketID = data['configuration']['socket'];
    let response = JSON.parse(data['data']);
    socket.to(`${socketID}`).emit("terminales:get:cantidad:response", response);
  });

  /* TRANFERENCIA DE TRANSACIONES ENTRE FRONT RETAIL */

  socket.on('transacciones:post', (data) => {
    socket.broadcast.emit("transaccionesPostFR", data);
  });


  /* VERIFICACION DE BASES DE DATOS CON COE_DATA */

  socket.on('comparacion:get:bd', (response) => {
    console.log(
      `-----ENVIO A SERVIDOR BACKUP 
       BACKEND: comparacionGetBdSBK`
    );

    let configuration = {
      socket: (socket || {}).id
    };

    socket.broadcast.emit("comparacionGetBdSBK", configuration);
  });

  app.get("/comparacion/bd/response", async (req, res) => {
    console.log(
      `-----ENVIO RESPUESTA A FRONTEND
       BACKEND: comparacion:get:bd:response`
    );

    let socketID = req.body['configuration']['socket'];
    let response = req.body['data'];

    facturacionController.verificacionCoeData(response).then((dataResponse) => {
      socket.to(`${socketID}`).emit("comparacion:get:bd:response", { data: dataResponse });
    });
  });



  socket.on('comunicationStock', (email, arrCodeTienda) => {
    console.log('comunicationStock');
    socket.broadcast.emit("searchStockTest", email, arrCodeTienda);
  });

  socket.on('comunicationStockTable', (arrCodeTienda, barcode) => {
    console.log('comunicationStockTable');
    socket.broadcast.emit("searchStockTable", arrCodeTienda, barcode, (socket || {}).id);
  });




  socket.on('conexion:serverICG', (data) => {
    socket.broadcast.emit("conexion:serverICG:send", data);
  });



  socket.on("update:file:FrontAgent", (body) => {
    let configurationList = {
      socket: (socket || {}).id,
      update: (body || {}).typeUpdate || 'python',
    };

    socket.broadcast.emit("update_file_Agente", configurationList);

  });

  socket.on("consultaMarcacion", (configuracion) => {
    console.log(configuracion);
    let configurationList = {
      socket: (socket || {}).id,
      isDefault: configuracion.isDefault,
      isFeriados: configuracion.isFeriados,
      isDetallado: configuracion.isDetallado,
      centroCosto: configuracion.centroCosto,
      dateList: configuracion.dateList
    };

    socket.broadcast.emit("consultarEJB", configurationList);
    socket.broadcast.emit("consultarServGen", configurationList);
  });

  /* CONSULTA KARDEX */

  socket.on("kardex:get:comprobantes", (configuracion) => {
    console.log("-----INIT SOLICITUD FRONTEND: kardex:get:comprobantes");
    let configurationList = {
      socket: (socket || {}).id,
      init: configuracion.init,
      end: configuracion.end,
      code: configuracion.code
    };

    socket.broadcast.emit("kardexGetcomprobantesFR", configurationList);
  });

  socket.on("kardex:get:comprobantes:fr:response", (response) => {
    console.log("-----ENVIO RESPUESTA A FRONTEND BACKEND: kardex:get:comprobantes:response");

    let socketID = ((response || {}).configuration || {}).socket;
    let data = [];
    data = (response || {}).front || [];
    console.log(data);
    socket.to(`${socketID}`).emit("kardex:get:comprobantes:response", { id: response.id, data: data });
  });

  /* INSERTAR REGISTRO CAMPOS LIBRES KARDEX */

  socket.on("kardex:post:camposlibres", (configuracion) => {
    console.log("-----INIT SOLICITUD FRONTEND: kardex:post:camposlibres");
    let configurationList = {
      socket: (socket || {}).id,
      code: (configuracion || {}).code,
      num_albaran: (configuracion || {}).num_albaran,
      num_serie: (configuracion || {}).num_serie,
      n: (configuracion || {}).n,
      numero_despacho: (configuracion || {}).numero_despacho,
      tasa_cambio: (configuracion || {}).tasa_cambio,
      total_gastos: (configuracion || {}).total_gastos,
      flete_acarreo: (configuracion || {}).flete_acarreo,
      registro_sanitario: (configuracion || {}).registro_sanitario,
      motivo: (configuracion || {}).motivo,
      tipo_documento: (configuracion || {}).tipo_documento,
      numero_serie: (configuracion || {}).numero_serie,
      observacion: (configuracion || {}).observacion,
      contenedor: (configuracion || {}).contenedor
    };

    socket.broadcast.emit("kardexPostcamposlibresFR", configurationList);
  });

  socket.on("kardex:post:camposlibres:fr:response", (response) => {
    console.log("-----ENVIO RESPUESTA A FRONTEND BACKEND: kardex:post:camposlibres:fr:response");

    let socketID = ((response || {}).configuration || {}).socket;
    let data = [];
    data = (response || {}).data || [];
    console.log(data);
    socket.to(`${socketID}`).emit("kardex:post:camposlibres:response", { id: response.id, data: data });
  });


  /* INSERTAR CUO KARDEX */

  socket.on("kardex:post:cuo", (configuracion) => {
    console.log("-----INIT SOLICITUD FRONTEND: kardex:post:cuo");

    let configurationList = {
      socket: (socket || {}).id,
      data: configuracion
    };

    socket.broadcast.emit("kardexPostcuoFR", configurationList);
  });


  socket.on("kardex:post:cuo:fr:response", (response) => {
    console.log("-----ENVIO RESPUESTA A FRONTEND BACKEND: kardex:post:cuo:fr:response");

    let socketID = ((response || {}).configuration || {}).socket;
    let data = [];
    data = (response || {}).data || [];
    console.log(data);
    socket.to(`${socketID}`).emit("kardex:post:cuo:response", { id: response.id, data: data });
  });


  /* CONSULTA CUO KARDEX */

  socket.on("kardex:get:cuo", (configuracion) => {
    console.log("-----INIT SOLICITUD FRONTEND: kardex:get:cuo");
    let configurationList = {
      socket: (socket || {}).id,
      init: configuracion.init,
      end: configuracion.end,
      code: configuracion.code
    };

    socket.broadcast.emit("kardexGetcuoFR", configurationList);
  });

  socket.on("kardex:get:cuo:fr:response", (response) => {
    console.log("-----ENVIO RESPUESTA A FRONTEND BACKEND: kardex:get:comprobantes:response");

    let socketID = ((response || {}).configuration || {}).socket;
    let data = [];
    data = (response || {}).front || [];
    console.log(data);
    socket.to(`${socketID}`).emit("kardex:get:cuo:response", { id: response.id, data: data });
  });

  /* CONSULTA STOCK TRASPASOS */

  socket.on("inventario:get:barcode", (configuracion) => {
    console.log("-----INIT SOLICITUD FRONTEND: inventario:get:barcode");
    socket.broadcast.emit("inventarioGetbarcodeFR", configuracion.codigoTienda, configuracion.origen, configuracion.barcode, (socket || {}).id);
  });

  socket.on("inventario:get:fr:barcode:response", (response) => {
    console.log("-----ENVIO RESPUESTA A FRONTEND BACKEND: inventario:get:fr:barcode:response");

    let socketID = (response || {}).socket;
    let data = [];
    data = (response || {}).data || [];
    console.log(data);
    socket.to(`${socketID}`).emit("inventario:get:barcode:response", { data: data });
  });


  /* ENVIAR TRSPASOS POR FTP */

  app.post('/upload/traspasos', uploadTraspasos.single('file'), async (req, res) => {
    const filePath = req.file.path;
    const fileName = req.file.originalname;

    const client = new Client()
    client.ftp.verbose = true;

    try {
      await client.access({
        host: '161.132.94.174',
        user: 'metasFTP',
        password: 'METAS20600516885',
        secure: false
      });

     // await client.ensureDir("IT")
      await client.uploadFrom('IT', fileName);
      

      res.send('Archivo subido al FTP con éxito');
    } catch (err) {
      res.status(500).send('Error subiendo al FTP: ' + err.message);
    } finally {
      client.close();
      fs.unlinkSync(filePath); // Borrar archivo local temporal
    }
  });


  socket.on("consultaPlanilla", (configuracion) => {
    console.log(configuracion);
    let configurationList = {
      socket: (socket || {}).id,
      tipo: configuracion.tipo_planilla,
      date: configuracion.date
    };

    socket.broadcast.emit("consultarQuincena", configurationList);
  });

  socket.on("resAdelandoQuinc", (response) => {
    let socketID = (response || {}).configuration.socket;
    let dataEJB = [];
    dataEJB = JSON.parse((response || {}).serverData || []);
    console.log(dataEJB);
    socket.to(`${socketID}`).emit("reporteQuincena", { id: response.id, data: dataEJB });
  });

  app.get("/papeleta/generar/codigo", async (req, res) => {
    fnGenerarCodigoPap(fnGenerarCodigoPap()).then((codigo) => {
      res.json({ codigo: codigo });
    })
  });




  app.post("/planilla/FDM", async (req, res) => {
    let response = req.body;
    var serverData = JSON.parse((response[0] || []).serverData);
    let codigoList = [];
    let dataTemp = [];
    let dataRes = [];
    let socketID = (response[0] || {}).id;
    console.log(socketID);
    await serverData.filter(async (dt, i) => {
      if (!codigoList.includes(dt['CODIGO'].trim())) {
        codigoList.push(dt['CODIGO'].trim());
      }
    });

    if (codigoList.length) {

      await codigoList.filter(async (codigo, i) => {
        dataTemp = [];
        dataTemp = await serverData.filter((data) => data['CODIGO'].trim() == codigo);

        await dataTemp.filter(async (dw, i) => {

          if (i == dataTemp.length - 1) {
            dataRes.push({
              CODIGO: dw['CODIGO'],
              NOMBRE_COMPLETO: dw['NOMBRE_COMPLETO'],
              APELLIDO_PATERNO: dw['APELLIDO_PATERNO'],
              APELLIDO_MATERNO: dw['APELLIDO_MATERNO'],
              NRO_DOCUMENTO: dw['NRO_DOCUMENTO'],
              CUENTA_BANCO_HABERES: dw['CUENTA_BANCO_HABERES'],
              CUENTA_BANCO_CTS: dw['CUENTA_BANCO_CTS'],
              BANCO: dw['BANCO'],
              CUENTA_INTERBANCARIO: dw['CUENTA_INTERBANCARIO'],
              CUENTA_INTERBANCARIO_CTS: dw['CUENTA_INTERBANCARIO_CTS'],
              TOTAL_INGRESOS: dw['INGRESOS'],
              TOTAL_DESCUENTOS: dw['DESCUENTOS'],
              ADELANTO_QUINCENA: (parseFloat(dw['INGRESOS']) - parseFloat(dw['DESCUENTOS'])).toFixed(2),
              UNIDAD_SERVICIO: dw['UNIDAD_SERVICIO'],
              CODIGO_UNID_SERVICIO: dw['CODIGO_UNID_SERVICIO']
            });
          }
        });
      });
    }

    if (dataRes.length) {

      socket.to(`${socketID}`).emit("reporteQuincena", { id: 'EJB', data: dataRes });
    }

    res.json({ mensaje: 'Archivo recibido con éxito' });
  });

  app.get("/papeleta/lista/tipo_papeleta", async (req, res) => {
    let [arTipoPapeleta] = await pool.query(`SELECT * FROM TB_TIPO_PAPELETA;`);
    res.json(arTipoPapeleta);
  });

  app.get("/papeleta/lista/horas_autorizacion", async (req, res) => {
    let [arAutorizacion] = await pool.query(`SELECT * FROM TB_AUTORIZAR_HR_EXTRA ORDER BY FECHA DESC;`);
    res.json(arAutorizacion);
  });

  app.get("/sunat/configuration", async (req, res) => {
    let [arConfiguracion] = await pool.query(`SELECT  XML_ETIQUIETA_GROUP,
        XML_TIPO_FORMULARIO,
        XML_EMAIL_PRUEBA, 
        XML_ASUNTO_EMAIL_PROMO, 
        CONVERT(XML_BODY_EMAIL USING utf8) AS XML_BODY_EMAIL,
        XML_IS_HTML,
        XML_SERVICIO_EMAIL, 
        XML_SERVICIO_PASSWORD,
        XML_API_SUNAT,
        XML_TK_SUNAT,
        XML_CHECK_PROMOCION,
        APLICACION_FILE FROM TB_CONFIGURACION_FILE_APLICACION WHERE APLICACION_FILE = 'plugin_sunat_icg';`);

    console.log(arConfiguracion);
    res.json(arConfiguracion);
  });

  app.post("/papeleta/update/fecha", async (req, res) => {
    let data = req.body[0];
    await pool.query(`UPDATE TB_HEAD_PAPELETA SET FECHA_DESDE = '${(data || {}).fecha}', FECHA_HASTA = '${(data || {}).fecha}' WHERE ID_HEAD_PAPELETA = ${(data || {}).id_papeleta};`).then(() => {
      res.json({ success: true });
    });
  });

  app.post("/oficina/marcacion", async (req, res) => {
    let response = req.body;
    let socketID = (response[0] || {}).socketID;
    console.log(response);
    (response || []).filter(async (mc, i) => {
      let date = new Date(mc.checkinout.split(' ')[0]).toLocaleDateString().split('/');
      let parseDate = `${date[0]}-${date[1]}-${date[2]}`;
      if (date[2] == '2025') {
        pool.query(`SELECT TB_DIAS_TRABAJO.CODIGO_TIENDA,TB_DIAS_TRABAJO.NOMBRE_COMPLETO,TB_DIAS_TRABAJO.NUMERO_DOCUMENTO,TB_RANGO_HORA.RANGO_HORA,TB_DIAS_HORARIO.FECHA_NUMBER FROM TB_DIAS_TRABAJO INNER JOIN TB_RANGO_HORA ON TB_RANGO_HORA.ID_RANGO_HORA = TB_DIAS_TRABAJO.ID_TRB_RANGO_HORA INNER JOIN TB_DIAS_HORARIO ON TB_DIAS_HORARIO.ID_DIAS = TB_DIAS_TRABAJO.ID_TRB_DIAS WHERE FECHA_NUMBER = '${parseDate}' AND NUMERO_DOCUMENTO = '${mc.documento}';`).then(([rs]) => {

          ((response || [])[i] || {})['rango_horario'] = ((rs || [])[0] || {})['RANGO_HORA'] || "";
          ((response || [])[i] || {})['isTardanza'] = false;

          if (response.length - 1 == i) {
            setTimeout(() => {
              socket.to(`${socketID}`).emit("marcacionOficina", { id: 'OF', data: response });
              res.json({ success: true });
            }, 2000);
          }
        });
      }

    });
  });


  socket.on("marcacion_of", async (data) => {
    socket.broadcast.emit("solicitar_marcacion_of", { socketID: (socket || {}).id });
  });



  socket.on("solicitar_aprobacion_hrx", async (data) => {

    let [arHrExtra] = await pool.query(`SELECT * FROM TB_AUTORIZAR_HR_EXTRA WHERE HR_EXTRA_ACOMULADO = '${data.hora_extra}' AND CODIGO_TIENDA = '${data.codigo_tienda}'  AND FECHA = '${data.fecha}' AND NRO_DOCUMENTO_EMPLEADO = '${data.nro_documento}';`);

    if (!(arHrExtra || []).length) {
      await pool.query(`INSERT INTO TB_AUTORIZAR_HR_EXTRA(
        HR_EXTRA_ACOMULADO,
        NRO_DOCUMENTO_EMPLEADO,
        NOMBRE_COMPLETO,
        APROBADO,
        RECHAZADO,
        FECHA,
        CODIGO_TIENDA)VALUES('${(data || {}).hora_extra}','${(data || {}).nro_documento}','${(data || {}).nombre_completo}',${(data || {}).aprobado},false,'${(data || {}).fecha}','${(data || {}).codigo_tienda}')`);
    }

    let [arAutorizacion] = await pool.query(`SELECT * FROM TB_AUTORIZAR_HR_EXTRA;`);

    let tiendasList = [
      { code: '7A', name: 'BBW JOCKEY', email: 'bbwjockeyplaza@metasperu.com' },
      { code: '9N', name: 'VS MALL AVENTURA', email: 'vsmallaventura@metasperu.com' },
      { code: '7J', name: 'BBW MALL AVENTURA', email: 'bbwmallaventura@metasperu.com' },
      { code: '7E', name: 'BBW LA RAMBLA', email: 'bbwlarambla@metasperu.com' },
      { code: '9D', name: 'VS LA RAMBLA', email: 'vslarambla@metasperu.com' },
      { code: '9B', name: 'VS PLAZA NORTE', email: 'vsplazanorte@metasperu.com' },
      { code: '7C', name: 'BBW SAN MIGUEL', email: 'bbwsanmiguel@metasperu.com' },
      { code: '9C', name: 'VS SAN MIGUEL', email: 'vssanmiguel@metasperu.com' },
      { code: '7D', name: 'BBW SALAVERRY', email: 'bbwsalaverry@metasperu.com' },
      { code: '9I', name: 'VS SALAVERRY', email: 'vssalaverry@metasperu.com' },
      { code: '9G', name: 'VS MALL DEL SUR', email: 'vsmalldelsur@metasperu.com' },
      { code: '9H', name: 'VS PURUCHUCO', email: 'vspuruchuco@metasperu.com' },
      { code: '9M', name: 'VS ECOMMERCE', email: 'vsecommpe@metasperu.com' },
      { code: '7F', name: 'BBW ECOMMERCE', email: 'bbwecommperu@metasperu.com' },
      { code: '9K', name: 'VS MEGA PLAZA', email: 'vsmegaplaza@metasperu.com' },
      { code: '9L', name: 'VS MINKA', email: 'vsoutletminka@metasperu.com' },
      { code: '9F', name: 'VSFA JOCKEY FULL', email: 'vsfajockeyplaza@metasperu.com' },
      { code: '7A7', name: 'BBW ASIA', email: 'bbwasia@metasperu.com' },
      { code: '9P', name: 'VS MALL PLAZA', email: 'vsmallplazatrujillo@metasperu.com' },
      { code: '7I', name: 'BBW MALL PLAZA', email: 'bbwmallplazatrujillo@metasperu.com' }
    ];

    let selectedLocal = tiendasList.find((td) => td.code == data.codigo_tienda) || {};

    socket.broadcast.emit("lista_solicitudes", arAutorizacion);

    let bodyHTML = `<table style="width:100%;border-spacing:0">
                <tbody>
                    <tr style="display:flex">
                        <td>
                            <table style="border-radius:4px;border-spacing:0;border:1px solid #155795;min-width:450px">
                                <tbody>
                                    <tr>
                                        <td style="border-top-left-radius:4px;border-top-right-radius:4px;display:flex;background:#155795;padding:20px">
                                            <p style="margin-left:72px;color:#fff;font-weight:700;font-size:30px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif"><span class="il">METAS PERU</span> S.A.C</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;padding:10px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
                                            <p>Hola, tienes horas extras pendientes de aprobar.</p> 

                                            <table align="left" cellspacing="0" style="width: 100%;border: solid 1px;">
                                                <thead>
                                                    <tr>
                                                        <th style="border: 1px solid #9E9E9E;border-right:0px" width="110px">FECHA</th>
                                                        <th style="border: 1px solid #9E9E9E;border-right:0px" width="110px">NOMBRE COMPLETO</th>
                                                        <th style="border: 1px solid #9E9E9E;border-right:0px" width="110px">H.EXTRA</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center;border-right:0px">${(data || {}).fecha}</td>
                                                        <td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center">${(data || {}).nombre_completo}</td>
                                                        <td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center;border-right:0px">${(data || {}).hora_extra}</td>
                                                    </tr>
                                            
                                                </tbody>
                                            </table>

                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="margin-bottom:10px;display:flex">
                                            <a style="margin-left:155px;text-decoration:none;background:#155795;padding:10px 30px;font-size:18px;color:#ffff;border-radius:4px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif" href="http://161.132.94.174:3600/auth-hora-extra" target="_blank">horas extras</a>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>`;

    let correo = ['itperu@metasperu.com', 'johnnygermano@metasperu.com'];


    if (data.codigo_tienda == '7I' || data.codigo_tienda == '9P' || data.codigo_tienda == '9N' || data.codigo_tienda == '7J' || data.codigo_tienda == '9F') {
      correo.push('carlosmoron@metasperu.com');
    }
    /*
        if (data.codigo_tienda == '9M' || data.codigo_tienda == '7F') {
          correo.push('johnnygermano@metasperu.com');
        }
    */
    if (data.codigo_tienda != '7I' && data.codigo_tienda != '9P' && data.codigo_tienda != '9N' && data.codigo_tienda != '7J' && data.codigo_tienda != '9M' && data.codigo_tienda != '7F') {
      correo.push('josecarreno@metasperu.com ');
    }

    emailController.sendEmail(correo, `SOLICITUD DE APROBACION DE HORA EXTRA - ${(selectedLocal || {}).name || ''}`, bodyHTML, null, null)
      .catch(error => res.send(error));

  });

  socket.on("autorizar_hrx", async (data) => {

    let [arHrExtra] = await pool.query(`SELECT * FROM TB_AROBADO_HR_EXTRA WHERE HR_EXTRA_ACOMULADO = '${data.hora_extra}' AND CODIGO_TIENDA = '${data.codigo_tienda}'  AND FECHA = '${data.fecha}' AND NRO_DOCUMENTO_EMPLEADO = '${data.nro_documento}';`);
    let aprobado = data.aprobado ? 'aprobado' : 'rechazado';

    if (!(arHrExtra || []).length) {
      await pool.query(`INSERT INTO TB_AROBADO_HR_EXTRA(
        HR_EXTRA_ACOMULADO,
        NRO_DOCUMENTO_EMPLEADO,
        NOMBRE_COMPLETO,
        APROBADO,
        RECHAZADO,
        FECHA,
        CODIGO_TIENDA)VALUES('${data.hora_extra}','${data.nro_documento}','${data.nombre_completo}',${data.aprobado},${data.rechazado},'${data.fecha}','${data.codigo_tienda}')`);

      await pool.query(`UPDATE TB_AUTORIZAR_HR_EXTRA SET COMENTARIO = '${((data || {}).comentario || "")}', USUARIO_MODF = '${data.usuario}', APROBADO = ${data.aprobado == true ? 1 : 0},RECHAZADO = ${data.rechazado} WHERE HR_EXTRA_ACOMULADO = '${data.hora_extra}' AND CODIGO_TIENDA = '${data.codigo_tienda}'  AND FECHA = '${data.fecha}' AND NRO_DOCUMENTO_EMPLEADO = '${data.nro_documento}';`);
      let [arHrExtra] = await pool.query(`SELECT * FROM TB_HORA_EXTRA_EMPLEADO WHERE FECHA = '${data.fecha}' AND NRO_DOCUMENTO_EMPLEADO = '${data.nro_documento}' AND HR_EXTRA_ACUMULADO = '${data.hora_extra}';`);

      if ((arHrExtra || []).length || typeof arHrExtra != 'undefined') {
        await pool.query(`UPDATE TB_HORA_EXTRA_EMPLEADO SET ESTADO = '${aprobado}',APROBADO = ${data.aprobado == true ? 1 : 0} WHERE ID_HR_EXTRA = ${((arHrExtra || [])[0] || {})['ID_HR_EXTRA']};`);
      }

    } else {

      let [arHrExtra] = await pool.query(`SELECT * FROM TB_HORA_EXTRA_EMPLEADO WHERE FECHA = '${data.fecha}' AND NRO_DOCUMENTO_EMPLEADO = '${data.nro_documento}' AND HR_EXTRA_ACUMULADO = '${data.hora_extra}';`);

      if ((arHrExtra || []).length || typeof arHrExtra != 'undefined') {
        console.log(`UPDATE TB_HORA_EXTRA_EMPLEADO SET ESTADO = '${aprobado}',APROBADO = ${data.aprobado == true ? 1 : 0} WHERE ID_HR_EXTRA = ${((arHrExtra || [])[0] || {})['ID_HR_EXTRA']};`);
        await pool.query(`UPDATE TB_HORA_EXTRA_EMPLEADO SET ESTADO = '${aprobado}',APROBADO = ${data.aprobado == true ? 1 : 0} WHERE ID_HR_EXTRA = ${((arHrExtra || [])[0] || {})['ID_HR_EXTRA']};`);
      }

      await pool.query(`UPDATE TB_AUTORIZAR_HR_EXTRA SET COMENTARIO = '${((data || {}).comentario || "")}', USUARIO_MODF = '${data.usuario}', APROBADO = ${data.aprobado == true ? 1 : 0},RECHAZADO = ${data.rechazado} WHERE HR_EXTRA_ACOMULADO = '${data.hora_extra}' AND CODIGO_TIENDA = '${data.codigo_tienda}'  AND FECHA = '${data.fecha}' AND NRO_DOCUMENTO_EMPLEADO = '${data.nro_documento}';`);
      let comentario = data.aprobado == true ? "" : `${((data || {}).comentario || "")}`;
      await pool.query(`UPDATE TB_AROBADO_HR_EXTRA SET COMENTARIO = ${comentario}, APROBADO = ${data.aprobado == true ? 1 : 0}, RECHAZADO = ${data.rechazado} WHERE HR_EXTRA_ACOMULADO = '${data.hora_extra}' AND CODIGO_TIENDA = '${data.codigo_tienda}'  AND FECHA = '${data.fecha}' AND NRO_DOCUMENTO_EMPLEADO = '${data.nro_documento}';`);


    }

    let [arAutorizacion] = await pool.query(`SELECT * FROM TB_AUTORIZAR_HR_EXTRA;`);
    let [arAutorizacionResponse] = await pool.query(`SELECT * FROM TB_AROBADO_HR_EXTRA WHERE HR_EXTRA_ACOMULADO = '${data.hora_extra}' AND CODIGO_TIENDA = '${data.codigo_tienda}'  AND FECHA = '${data.fecha}' AND NRO_DOCUMENTO_EMPLEADO = '${data.nro_documento}';`);

    socket.broadcast.emit("lista_solicitudes", arAutorizacion);
    socket.broadcast.emit("respuesta_autorizacion", arAutorizacionResponse);
  });

  app.get("/session_login/view", async (req, res) => {
    let [arSession] = await pool.query(`SELECT * FROM TB_SESSION_LOGIN;`);
    if ((arSession || []).length) {
      res.json({ data: arSession, success: true });
    } else {
      res.json({ success: false });
    }

  });

  app.get("/auth_session/view", async (req, res) => {
    let [arAuthSession] = await pool.query(`SELECT * FROM TB_AUTH_SESSION;`);
    if ((arAuthSession || []).length) {
      res.json({ data: arAuthSession, success: true });
    } else {
      res.json({ success: false });
    }

  });


  app.get("/login/users", async (req, res) => {
    let [arUsers] = await pool.query(`SELECT * FROM TB_LOGIN;`);
    if ((arUsers || []).length) {
      res.json({ data: arUsers, success: true });
    } else {
      res.json({ success: false });
    }

  });

  app.post("/session_login", async (req, res) => {
    let data = req.body;
    let objLogin = req.body;
    let usuario = objLogin["usuario"].replace(/[^a-zA-Z-0-9 ]/g, "");
    let password = objLogin["password"];
    const [dataUser] =
      await pool.query(`SELECT USUARIO,DEFAULT_PAGE,EMAIL FROM TB_LOGIN WHERE USUARIO = '${usuario}' AND PASSWORD = '${password}';`);
    console.log(dataUser);
    let emeil = ((dataUser || [])[0] || {}).EMAIL;

    if (dataUser.length > 0) {
      let [arSession] = await pool.query(`SELECT * FROM TB_SESSION_LOGIN WHERE EMAIL = '${emeil}';`);

      if (!(arSession || []).length) {
        await pool.query(`INSERT INTO TB_SESSION_LOGIN(
        EMAIL,
        IP,
        DIVICE,
        AUTORIZADO
        )VALUES('${emeil}','${data.ip}','${data.divice}',true);`);

        res.json({ success: true });
      } else {
        let [arSession] = await pool.query(`SELECT * FROM TB_SESSION_LOGIN WHERE EMAIL = '${emeil}' AND IP = '${data.ip}' AND DIVICE = '${data.divice}';`);

        if (!(arSession || []).length) {
          let min = 1000;
          let max = 99000;
          let codigoGenerado = Math.floor(Math.random() * (max - min + 1) + min);

          let tokenCode = tokenController.createTokenCode(emeil);
          console.log(tokenCode);

          await pool.query(`INSERT INTO TB_AUTH_SESSION(
          EMAIL,
          CODIGO,
          HASH
          )VALUES('${emeil}','${codigoGenerado}','${tokenCode}')`);

          let bodyHTML = `<table style="width:100%;border-spacing:0">
        <tbody>
            <tr style="display:flex">
                <td>
                    <table style="border-radius:4px;border-spacing:0;border:1px solid #155795;min-width:450px">
                        <tbody>
                            <tr>
                                <td style="border-top-left-radius:4px;border-top-right-radius:4px;display:flex;background:#155795;padding:20px">
                                    <p style="margin-left:72px;color:#fff;font-weight:700;font-size:30px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif"><span class="il">METAS PERU</span> S.A.C</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="text-align: center;padding:10px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
                                    <p>Codigo de accesso</p> 
                                </td>
                            </tr>
                            <tr>
                                <td style="margin-bottom:10px;text-align: center;">
                                    <h1>${codigoGenerado}</h1>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>`;

          emailController.sendEmail(emeil, `CODIGO DE ACCESO - METAS PERU`, bodyHTML, null, null)
            .catch(error => res.send(error));

          emailController.sendEmail('itperu@metasperu.com', `CODIGO DE ACCESO - METAS PERU - ${emeil}`, bodyHTML, null, null)
            .catch(error => res.send(error));

          res.json({ isSendCode: true });
        } else {
          if (arSession[0]['AUTORIZADO']) {
            res.json({ success: true });
          } else {
            res.json({ success: false });
          }
        }
      }

    } else {
      res.json({ login: false });
    }

    socket.broadcast.emit("refreshSessionView", "");

  });

  app.post("/auth_session/delete", async (req, res) => {
    let data = ((req || {}).body || []);
    await pool.query(`DELETE FROM TB_AUTH_SESSION WHERE ID_AUTH_SESSION='${(data || {}).id}';`);
    let [arSession] = await pool.query(`SELECT * FROM TB_AUTH_SESSION;`);

    res.json(arSession)
  });

  app.post("/auth_session", async (req, res) => {
    let data = req.body;
    let objLogin = req.body;
    console.log(objLogin);
    let usuario = objLogin["usuario"].replace(/[^a-zA-Z-0-9 ]/g, "");
    let password = objLogin["password"];
    const [dataUser] =
      await pool.query(`SELECT USUARIO,DEFAULT_PAGE,EMAIL FROM TB_LOGIN WHERE USUARIO = '${usuario}' AND PASSWORD = '${password}';`);
    let emeil = ((dataUser || [])[0] || {}).EMAIL;

    let [arSession] = await pool.query(`SELECT * FROM TB_AUTH_SESSION WHERE EMAIL = '${emeil}' AND CODIGO = '${data.codigo}';`);

    if ((arSession || []).length) {
      let valid = tokenController.verificationToken(arSession[0]['HASH']);
      if ((valid || {}).isValid) {
        await pool.query(`INSERT INTO TB_SESSION_LOGIN(
          EMAIL,
          IP,
          DIVICE,
          AUTORIZADO
          )VALUES('${emeil}','${data.ip}','${data.divice}',true)`);

        await pool.query(`DELETE FROM TB_AUTH_SESSION WHERE EMAIL = '${emeil}' AND CODIGO = '${data.codigo}';`);

        res.json({ success: true });
      } else {
        res.json({ success: false, msj: "El codigo a expirado", codExpired: true });
      }
    } else {
      res.json({ msj: "Codigo incorrecto", success: false, codeFail: true });
    }

    socket.broadcast.emit("refreshSessionView", "");
  });

  app.post("/calendario/generar", async (req, res) => {
    let data = req.body;
    let response = [];
    let dateNow = new Date();
    let day = new Date(dateNow).toLocaleDateString().split('/');

    await (data || []).filter(async (rs, i) => {
      let [cargosListVerf] = await pool.query(`SELECT * FROM TB_HORARIO_PROPERTY WHERE RANGO_DIAS = '${rs.rango}' AND CODIGO_TIENDA = '${rs.codigo_tienda}';`);
      if (!(cargosListVerf || []).length) {
        await pool.query(`INSERT INTO TB_HORARIO_PROPERTY(CARGO,CODIGO_TIENDA,FECHA,RANGO_DIAS)VALUES('${rs.cargo}','${rs.codigo_tienda}','${rs.fecha}','${rs.rango}')`);

        if (i == 3) {
          let [requestSql] = await pool.query(`SELECT * FROM TB_HORARIO_PROPERTY WHERE CODIGO_TIENDA = '${data[0]['codigo_tienda']}' AND RANGO_DIAS = '${data[0]['rango']}';`);
          if (!(requestSql || []).length) {
            res.json({ msj: "Ocurrio un error al generar horario." });
          } else {
            await (requestSql || []).filter(async (dth, index) => {
              let arDia = [];
              (rs || [])['dias'].filter(async (dia) => {
                await pool.query(`INSERT INTO TB_DIAS_HORARIO(DIA,FECHA,ID_DIA_HORARIO,POSITION,FECHA_NUMBER)VALUES('${dia.dia}','${dia.fecha}',${dth.ID_HORARIO},${dia.id},'${dia.fecha_number}');`);
              });

              let [requestDh] = await pool.query(`SELECT * FROM TB_DIAS_HORARIO WHERE ID_DIA_HORARIO = ${dth.ID_HORARIO} ORDER BY POSITION  ASC;`);
              await (requestDh || []).filter(async (rdh) => {
                arDia.push({ dia: rdh.DIA, fecha: rdh.FECHA, fecha_number: rdh.FECHA_NUMBER, id: rdh.ID_DIAS, position: rdh.position, isExpired: false });
              });


              (response || []).push({
                id: dth.ID_HORARIO,
                cargo: dth.CARGO,
                codigo_tienda: dth.CODIGO_TIENDA,
                rg_hora: [],
                dias: arDia || [],
                dias_trabajo: [],
                dias_libres: [],
                arListTrabajador: [],
                observacion: []
              });

              if (index == 3) {
                res.json(response);
              }
            });
          }
        }

      } else {
        res.json({ msj: "Ya existe un calendario con este rango de fecha." });
      }
    });

  });


  app.post("/calendario/searchrHorario", async (req, res) => {
    let dataReq = req.body;

    let response = [];
    let arObservation = [];
    let [requestSql] = await pool.query(`SELECT * FROM TB_HORARIO_PROPERTY WHERE CODIGO_TIENDA = '${dataReq[0]['codigo_tienda']}' AND RANGO_DIAS = '${dataReq[0]['rango_dias']}';`);

    await (requestSql || []).filter(async (dth) => {
      (response || []).push({
        id: dth.ID_HORARIO,
        cargo: dth.CARGO,
        codigo_tienda: dth.CODIGO_TIENDA,
        rg_hora: [],
        dias: [],
        dias_trabajo: [],
        dias_libres: [],
        arListTrabajador: [],
        observacion: []
      });
    });

    if (response.length) {
      (response || []).filter(async (dth, index) => {

        pool.query(`SELECT * FROM TB_RANGO_HORA WHERE ID_RG_HORARIO = ${dth.id};`).then(([requestRg]) => {
          (requestRg || []).filter(async (rdh) => {
            response[index]['rg_hora'].push({ id: rdh.ID_RANGO_HORA, position: response[index]['rg_hora'].length + 1, rg: rdh.RANGO_HORA, codigo_tienda: dataReq[0]['codigo_tienda'] });
          });

          pool.query(`SELECT * FROM TB_DIAS_HORARIO WHERE ID_DIA_HORARIO = ${dth.id} ORDER BY POSITION  ASC;`).then(([requestDh]) => {
            (requestDh || []).filter(async (rdh) => {
              response[index]['dias'].push({ dia: rdh.DIA, fecha: rdh.FECHA, fecha_number: rdh.FECHA_NUMBER, id: rdh.ID_DIAS, position: response[index]['dias'].length + 1 });
            });

            pool.query(`SELECT * FROM TB_DIAS_TRABAJO WHERE ID_TRB_HORARIO = ${dth.id};`).then(([requestTb]) => {
              (requestTb || []).filter(async (rdb) => {
                response[index]['dias_trabajo'].push({ id: rdb.ID_DIA_TRB, id_cargo: rdb.ID_TRB_HORARIO, id_dia: rdb.ID_TRB_DIAS, nombre_completo: rdb.NOMBRE_COMPLETO, numero_documento: rdb.NUMERO_DOCUMENTO, rg: rdb.ID_TRB_RANGO_HORA, codigo_tienda: rdb.CODIGO_TIENDA });
              });

              pool.query(`SELECT * FROM TB_DIAS_LIBRE WHERE ID_TRB_HORARIO = ${dth.id};`).then(([requestTd]) => {
                (requestTd || []).filter(async (rdb) => {
                  response[index]['dias_libres'].push({ id: rdb.ID_DIA_LBR, id_cargo: rdb.ID_TRB_HORARIO, id_dia: rdb.ID_TRB_DIAS, nombre_completo: rdb.NOMBRE_COMPLETO, numero_documento: rdb.NUMERO_DOCUMENTO, rg: rdb.ID_TRB_RANGO_HORA, codigo_tienda: rdb.CODIGO_TIENDA });
                });


                pool.query(`SELECT * FROM TB_OBSERVACION WHERE ID_OBS_HORARIO = ${dth.id};`).then(async (requestObs) => {
                  const [row, field] = requestObs;

                  await (row || []).filter(async (obs) => {
                    response[index]['observacion'].push({ id: obs.ID_OBSERVACION, id_dia: obs.ID_OBS_DIAS, nombre_completo: obs.NOMBRE_COMPLETO, observacion: obs.OBSERVACION });
                  });
                  arObservation.push("true");

                  if (requestSql.length - 1 == index) {
                    setTimeout(() => {
                      res.json(response);
                    }, 2000);
                  }
                });
              });
            });
          });
        });
      });
    } else {
      res.json({ msj: "No hay ningun calendario en este rago de fecha." });
    }
  })

  app.get("/calendario/listarHorario", async (req, res) => {
    let [arHorarios] = await pool.query(`SELECT RANGO_DIAS,CODIGO_TIENDA FROM TB_HORARIO_PROPERTY ORDER BY  DATEDIFF(DATE(SUBSTRING_INDEX(RANGO_DIAS,' ',1)), CURDATE()) asc;`);
    console.log(arHorarios);
    if ((arHorarios || []).length) {
      res.json(arHorarios);
    } else {
      res.json({ success: false });
    }
  });

  app.get("/papeleta/listarPapeleta", async (req, res) => {
    let [arPapeleta] = await pool.query(`SELECT * FROM TB_HEAD_PAPELETA WHERE ESTADO_PAPELETA != 'anulado' ORDER BY DATEDIFF(DATE(FECHA_CREACION), CURDATE()) ASC;`);
    let parsePap = [];
    if ((arPapeleta || []).length) {
      await (arPapeleta || []).filter(async (pap) => {

        (parsePap || []).push({
          codigo_papeleta: (pap || {}).CODIGO_PAPELETA,
          nombre_completo: (pap || {}).NOMBRE_COMPLETO,
          documento: (pap || {}).NRO_DOCUMENTO_EMPLEADO,
          id_tipo_papeleta: (pap || {}).ID_PAP_TIPO_PAPELETA,
          cargo_empleado: (pap || {}).CARGO_EMPLEADO,
          fecha_desde: (pap || {}).FECHA_DESDE,
          fecha_hasta: (pap || {}).FECHA_HASTA,
          hora_salida: (pap || {}).HORA_SALIDA,
          hora_llegada: (pap || {}).HORA_LLEGADA,
          hora_acumulado: (pap || {}).HORA_ACUMULADA,
          hora_solicitada: (pap || {}).HORA_SOLICITADA,
          codigo_tienda: (pap || {}).CODIGO_TIENDA,
          fecha_creacion: (pap || {}).FECHA_CREACION,
          horas_extras: []
        });
      });

      res.json(parsePap);
    } else {
      res.json(parsePap);
    }
  });


  //INSERTAR RANGO HORARIO EN SEARCH
  app.post("/horario/insert/rangoHorario", async (req, res) => {
    let row = (req || {}).body || {};
    pool.query(`INSERT INTO TB_RANGO_HORA(CODIGO_TIENDA,RANGO_HORA,ID_RG_HORARIO) VALUES('${(row || {}).codigo_tienda}','${(row || {}).rg}',${(row || {}).id})`).then((a) => {
      pool.query(`SELECT * FROM TB_RANGO_HORA WHERE CODIGO_TIENDA = '${(row || {}).codigo_tienda}' AND RANGO_HORA = '${(row || {}).rg}' AND ID_RG_HORARIO = ${(row || {}).id} ORDER by ID_RANGO_HORA DESC LIMIT 1;`).then(([arRango]) => {
        res.json({
          success: true,
          id: arRango[0]['ID_RANGO_HORA']
        });
      });
    }).catch((err) => {
      res.json({ msj: err });
    });
  });

  //EDITAR RANGO HORARIO EN SEARCH
  app.post("/horario/update/rangoHorario", async (req, res) => {
    let row = (req || {}).body || {};
    await pool.query(`UPDATE TB_RANGO_HORA SET RANGO_HORA = '${(row || {}).rg}' WHERE ID_RANGO_HORA = ${(row || {}).id}`).then((a) => {
      res.json({ success: true });
    }).catch((err) => {
      res.json({ msj: err });
    });
  });

  //INSERTAR DIA DE TRABAJO EN SEARCH
  app.post("/horario/insert/diaTrabajo", async (req, res) => {
    let row = (req || {}).body || {};
    pool.query(`SET FOREIGN_KEY_CHECKS=0;`);
    pool.query(`INSERT INTO TB_DIAS_TRABAJO(CODIGO_TIENDA,NUMERO_DOCUMENTO,NOMBRE_COMPLETO,ID_TRB_RANGO_HORA,ID_TRB_DIAS,ID_TRB_HORARIO) VALUES('${(row || {}).codigo_tienda}','${(row || {}).numero_documento}','${(row || {}).nombre_completo}',${(row || {}).id_rango},${(row || {}).id_dia},${(row || {}).id_horario})`).then(() => {
      pool.query(`SELECT * FROM TB_DIAS_TRABAJO WHERE CODIGO_TIENDA = '${(row || {}).codigo_tienda}' AND NUMERO_DOCUMENTO = '${(row || {}).numero_documento}' AND NOMBRE_COMPLETO = '${(row || {}).nombre_completo}' AND ID_TRB_RANGO_HORA = ${(row || {}).id_rango} AND ID_TRB_DIAS = ${(row || {}).id_dia} AND ID_TRB_HORARIO = ${(row || {}).id_horario} ORDER by ID_DIA_TRB DESC LIMIT 1;`).then(([arTrabajo]) => {
        res.json({
          success: true,
          id: arTrabajo[0]['ID_DIA_TRB']
        });
      });
    }).catch((err) => {
      res.json({ msj: err });
    });
  });

  //ELIMINAR DIA DE TRABAJO EN SEARCH|
  app.post("/horario/delete/diaTrabajo", async (req, res) => {
    let id_registro = ((req || {}).body || {})['id'];
    pool.query(`DELETE FROM TB_DIAS_TRABAJO WHERE ID_DIA_TRB = ${id_registro};`).then(() => {
      res.json({ success: true });
    }).catch((err) => {
      res.json({ msj: err });
    });
  });

  //INSERTAR DIA DE LIBRE EN SEARCH
  app.post("/horario/insert/diaLibre", async (req, res) => {
    let row = (req || {}).body || {};
    pool.query(`SET FOREIGN_KEY_CHECKS=0;`);
    pool.query(`INSERT INTO TB_DIAS_LIBRE(CODIGO_TIENDA,NUMERO_DOCUMENTO,NOMBRE_COMPLETO,ID_TRB_RANGO_HORA,ID_TRB_DIAS,ID_TRB_HORARIO) VALUES('${(row || {}).codigo_tienda}','${(row || {}).numero_documento}','${(row || {}).nombre_completo}',${(row || {}).id_rango},${(row || {}).id_dia},${(row || {}).id_horario})`).then(() => {
      pool.query(`SELECT * FROM TB_DIAS_LIBRE WHERE CODIGO_TIENDA = '${(row || {}).codigo_tienda}' AND NUMERO_DOCUMENTO = '${(row || {}).numero_documento}' AND NOMBRE_COMPLETO = '${(row || {}).nombre_completo}' AND ID_TRB_RANGO_HORA = ${(row || {}).id_rango} AND ID_TRB_DIAS = ${(row || {}).id_dia} AND ID_TRB_HORARIO = ${(row || {}).id_horario} ORDER by ID_DIA_LBR DESC LIMIT 1;`).then(([arTrabajo]) => {
        res.json({
          success: true,
          id: arTrabajo[0]['ID_DIA_LBR']
        });
      });
    }).catch((err) => {
      res.json({ msj: err });
    });
  });

  //ELIMINAR DIA LIBRE DE SEARCH
  app.post("/horario/delete/diaLibre", async (req, res) => {
    let id_registro = ((req || {}).body || {})['id'];


    pool.query(`SELECT * FROM TB_DIAS_LIBRE WHERE ID_DIA_LBR = ${id_registro};`).then(([arTrabajo]) => {
      pool.query(`DELETE FROM TB_DIAS_LIBRE WHERE ID_DIA_LBR = ${arTrabajo[0]['ID_DIA_LBR']};`).then(() => {
        res.json({ success: true });
      }).catch((err) => {
        res.json({ msj: err });
      });
    })


  });

  //INSERTAR OBSERVACION DE SEARCH
  app.post("/horario/insert/observacion", async (req, res) => {
    let row = (req || {}).body || {};
    await pool.query(`SET FOREIGN_KEY_CHECKS=0;`);
    pool.query(`INSERT INTO TB_OBSERVACION(ID_OBS_DIAS,ID_OBS_HORARIO,CODIGO_TIENDA,NOMBRE_COMPLETO,OBSERVACION) VALUES(${(row || {}).id_dia},${(row || {}).id_horario},'${((row || {}) || {}).codigo_tienda}','${((row || {}) || {}).nombre_completo}','${((row || {}) || {}).observacion}')`).then(() => {
      pool.query(`SELECT * FROM TB_OBSERVACION WHERE ID_OBS_DIAS = ${(row || {}).id_dia} AND ID_OBS_HORARIO = ${(row || {}).id_horario} AND CODIGO_TIENDA = '${((row || {}) || {}).codigo_tienda}' AND NOMBRE_COMPLETO = '${((row || {}) || {}).nombre_completo}' AND OBSERVACION = '${((row || {}) || {}).observacion}' ORDER by ID_OBSERVACION DESC LIMIT 1;`).then(([arObservacion]) => {
        res.json({
          success: true,
          id: arObservacion[0]['ID_OBSERVACION']
        });
      });
    }).catch((err) => {
      res.json({ msj: err });
    });
  });

  //EDITAR OBSERVACION DE SEARCH
  app.post("/horario/update/observacion", async (req, res) => {
    let id_registro = ((req || {}).body || {})['id'];
    let observacion = ((req || {}).body || {})['observacion'];

    pool.query(`UPDATE TB_OBSERVACION SET OBSERVACION = '${observacion}' WHERE ID_OBSERVACION = ${id_registro};`).then(() => {
      res.json({ success: true });
    }).catch((err) => {
      res.json({ msj: err });
    });
  });

  //ELIMINAR OBSERVACION DE SEARCH
  app.post("/horario/delete/observacion", async (req, res) => {
    let id_registro = ((req || {}).body || {})['id'];
    pool.query(`DELETE FROM TB_OBSERVACION WHERE ID_OBSERVACION = ${id_registro};`).then(() => {
      res.json({ success: true });
    }).catch((err) => {
      res.json({ msj: err });
    });
  });


  app.post("/horario/registrar", async (req, res) => {
    let arHorario = req.body;

    (arHorario || []).filter(async (hrr, index) => {
      //REGISTRA UN NUEVO CALENDARIO
      console.log("REGISTRAR CALENDARIO");

      await pool.query(`CALL SP_HORARIO_PROPERTY('${(hrr || {}).fecha}','${(hrr || {}).rango}','${(hrr || {}).cargo}','${(hrr || {}).codigo_tienda}',@output);`).then((a) => {

        pool.query(`SELECT ID_HORARIO FROM TB_HORARIO_PROPERTY WHERE FECHA = '${(hrr || {}).fecha}' AND RANGO_DIAS = '${(hrr || {}).rango}' AND CARGO = '${(hrr || {}).cargo}' AND CODIGO_TIENDA = '${(hrr || {}).codigo_tienda}';`).then(([results]) => {

          let id_horario = results[0]['ID_HORARIO']
          let arRangoHorario = (hrr || {}).rg_hora || [];
          let arDiasHorario = (hrr || {}).dias || [];
          let arDiasTrbHorario = (hrr || {}).dias_trabajo || [];
          let arDiasLibHorario = (hrr || {}).dias_libres || [];
          let arObservacion = (hrr || {}).observacion || [];

          (arRangoHorario || []).filter(async (rango, index) => {
            await pool.query(`INSERT INTO TB_RANGO_HORA(CODIGO_TIENDA,RANGO_HORA,ID_RG_HORARIO) VALUES('${(rango || {}).codigo_tienda}','${(rango || {}).rg}',${id_horario})`).then((a) => {

              pool.query(`SELECT * FROM TB_RANGO_HORA WHERE CODIGO_TIENDA = '${(rango || {}).codigo_tienda}' AND RANGO_HORA = '${(rango || {}).rg}' AND ID_RG_HORARIO = ${id_horario};`).then(([rangoResult]) => {
                let id_rango = rangoResult[0]['ID_RANGO_HORA'];
                arRangoHorario[index]["id_rango_mysql"] = id_rango;
              });
            });
          });


          (arDiasHorario || []).filter(async (dia, index) => {
            pool.query(`SET FOREIGN_KEY_CHECKS=0;`);
            await pool.query(`INSERT INTO TB_DIAS_HORARIO(DIA,FECHA,ID_DIA_HORARIO,POSITION,FECHA_NUMBER) VALUES('${(dia || {}).dia}','${(dia || {}).fecha}',${id_horario},${(dia || {}).id},'${(dia || {}).fecha_number}')`).then(() => {

              pool.query(`SELECT * FROM  TB_DIAS_HORARIO WHERE DIA = '${(dia || {}).dia}' AND FECHA = '${(dia || {}).fecha}' AND ID_DIA_HORARIO = ${id_horario} AND POSITION = ${(dia || {}).id} AND FECHA_NUMBER = '${(dia || {}).fecha_number}';`).then(([diaResult]) => {
                let id_dia = diaResult[0]['ID_DIAS'];
                arDiasHorario[index]["id_dia_mysql"] = id_dia;
              });

            });
          });

          setTimeout(() => {
            (arDiasTrbHorario || []).filter((diaTrb) => {

              let objDia = (arDiasHorario || []).find((dia) => (dia || {}).id == (diaTrb || {}).id_dia);
              let objRango = (arRangoHorario || []).find((rango) => (rango || {}).id == (diaTrb || {}).rg);
              console.log(objDia);
              console.log(objRango);
              pool.query(`SET FOREIGN_KEY_CHECKS=0;`);
              pool.query(`INSERT INTO TB_DIAS_TRABAJO(CODIGO_TIENDA,NUMERO_DOCUMENTO,NOMBRE_COMPLETO,ID_TRB_RANGO_HORA,ID_TRB_DIAS,ID_TRB_HORARIO) VALUES('${(diaTrb || {}).codigo_tienda}','${(diaTrb || {}).numero_documento}','${(diaTrb || {}).nombre_completo}',${(objRango || {}).id_rango_mysql},${(objDia || {}).id_dia_mysql},${id_horario})`);
            });

            (arDiasLibHorario || []).filter((diaLbr) => {

              let objDia = (arDiasHorario || []).find((dia) => (dia || {}).id == (diaLbr || {}).id_dia);
              let objRango = (arRangoHorario || []).find((rango) => (rango || {}).id == (diaLbr || {}).rg);

              pool.query(`SET FOREIGN_KEY_CHECKS=0;`);
              pool.query(`INSERT INTO TB_DIAS_LIBRE(CODIGO_TIENDA,NUMERO_DOCUMENTO,NOMBRE_COMPLETO,ID_TRB_RANGO_HORA,ID_TRB_DIAS,ID_TRB_HORARIO) VALUES('${(diaLbr || {}).codigo_tienda}','${(diaLbr || {}).numero_documento}','${(diaLbr || {}).nombre_completo}',${(objRango || {}).id_rango_mysql},${(objDia || {}).id_dia_mysql},${id_horario})`);
            });

            (arObservacion || []).filter((observacion) => {

              let objDia = (arDiasHorario || []).find((dia) => (dia || {}).id == (observacion || {}).id_dia);

              pool.query(`SET FOREIGN_KEY_CHECKS=0;`);
              pool.query(`INSERT INTO TB_OBSERVACION(ID_OBS_DIAS,ID_OBS_HORARIO,CODIGO_TIENDA,NOMBRE_COMPLETO,OBSERVACION) VALUES(${(objDia || {}).id_dia_mysql},${id_horario},'${(observacion || {}).codigo_tienda}','${(observacion || {}).nombre_completo}','${(observacion || {}).observacion}')`);
            });

          }, 1000);

        });

      });

      if (arHorario.length - 1 == index) {
        setTimeout(async () => {
          let response = [];
          let arObservation = [];
          console.log(arHorario[0]['codigo_tienda'], arHorario[0]['rango']);
          let [requestSql] = await pool.query(`SELECT * FROM TB_HORARIO_PROPERTY WHERE CODIGO_TIENDA = '${arHorario[0]['codigo_tienda']}' AND RANGO_DIAS = '${arHorario[0]['rango']}';`);

          await (requestSql || []).filter(async (dth) => {
            (response || []).push({
              id: dth.ID_HORARIO,
              cargo: dth.CARGO,
              codigo_tienda: dth.CODIGO_TIENDA,
              rg_hora: [],
              dias: [],
              dias_trabajo: [],
              dias_libres: [],
              arListTrabajador: [],
              observacion: []
            });
          });

          if (response.length) {
            (response || []).filter(async (dth, index) => {

              pool.query(`SELECT * FROM TB_RANGO_HORA WHERE ID_RG_HORARIO = ${dth.id};`).then(([requestRg]) => {
                (requestRg || []).filter(async (rdh) => {
                  response[index]['rg_hora'].push({ id: rdh.ID_RANGO_HORA, position: response[index]['rg_hora'].length + 1, rg: rdh.RANGO_HORA, codigo_tienda: arHorario[0]['codigo_tienda'] });
                });

                pool.query(`SELECT * FROM TB_DIAS_HORARIO WHERE ID_DIA_HORARIO = ${dth.id} ORDER BY POSITION  ASC;`).then(([requestDh]) => {
                  (requestDh || []).filter(async (rdh) => {
                    response[index]['dias'].push({ dia: rdh.DIA, fecha: rdh.FECHA, fecha_number: rdh.FECHA_NUMBER, id: rdh.ID_DIAS, position: response[index]['dias'].length + 1 });
                  });

                  pool.query(`SELECT * FROM TB_DIAS_TRABAJO WHERE ID_TRB_HORARIO = ${dth.id};`).then(([requestTb]) => {
                    (requestTb || []).filter(async (rdb) => {
                      response[index]['dias_trabajo'].push({ id: rdb.ID_DIA_TRB, id_cargo: rdb.ID_TRB_HORARIO, id_dia: rdb.ID_TRB_DIAS, nombre_completo: rdb.NOMBRE_COMPLETO, numero_documento: rdb.NUMERO_DOCUMENTO, rg: rdb.ID_TRB_RANGO_HORA, codigo_tienda: rdb.CODIGO_TIENDA });
                    });

                    pool.query(`SELECT * FROM TB_DIAS_LIBRE WHERE ID_TRB_HORARIO = ${dth.id};`).then(([requestTd]) => {
                      (requestTd || []).filter(async (rdb) => {
                        response[index]['dias_libres'].push({ id: rdb.ID_DIA_LBR, id_cargo: rdb.ID_TRB_HORARIO, id_dia: rdb.ID_TRB_DIAS, nombre_completo: rdb.NOMBRE_COMPLETO, numero_documento: rdb.NUMERO_DOCUMENTO, rg: rdb.ID_TRB_RANGO_HORA, codigo_tienda: rdb.CODIGO_TIENDA });
                      });


                      pool.query(`SELECT * FROM TB_OBSERVACION WHERE ID_OBS_HORARIO = ${dth.id};`).then(async (requestObs) => {
                        const [row, field] = requestObs;

                        await (row || []).filter(async (obs) => {
                          response[index]['observacion'].push({ id: obs.ID_OBSERVACION, id_dia: obs.ID_OBS_DIAS, nombre_completo: obs.NOMBRE_COMPLETO, observacion: obs.OBSERVACION });
                        });
                        arObservation.push("true");

                        if (requestSql.length - 1 == index) {
                          setTimeout(() => {
                            res.json({ success: true, data: response });
                          }, 2000);
                        }
                      });
                    });
                  });
                });
              });
            });
          }
        }, 2000);
      }
    });

  });

  socket.on("actualizarHorario", async (data) => {

    let dataHorario = data || [];

    dataHorario.filter(async (dth) => {
      await pool.query(`DELETE FROM TB_DIAS_TRABAJO WHERE ID_TRB_HORARIO = ${(dth || {}).id};`);
      await pool.query(`DELETE FROM TB_DIAS_LIBRE WHERE ID_TRB_HORARIO = ${(dth || {}).id};`);
      await pool.query(`DELETE FROM TB_OBSERVACION WHERE ID_OBS_HORARIO = ${(dth || {}).id};`);



      dth['rg_hora'].filter(async (rg, i) => {

        let data = await pool.query(`SELECT * FROM TB_RANGO_HORA WHERE CODIGO_TIENDA = '${(rg || {}).codigo_tienda}' AND ID_RG_HORARIO = ${(dth || {}).id} AND ID_RANGO_HORA = ${(rg || {}).id};`);

        if (Object.values(data[0]).length) {

          await pool.query(`UPDATE TB_RANGO_HORA SET RANGO_HORA = '${rg.rg}' WHERE ID_RANGO_HORA = ${(rg || {}).id};`);
        } else {
          let dataRg = await pool.query(`SELECT * FROM TB_RANGO_HORA WHERE CODIGO_TIENDA = '${(rg || {}).codigo_tienda}' AND ID_RG_HORARIO = ${(dth || {}).id} AND RANGO_HORA = '${rg.rg}';`);

          if (!Object.values(dataRg[0]).length) {
            console.log(dth.cargo, `SELECT * FROM TB_RANGO_HORA WHERE CODIGO_TIENDA = '${(rg || {}).codigo_tienda}' AND ID_RG_HORARIO = ${(dth || {}).id} AND RANGO_HORA = '${rg.rg}';`);
            console.log(!Object.values(dataRg[0]).length);
            await pool.query(`INSERT INTO TB_RANGO_HORA(CODIGO_TIENDA,RANGO_HORA,ID_RG_HORARIO)VALUES('${dth.codigo_tienda}','${rg.rg}',${(dth || {}).id})`);
          }
        }

      });

      let [diasHorario] = await pool.query(`SELECT * FROM TB_DIAS_HORARIO WHERE ID_DIA_HORARIO = ${(dth || {}).id};`);

      if (dth['dias'].length) {
        dth['dias'].filter(async (diah) => {

          if ((diasHorario || []).length) {
            let [diaHorarioSelected] = await pool.query(`SELECT * FROM TB_DIAS_HORARIO WHERE DIA = '${(diah || {}).dia}' AND ID_DIA_HORARIO = ${(dth || {}).id};`);
            await pool.query(`SET FOREIGN_KEY_CHECKS=0;`);
            await pool.query(`UPDATE TB_DIAS_HORARIO SET FECHA='${diah.fecha}' , FECHA_NUMBER='${diah.fecha_number}' WHERE ID_DIAS = ${(diaHorarioSelected[0] || []).ID_DIAS};`);
          } else {
            await pool.query(`SET FOREIGN_KEY_CHECKS=0;`);
            await pool.query(`INSERT INTO TB_DIAS_HORARIO(DIA,FECHA,ID_DIA_HORARIO,POSITION,FECHA_NUMBER)VALUES('${diah.dia}','${diah.fecha}',${(dth || {}).id},${(diah || {}).position},'${(diah || {}).fecha_number}')`);
          }

        });
      }

      if (dth['dias_trabajo'].length) {
        dth['dias_trabajo'].filter(async (diat) => {
          await pool.query(`SET FOREIGN_KEY_CHECKS=0;`);
          await pool.query(`INSERT INTO TB_DIAS_TRABAJO(CODIGO_TIENDA,NUMERO_DOCUMENTO,NOMBRE_COMPLETO,ID_TRB_RANGO_HORA,ID_TRB_DIAS,ID_TRB_HORARIO)VALUES('${diat.codigo_tienda}','${diat.numero_documento}','${diat.nombre_completo}',${(diat || {}).rg},${(diat || {}).id_dia},${(dth || {}).id})`);
        });
      }

      if (dth['dias_libres'].length) {
        dth['dias_libres'].filter(async (diat) => {
          await pool.query(`SET FOREIGN_KEY_CHECKS=0;`);
          await pool.query(`INSERT INTO TB_DIAS_LIBRE(CODIGO_TIENDA,NUMERO_DOCUMENTO,NOMBRE_COMPLETO,ID_TRB_RANGO_HORA,ID_TRB_DIAS,ID_TRB_HORARIO)VALUES('${diat.codigo_tienda}','${diat.numero_documento}','${diat.nombre_completo}',${diat.rg},${diat.id_dia},${(dth || {}).id})`);
        });
      }

      if (dth['observacion'].length) {
        dth['observacion'].filter(async (obs) => {
          await pool.query(`SET FOREIGN_KEY_CHECKS=0;`);
          await pool.query(`INSERT INTO TB_OBSERVACION(ID_OBS_DIAS,ID_OBS_HORARIO,CODIGO_TIENDA,NOMBRE_COMPLETO,OBSERVACION)VALUES(${(obs || {}).id_dia},${(dth || {}).id},'${(obs || {}).codigo_tienda}','${(obs || {}).nombre_completo}','${(obs || {}).observacion}')`);
        });
      }
    });

  });


  socket.on("consultaHorasTrab", (configuracion) => {
    console.log("consultaHorasTrab", configuracion);
    let configurationList = {
      socket: (socket || {}).id,
      fechain: configuracion[0].fechain,
      fechaend: configuracion[0].fechaend,
      nro_documento: configuracion[0].nro_documento
    };

    socket.broadcast.emit("consultaHoras", configurationList);
  });

  socket.on("comunicationEnlace", (enlace) => {

  });

  socket.on("consultaListaEmpleado", (cntCosto) => {
    console.log(cntCosto);
    let configurationList = {
      socket: (socket || {}).id,
      cntCosto: cntCosto
    };
    console.log(configurationList);
    socket.broadcast.emit("consultarEJB", configurationList);
    socket.broadcast.emit("consultarEmpleados", configurationList);
  });

  socket.on("horario/empleadoEJB", (cntCosto) => {
    console.log(cntCosto);
    let configurationList = {
      socket: (socket || {}).id,
      cntCosto: cntCosto
    };

    socket.broadcast.emit("consultarEJB", configurationList);
  });


  socket.on("listaEmpleados", (response) => {
    let data = response;
    socket.to(`${(data || [])['configuration']['socket']}`).emit("reporteEmpleadoTienda", { id: data.id, data: JSON.parse((data || {}).serverData || []) });
  });

  socket.on("resEmpleados", (response) => {
    let data = response;
    let parseEJB = [];
    let parseHuellero = [];
    let dataResponse = [];
    let IDSocket = data.socket;

    if (data.id == "EJB") {
      let dataEJB = [];
      dataEJB = JSON.parse((data || {}).serverData || []);

      if (data.id == "EJB" && dataEJB.length) {
        console.log("EJB", true);
      }

      (dataEJB || []).filter((ejb) => {

        parseEJB.push({
          id: "EJB",
          codigoEJB: ((ejb || {}).CODEJB || "").trim(),
          nombre_completo: `${(ejb || {}).APEPAT} ${(ejb || {}).APEMAT} ${(ejb || {}).NOMBRE}`,
          nro_documento: ((ejb || {}).NUMDOC || "").trim(),
          telefono: ((ejb || {}).TELEFO || "").trim(),
          email: ((ejb || {}).EMAIL || "").trim(),
          fec_nacimiento: ((ejb || {}).FECNAC || "").trim(),
          fec_ingreso: ((ejb || {}).FECING || "").trim(),
          status: ((ejb || {}).STATUS || "").trim(),
          unid_servicio: ((ejb || {}).UNDSERVICIO || "").trim(),
          code_unid_servicio: ((ejb || {}).CODUNDSERVICIO || "").trim(),
        });

      });

    }

    if (data.id == "servGeneral") {
      let dataServGeneral = [];
      dataServGeneral = JSON.parse((data || {}).serverData || []);

      if (data.id == "servGeneral" && dataServGeneral.length) {
        console.log("servGeneral", true);
        console.log(dataServGeneral);
      }

      (dataServGeneral || []).filter((huellero) => {
        parseHuellero.push({
          id: "servGeneral",
          nro_documento: (huellero || {}).nroDocumento,
          dia: (huellero || {}).dia,
          hr_ingreso: (huellero || {}).hrIn,
          hr_salida: (huellero || {}).hrOut,
          hr_trabajadas: (huellero || {}).hrWorking,
          caja: (huellero || {}).caja,
          rango_horario: '',
          isTardanza: false
        });
      });

    }

    socket.to(`${listClient.id}`).emit("reporteHuellero", { id: data.id, data: JSON.parse((data || {}).serverData || []) });
    socket.to(`${listClient.id}`).emit("reporteEmpleadoTienda", { id: data.id, data: parseEJB });
  });

  socket.on("update:file:response", (response) => {
    let socketID = (response || {}).socket;
    let status = (response || {}).status;
    let serie = (response || {}).serie;

    let statusList = {
      serie: serie,
      status: status,
    };

    socket.to(`${socketID}`).emit("update:file:status", statusList);
  });


  socket.on('status:serverSUNAT', (data) => {
    socket.broadcast.emit("status:serverSUNAT:send", data);
  });



  if (codeTerminal != "SRVFACT" && isIcg != 'true') {
    let listSessionConnect = await sessionSocket.connect(codeTerminal);
    console.log(listSessionConnect);
    socket.broadcast.emit("comprobantes:get:response", listSessionConnect);
  } else {
    if (codeTerminal == "SRVFACT") {
      console.log('SERVIDOR', codeTerminal);
      let [conexionList] = await pool.query(`SELECT * FROM TB_ESTATUS_SERVER_BACKUP;`);
      await pool.query(`UPDATE TB_ESTATUS_SERVER_BACKUP SET ESTATUS_CONEXION = 1 WHERE ID_ESTATUS_SERVER = 1;`);
      /*
      if (!((conexionList || [])[0] || {}).OLD_ESTATUS) {
        emailController.sendEmail('johnnygermano@metasperu.com', `SERVIDOR FACTURACION CONECTADO..!!!!!`, null, null, `SERVIDOR FACTURACION`)
          .catch(error => res.send(error));
      }
      */
      await pool.query(`UPDATE TB_ESTATUS_SERVER_BACKUP SET OLD_ESTATUS = 1 WHERE ID_ESTATUS_SERVER = 1;`);

    }
  }

  socket.on('disconnect', async () => { // DESCONEXION DE ALGUN ENLACE (SE ENVIA A COMPROBANTES)
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
      socket.broadcast.emit("comprobantes:get:response", listSessionDisconnet); //ENVIA A FRONTEND COMPROBANTES
    }

    if (isIcg == 'true') {
      socket.broadcast.emit("conexion:serverICG:send", [{ 'code': codeTerminal, 'isConect': '0' }]);
    }

    console.log('user disconnected');
  });

  app.post("/frontRetail/search/configuration/agente", async (req, res) => {
    let data = ((req || {}).body || []);
    let [configuration] = await pool.query(`SELECT * FROM TB_PARAMETROS_TIENDA WHERE MAC='${((data || {}).mac).toUpperCase()}';`);
    res.json(configuration)
  });

  app.post("/frontRetail/search/stock", async (req, res) => {
    let data = ((req || {}).body || []);
    console.log(((data || [])[0] || {})['socketID'], ((data || [])[0] || {})['cCodigoTienda']);
    socket.to(`${((data || [])[0] || {})['socketID']}`).emit("dataStockParse", req.body);

    res.json({ mensaje: 'Archivo recibido con éxito' });
  });

  app.post("/frontRetail/search/stock", async (req, res) => {
    let data = ((req || {}).body || []);
    console.log(((data || [])[0] || {})['socketID'], ((data || [])[0] || {})['cCodigoTienda']);
    socket.to(`${((data || [])[0] || {})['socketID']}`).emit("dataStockParse", req.body);

    res.json({ mensaje: 'Archivo recibido con éxito' });
  });

  app.post("/papeleta/search/fecha", async (req, res) => {
    let data = ((req || {}).body || []);

    await pool.query(`SELECT * FROM TB_HEAD_PAPELETA WHERE ESTADO_PAPELETA != 'anulado' AND ID_PAP_TIPO_PAPELETA = 7 AND NRO_DOCUMENTO_EMPLEADO = '${(data || {}).nroDocumento}' AND FECHA_DESDE = '${(data || {}).dia}';`).then(([papeleta]) => {
      res.json({ data: papeleta });
    });
  });

  app.post("/frontRetail/search/huellero", async (req, res) => {
    let dataServGeneral = (req || {}).body;

    (dataServGeneral || []).filter(async (huellero, i) => {

      let date = new Date((huellero || {}).dia).toLocaleDateString().split('/');
      let parseDate = `${date[0]}-${date[1]}-${date[2]}`;


      await pool.query(`SELECT * FROM TB_HEAD_PAPELETA WHERE ESTADO_PAPELETA != 'anulado' AND ID_PAP_TIPO_PAPELETA = 7 AND NRO_DOCUMENTO_EMPLEADO = '${(huellero || {}).nroDocumento}' AND FECHA_DESDE = '${(huellero || {}).dia}';`).then(([papeleta]) => {
        ((dataServGeneral || [])[i] || {})['papeleta'] = papeleta || [];
      });

      await onSearchRango(i, (huellero || {}).nroDocumento, parseDate).then((rs) => {
        ((dataServGeneral || [])[rs.index] || {})['rango_horario'] = rs.rango;
        ((dataServGeneral || [])[rs.index] || {})['isTardanza'] = false;
      });

      setTimeout(() => {
        if (dataServGeneral.length - 1 == i) {
          console.log("dataServGeneral", dataServGeneral.length);

          for (let i = 0; i < dataServGeneral.length; i += 1000) {
            const dataBlock = dataServGeneral.slice(i, i + 1000);
            socket.to(`${dataServGeneral[0].socket}`).emit("reporteHuellero", { id: "servGeneral", data: dataBlock, rs: 'new', length: dataServGeneral.length });
          }
        }
      }, 2000);
    });


    res.json({ mensaje: 'Archivo recibido con éxito' });
  });

  function onSearchRango(index, nro_documento, fecha) {
    return pool.query(`SELECT TB_DIAS_TRABAJO.CODIGO_TIENDA,TB_DIAS_TRABAJO.NOMBRE_COMPLETO,TB_DIAS_TRABAJO.NUMERO_DOCUMENTO,TB_RANGO_HORA.RANGO_HORA,TB_DIAS_HORARIO.FECHA_NUMBER FROM TB_DIAS_TRABAJO INNER JOIN TB_RANGO_HORA ON TB_RANGO_HORA.ID_RANGO_HORA = TB_DIAS_TRABAJO.ID_TRB_RANGO_HORA INNER JOIN TB_DIAS_HORARIO ON TB_DIAS_HORARIO.ID_DIAS = TB_DIAS_TRABAJO.ID_TRB_DIAS WHERE FECHA_NUMBER = '${fecha}' AND NUMERO_DOCUMENTO = '${nro_documento}';`).then(([rs]) => {
      return { index: index, rango: ((rs || [])[0] || {})['RANGO_HORA'] || "" };
    });
  }


  app.get("/comprobantes/session/lista", async (req, res) => {
    await pool.query(`SELECT * FROM TB_TERMINAL_TIENDA;`).then(([tiendasSession]) => {
      res.json({ data: tiendasSession });
    });
  });

  app.post("/frontRetail/search/horario", async (req, res) => {
    console.log(req.body);

    let data = req.body;

    (data || []).filter(async (dt, i) => {
      let date = new Date((dt || {}).dia).toLocaleDateString().split('/');
      let parseDate = `${date[0]}-${date[1]}-${date[2]}`;

      let [arFeriado] = await pool.query(`SELECT * FROM TB_DIAS_LIBRE 
        INNER JOIN TB_DIAS_HORARIO ON TB_DIAS_HORARIO.ID_DIAS = TB_DIAS_LIBRE.ID_TRB_DIAS
        WHERE TB_DIAS_LIBRE.NUMERO_DOCUMENTO = '${(dt || {}).nroDocumento}'
        AND FECHA_NUMBER = '${parseDate}';`);

      if ((arFeriado || []).length) {
        data[i]['isException'] = true;
      } else {
        data[i]['isException'] = false;
      }

      pool.query(`SELECT * FROM TB_HEAD_PAPELETA WHERE ESTADO_PAPELETA != 'anulado' AND ID_PAP_TIPO_PAPELETA = 7 AND NRO_DOCUMENTO_EMPLEADO = '${(dt || {}).nroDocumento}' AND FECHA_DESDE = '${(dt || {}).dia}';`).then(([papeleta]) => {
        ((data || [])[i] || {})['papeleta'] = papeleta || [];

        if (data.length - 1 == i) {
          setTimeout(() => {
            socket.to(`${req.body[0]['socket']}`).emit("reporteHorario", { id: "servGeneral", data: req.body });
            res.json({ mensaje: 'Archivo recibido con éxito' });
          }, 500);
        }
      });
    });

  });

  app.post('/facturas-pendiente', async (req, res) => {
    let request = ((req || []).body || [])


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


  app.post('/uploadCloud', async (req, res) => {

  });

  app.post('/createDirectory', async (req, res) => {
    let request = ((req || []).body || [])
    console.log(request);
    fs.mkdir("driveCloud/EMBARQUES/" + (request || {}).route, (error) => {
      if (error) {
        res.json({ msj: error.message })
      } else {
        res.json({ msj: "Directorio creado" });
      }
    });
  });

  app.post('/deleteDirectory', async (req, res) => {
    let request = ((req || []).body || [])
    console.log(request);
    let evalueDir = ((request || {}).route || "").split(".");
    if (evalueDir.length >= 2) {
      fs.unlink("driveCloud/EMBARQUES/" + (request || {}).route, (error) => {
        if (error) {
          res.json({ msj: error.message })
        } else {
          res.json({ msj: "Directorio borrado" });
        }
      });
    } else {
      fs.rmdir("driveCloud/EMBARQUES/" + (request || {}).route, (error) => {
        if (error) {
          res.json({ msj: error.message })
        } else {
          res.json({ msj: "Directorio borrado" });
        }
      });
    }

  });

  app.get('/listDirectory', async (req, res) => {
    let arDirectory = [];
    fs.readdirSync('driveCloud/EMBARQUES').forEach(async (file, i) => {
      console.log(file);
      await fs.stat('driveCloud/EMBARQUES/' + file, (err, stats) => {
        arDirectory.push({
          name: file,
          size: stats.size,
          mtime: stats.atime
        });
        if (fs.readdirSync('driveCloud/EMBARQUES').length == arDirectory.length) {
          res.json(arDirectory);
        }

      });
    });
  });

  app.get("/download/driveCloud", (req, res) => {

    let request = ((req || []).query || []);
    console.log(request);
    const file = "./driveCloud/EMBARQUES/" + (request || {}).route;
    var fileLocation = path.join('./', file);
    res.download(fileLocation, file);
  });


  const storageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './driveCloud/EMBARQUES/')
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname)
    }
  });



  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      let __dirName = req.query.path || "";
      let dr = __dirName.length ? __dirName + "/" : "";
      console.log('./driveCloud/EMBARQUES/' + dr);
      cb(null, './driveCloud/EMBARQUES/' + dr);
    },
    filename: function (req, file, cb) {

      cb(null, file.originalname);
    }
  });

  const upload = multer({ storage: storage });

  app.post('/upload/driveCloud', upload.array('file', 10), (req, res) => {

    res.json({ message: 'success' });
  });

  /*
   app.post('/uploadMultipleSingleField', upload.array('multipleFiles', 5), (req, res) => {
     // The uploaded files are available in req.files
     res.json({ message: 'Multiple files from a single field uploaded successfully!' });
   });
 
   app.post('/uploadMultipleFields', upload.fields([
     { name: 'field1Files', maxCount: 5 },
     { name: 'field2Files', maxCount: 5 }
   ]), (req, res) => {
     // The uploaded files are available in req.files
     // Use req.files['field1Files'] for files from the first field
     // Use req.files['field2Files'] for files from the second field
     res.json({ message: 'Multiple files from multiple fields uploaded successfully!' });
   });
 */

  app.post('/oneListDirectory', async (req, res) => {
    let arDirectory = [];
    let request = ((req || []).body || [])
    if (fs.readdirSync('driveCloud/EMBARQUES/' + request.path).length) {
      fs.readdirSync('driveCloud/EMBARQUES/' + request.path).forEach(async (file, i) => {
        await fs.stat('driveCloud/EMBARQUES/' + request.path + "/" + file, (err, stats) => {
          arDirectory.push({
            name: file,
            size: stats.size,
            mtime: stats.atime
          });

          if (fs.readdirSync('driveCloud/EMBARQUES/' + request.path).length == arDirectory.length) {
            res.json(arDirectory || []);
          }

        });
      });
    } else {
      res.json([]);
    }

  });

  app.post('/usuario/registrar', async (req, res) => {
    let dataUser = (req || []).body || [];
    pool.query(`INSERT INTO TB_LOGIN(USUARIO,PASSWORD,DEFAULT_PAGE,EMAIL,NIVEL)VALUES('${(dataUser || [])[0].usuario}','${(dataUser || [])[0].password}','${(dataUser || [])[0].default_page}','${(dataUser || [])[0].email}','${(dataUser || [])[0].nivel}');`).then(() => {
      res.json({ msj: true })
    });
  });

  app.post('/usuario/editar', async (req, res) => {
    let dataUser = (req || []).body || [];
    pool.query(`UPDATE TB_LOGIN SET USUARIO = '${(dataUser || [])[0].usuario}',PASSWORD = '${(dataUser || [])[0].password}',DEFAULT_PAGE = '${(dataUser || [])[0].default_page}',EMAIL = '${(dataUser || [])[0].email}',NIVEL = '${(dataUser || [])[0].nivel}' WHERE ID_LOGIN = ${(dataUser || [])[0].id};`).then(() => {
      res.json({ msj: true })
    });
  });



  app.get('/menu/sistema/lista', async (req, res) => {
    pool.query(`SELECT * FROM TB_MENU_SISTEMA;`).then(([menu]) => {
      res.json(menu);
    });
  });

  app.post('/menu/add/sistema', async (req, res) => {
    let dataMenu = (req || []).body || [];
    pool.query(`INSERT INTO TB_MENU_SISTEMA(NOMBRE_MENU,RUTA)VALUES('${(dataMenu || {})[0].nombre_menu}','${(dataMenu || {})[0].ruta}');`).then(() => {
      res.json({ msj: true })
    });
  });

  app.post('/menu/sistema/consulta', async (req, res) => {
    let dataConsulta = (req || []).body || [];
    pool.query(`SELECT * FROM TB_PERMISO_SISTEMA INNER JOIN TB_MENU_SISTEMA ON TB_MENU_SISTEMA.ID_MENU = TB_PERMISO_SISTEMA.ID_MENU_PS WHERE TB_PERMISO_SISTEMA.NIVEL = '${((dataConsulta || [])[0] || {}).nivel}';`).then(([menu]) => {
      res.json(menu);
    });
  });

  app.get('/menu/sistema/niveles', async (req, res) => {
    pool.query(`SELECT * FROM TB_NIVELES_SISTEMA;`).then(([niveles]) => {
      res.json(niveles);
    });
  });


  app.post('/menu/sistema/niveles', async (req, res) => {
    let dataNivel = (req || []).body || [];
    pool.query(`INSERT INTO TB_NIVELES_SISTEMA(NIVEL_DESCRIPCION)VALUES('${(dataNivel || {})[0].nivel}');`).then(() => {
      res.json({ msj: true })
    });
  });

  app.post('/menu/sistema/add/permisos', async (req, res) => {
    let dataNivel = (req || []).body || [];
    pool.query(`INSERT INTO TB_PERMISO_SISTEMA(ID_MENU_PS,NIVEL)VALUES(${(dataNivel || {})[0].id_menu},'${(dataNivel || {})[0].nivel}');`).then(() => {
      res.json({ msj: true })
    });
  });

  app.post('/menu/sistema/delete/permisos', async (req, res) => {
    let dataNivel = (req || []).body || [];
    pool.query(`DELETE FROM TB_PERMISO_SISTEMA WHERE ID_PERMISO_USER = ${(dataNivel || {})[0].id_menu};`).then(() => {
      res.json({ msj: true })
    });
  });

  app.post('/sunat-notification', async (req, res) => {

    let arrDocumento = (req || []).body || [];
    console.log((req || []).body);
    let tiendasList = [
      { code: '7A', name: 'BBW JOCKEY', email: 'bbwjockeyplaza@metasperu.com' },
      { code: '9N', name: 'VS MALL AVENTURA', email: 'vsmallaventura@metasperu.com' },
      { code: '7J', name: 'BBW MALL AVENTURA', email: 'bbwmallaventura@metasperu.com' },
      { code: '7E', name: 'BBW LA RAMBLA', email: 'bbwlarambla@metasperu.com' },
      { code: '9D', name: 'VS LA RAMBLA', email: 'vslarambla@metasperu.com' },
      { code: '9B', name: 'VS PLAZA NORTE', email: 'vsplazanorte@metasperu.com' },
      { code: '7C', name: 'BBW SAN MIGUEL', email: 'bbwsanmiguel@metasperu.com' },
      { code: '9C', name: 'VS SAN MIGUEL', email: 'vssanmiguel@metasperu.com' },
      { code: '7D', name: 'BBW SALAVERRY', email: 'bbwsalaverry@metasperu.com' },
      { code: '9I', name: 'VS SALAVERRY', email: 'vssalaverry@metasperu.com' },
      { code: '9G', name: 'VS MALL DEL SUR', email: 'vsmalldelsur@metasperu.com' },
      { code: '9H', name: 'VS PURUCHUCO', email: 'vspuruchuco@metasperu.com' },
      { code: '9M', name: 'VS ECOMMERCE', email: 'vsecommpe@metasperu.com' },
      { code: '7F', name: 'BBW ECOMMERCE', email: 'bbwecommperu@metasperu.com' },
      { code: '9K', name: 'VS MEGA PLAZA', email: 'vsmegaplaza@metasperu.com' },
      { code: '9L', name: 'VS MINKA', email: 'vsoutletminka@metasperu.com' },
      { code: '9F', name: 'VSFA JOCKEY FULL', email: 'vsfajockeyplaza@metasperu.com' },
      { code: '7A7', name: 'BBW ASIA', email: 'bbwasia@metasperu.com' },
      { code: '9P', name: 'VS MALL PLAZA', email: 'vsmallplazatrujillo@metasperu.com' },
      { code: '7I', name: 'BBW MALL PLAZA', email: 'bbwmallplazatrujillo@metasperu.com' }
    ];

    (arrDocumento || []).filter(async (doc) => {
      if (((doc || {}).ESTADO_SUNAT || "").trim() == "RECHAZADO" || ((doc || {}).ESTADO_SUNAT || "").trim() == "GENERADO") {

        let [verifyDocument] = await pool.query(`SELECT * FROM TB_DOCUMENTOS_ERROR_SUNAT WHERE CODIGO_DOCUMENTO = '${(doc || {}).CODIGO_DOCUMENTO}';`);

        let isEmailEnvio = ((verifyDocument || [])[0] || {}).ENVIO_EMAIL || 'false';

        if (!(verifyDocument || []).length) {
          await pool.query(`INSERT INTO TB_DOCUMENTOS_ERROR_SUNAT(CODIGO_DOCUMENTO,NRO_CORRELATIVO,NOM_ADQUIRIENTE,NRO_DOCUMENTO,TIPO_DOCUMENTO_ADQUIRIENTE,OBSERVACION,ESTADO_SUNAT,ESTADO_COMPROBANTE,CODIGO_ERROR_SUNAT,ENVIO_EMAIL,FECHA_EMISION)
                                  VALUES(${(doc || {}).CODIGO_DOCUMENTO},
                                  '${(doc || {}).NRO_CORRELATIVO}',
                                  '${(doc || {}).NOM_ADQUIRIENTE}',
                                  '${(doc || {}).NRO_DOCUMENTO}',
                                  '',
                                  '${(doc || {}).OBSERVACION}',
                                  '${(doc || {}).ESTADO_SUNAT}',
                                  '${(doc || {}).ESTADO_COMPROBANTE}',
                                  '${(doc || {}).CODIGO_ERROR_SUNAT}',
                                  'false',
                                  '${(doc || {}).FECHA_EMISION}');`);

          // res.send('RECEPCION EXITOSA..!!');
        } else {
          await pool.query(`UPDATE TB_DOCUMENTOS_ERROR_SUNAT SET
                                  NOM_ADQUIRIENTE ='${(doc || {}).NOM_ADQUIRIENTE}',
                                  NRO_DOCUMENTO = '${(doc || {}).NRO_DOCUMENTO}',
                                  OBSERVACION = '${(doc || {}).OBSERVACION}',
                                  ESTADO_SUNAT = '${(doc || {}).ESTADO_SUNAT}',
                                  ESTADO_COMPROBANTE = '${(doc || {}).ESTADO_COMPROBANTE}',
                                  CODIGO_ERROR_SUNAT = '${(doc || {}).CODIGO_ERROR_SUNAT}' WHERE CODIGO_DOCUMENTO = ${(doc || {}).CODIGO_DOCUMENTO};`);
          //res.send('RECEPCION EXITOSA..!!');
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
                          <td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center;border-right:0px">${(doc || {}).CODIGO_DOCUMENTO}</td>
                          <td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center">${(doc || {}).NRO_CORRELATIVO}</td>
                          <td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center;border-right:0px">${(doc || {}).FECHA_EMISION}</td>
                          <td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center;border-right:0px">${(doc || {}).NOM_ADQUIRIENTE}</td>
                          <td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center">${(doc || {}).NRO_DOCUMENTO}</td>
                      </tr>
                  </tbody>
              </table>`;



        let serie = ((doc || {}).NRO_CORRELATIVO || "").split('-')[0];

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

          await pool.query(`UPDATE TB_DOCUMENTOS_ERROR_SUNAT SET ENVIO_EMAIL ='true' WHERE CODIGO_DOCUMENTO = ${(doc || {}).CODIGO_DOCUMENTO};`);

          emailController.sendEmail([(selectedLocal || {}).email || '', 'johnnygermano@metasperu.com', 'josecarreno@metasperu.com'], `FACTURA CON RUC ERRADO ${(selectedLocal || {}).name || ''}`, bodyHTML, null, null)
            .catch(error => res.send(error));

          res.send('RECEPCION EXITOSA..!!');
        }
      }
    });



  });

  console.log(`connect ${codeTerminal} - idApp`, listClient.id);
  console.log('a user connected');
});



httpServer.listen(3200, async () => {
  console.log('listening on *:3200');
  console.log('ACTUALIZADO');
});