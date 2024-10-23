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

const task_4 = cron.schedule('*/15 * * * *', () => {
  console.log('/15 * * * *');
  emitVerificationSUNAT();
});

task_1.start();
task_2.start();
task_3.start();
task_4.start();

function emitVerificationSUNAT() {
  io.emit('consultingSUNAT', 'sunat');
}

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

  }

  socket.on('verifyDocument', async (resData) => {
    //console.log("'verifyDocument'", resData);
    if ((resData || "").id == "server") {
      let listSessionConnect = await facturacionController.verificacionDocumentos(resData);
      socket.to(`${listClient.id}`).emit("sessionConnect", listSessionConnect);
    }
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
    socket.broadcast.emit("searchCantCliente", data);
  });


  socket.on('comunicationFront', (data) => {
    console.log('comunicationFront');
    socket.broadcast.emit("consultingToFront", 'ready');
  });

  socket.on('comunicationStock', (email, arrCodeTienda) => {
    console.log('comunicationStock');
    socket.broadcast.emit("searchStockTest", email, arrCodeTienda);
  });

  socket.on('comunicationStockTable', (arrCodeTienda, barcode) => {
    console.log('comunicationStockTable');
    socket.broadcast.emit("searchStockTable", arrCodeTienda, barcode);
  });


  socket.on('emitCleanClient', (data) => {
    console.log('cleanClient');
    socket.broadcast.emit("limpiarCliente", data);
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

  socket.on("update:file:FrontAgent", (body) => {
    let configurationList = {
      socket: (socket || {}).id,
      update: "python",
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

  app.post("/calendario/generar", async (req, res) => {
    let data = req.body;

    let dateNow = new Date();

    var año = dateNow.getFullYear();
    var mes = (dateNow.getMonth() + 1);
    let dayNow = dateNow.getDay();
    let day = new Date(dateNow).toLocaleDateString().split('/');

    let [cargosListVerf] = await pool.query(`SELECT * FROM TB_HORARIO_PROPERTY WHERE FECHA = '${day[0]}-${day[1]}-${day[2]}';`);

    if (!(cargosListVerf || []).length) {
      await (data || []).filter(async (rs) => {
        await pool.query(`INSERT INTO TB_HORARIO_PROPERTY(CARGO,CODIGO_TIENDA,FECHA)VALUES('${rs.cargo}','${rs.codigo_tienda}','${rs.fecha}')`);
      });
    }

    let [cargosList] = await pool.query(`SELECT * FROM TB_HORARIO_PROPERTY WHERE FECHA = '${day[0]}-${day[1]}-${day[2]}';`);


    res.json(cargosList);

  });

  socket.on("actualizarHorario", async (data) => {
    /* {
       id: this.dataHorario.length + 1,
       cargo: cargo.value,
       rg_hora: [],
       dias: this.arListDia,
       dias_trabajo: [],
       dias_libres: [],
       arListTrabajador: [],
       observacion: []
     }*/

    let dataHorario = data || [];


    dataHorario.filter(async (dth) => {

      let [rangoHora] = await pool.query(`SELECT * FROM TB_RANGO_HORA WHERE ID_RG_HORARIO = ${(dth || {}).id};`);

      dth['rg_hora'].filter(async (rangoh) => {
        if ((rangoHora || []).length) {
          let rangoHoraSelected = await pool.query(`SELECT * FROM TB_RANGO_HORA WHERE ID_RG_HORARIO = ${(dth || {}).id};`);
          await pool.query(`UPDATE TB_RANGO_HORA SET CODIGO_TIENDA = '${rangoh.codigo_tienda}',RANGO_HORA='${rangoh.rg}' WHERE ID_RANGO_HORA = ${(rangoHoraSelected || {}).ID_RANGO_HORA};`);
        } else {
          await pool.query(`INSERT INTO TB_RANGO_HORA(CODIGO_TIENDA,RANGO_HORA,ID_RG_HORARIO)VALUES('${rangoh.codigo_tienda}','${rangoh.rg}',${(dth || {}).id})`);
        }
      });

      /** 
            let [diasHorario] = await pool.query(`SELECT * FROM TB_DIAS_HORARIO WHERE ID_DIA_HORARIO = ${(dth || {}).id};`);
      
            dth['dias'].filter(async (diah) => {
              if ((diasHorario || []).length) {
                let diaHorarioSelected = await pool.query(`SELECT * FROM TB_DIAS_HORARIO WHERE ID_DIA_HORARIO = ${(dth || {}).id};`);
                await pool.query(`UPDATE TB_DIAS_HORARIO SET DIA = '${diah.dia}',FECHA='${diah.fecha}' WHERE ID_DIAS = ${(diaHorarioSelected || {}).ID_DIAS};`);
              } else {
                await pool.query(`INSERT INTO TB_DIAS_HORARIO(DIA,FECHA,ID_DIA_HORARIO)VALUES('${diah.dia}','${diah.fecha}',${diah.idhoraro})`);
              }
            });
      
      
            await pool.query(`DELETE FROM TB_DIAS_TRABAJO WHERE ID_TRB_HORARIO = ${(dth || {}).id};`);
      
            dth['dias_trabajo'].filter(async (diat) => {
              await pool.query(`INSERT INTO TB_DIAS_TRABAJO(CODIGO_TIENDA,NUMERO_DOCUMENTO,NOMBRE_COMPLETO,ID_TRB_RANGO_HORA,ID_TRB_DIAS,ID_TRB_HORARIO)VALUES('${diat.codigo_tienda}','${diat.numero_documento}','${diat.nombre_completo}',${diat.rg},${diat.id_dia},${(dth || {}).id})`);
            });
      
      
            await pool.query(`DELETE FROM TB_DIAS_LIBRE WHERE ID_TRB_HORARIO = ${(dth || {}).id};`);
      
            dth['dias_libres'].filter(async (diat) => {
              await pool.query(`INSERT INTO TB_DIAS_LIBRE(CODIGO_TIENDA,NUMERO_DOCUMENTO,NOMBRE_COMPLETO,ID_TRB_RANGO_HORA,ID_TRB_DIAS,ID_TRB_HORARIO)VALUES('${diat.codigo_tienda}','${diat.numero_documento}','${diat.nombre_completo}',${diat.rg},${diat.id_dia},${(dth || {}).id})`);
            });
      
      */
    });




  });


  socket.on("consultaHorasTrab", (configuracion) => {
    console.log(configuracion);
    let configurationList = {
      socket: (socket || {}).id,
      fechain: configuracion[0].fechain,
      fechaend: configuracion[0].fechaend,
      nro_documento: configuracion[0].nro_documento
    };

    socket.broadcast.emit("consultaHoras", configurationList);
  });

  socket.on("consultaListaEmpleado", (cntCosto) => {
    console.log(cntCosto);
    let configurationList = {
      socket: (socket || {}).id,
      cntCosto: cntCosto
    };

    socket.broadcast.emit("consultarEJB", configurationList);
    socket.broadcast.emit("consultarEmpleados", configurationList);
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
        if (((ejb || {}).STATUS).trim() == 'VIG') {
          parseEJB.push({
            id: "EJB",
            codigoEJB: ((ejb || {}).CODEJB).trim(),
            nombre_completo: `${(ejb || {}).APEPAT} ${(ejb || {}).APEMAT} ${(ejb || {}).NOMBRE}`,
            nro_documento: ((ejb || {}).NUMDOC).trim(),
            telefono: ((ejb || {}).TELEFO).trim(),
            email: ((ejb || {}).EMAIL).trim(),
            fec_nacimiento: ((ejb || {}).FECNAC).trim(),
            fec_ingreso: ((ejb || {}).FECING).trim(),
            status: ((ejb || {}).STATUS).trim()
          });
        }
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
          caja: (huellero || {}).caja
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

  app.post("/frontRetail/search/configuration/agente", async (req, res) => {
    let data = ((req || {}).body || []);
    let [configuration] = await pool.query(`SELECT * FROM TB_PARAMETROS_TIENDA WHERE MAC='${((data || {}).mac).toUpperCase()}';`);
    console.log(configuration);
    res.json(configuration)
  });

  app.post("/frontRetail/search/stock", async (req, res) => {
    console.log(req.body);
    socket.to(`${listClient.id}`).emit("dataStockParse", req.body);

    res.json({ mensaje: 'Archivo recibido con éxito' });
  });

  app.post("/frontRetail/search/huellero", async (req, res) => {
    socket.to(`${listClient.id}`).emit("reporteHuellero", { id: "servGeneral", data: req.body });
    res.json({ mensaje: 'Archivo recibido con éxito' });
  });

  app.post("/frontRetail/search/horario", async (req, res) => {
    socket.to(`${listClient.id}`).emit("reporteHorario", { id: "servGeneral", data: req.body });
    res.json({ mensaje: 'Archivo recibido con éxito' });
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
    console.log((arrDocumento || {}).ESTADO_SUNAT);
    if (((arrDocumento || {}).ESTADO_SUNAT).trim() == "RECHAZADO") {
      console.log(arrDocumento);
      let [verifyDocument] = await pool.query(`SELECT * FROM TB_DOCUMENTOS_ERROR_SUNAT WHERE CODIGO_DOCUMENTO = '${(arrDocumento || {}).CODIGO_DOCUMENTO}';`);
      console.log((arrDocumento || {}).ESTADO_SUNAT);
      console.log(verifyDocument);
      let isEmailEnvio = ((verifyDocument || [])[0] || {}).ENVIO_EMAIL || 'false';
      console.log('verifyDocument', (verifyDocument || []).length);

      if (!(verifyDocument || []).length) {
        await pool.query(`INSERT INTO TB_DOCUMENTOS_ERROR_SUNAT(CODIGO_DOCUMENTO,NRO_CORRELATIVO,NOM_ADQUIRIENTE,NRO_DOCUMENTO,TIPO_DOCUMENTO_ADQUIRIENTE,OBSERVACION,ESTADO_SUNAT,ESTADO_COMPROBANTE,CODIGO_ERROR_SUNAT,ENVIO_EMAIL,FECHA_EMISION)
                                VALUES(${(arrDocumento || {}).CODIGO_DOCUMENTO},
                                '${(arrDocumento || {}).NRO_CORRELATIVO}',
                                '${(arrDocumento || {}).NOM_ADQUIRIENTE}',
                                '${(arrDocumento || {}).NRO_DOCUMENTO}',
                                '',
                                '',
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
                                OBSERVACION = '',
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