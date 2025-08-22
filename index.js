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
import storesRoutes from './routes/stores.routes.js';
import configurationController from './routes/configuration.routes.js';
import frontRetailRoutes from "./routes/frontRetail.routes.js";
import { prop as defaultResponse } from "./const/defaultResponse.js";
import tokenController from './controllers/csToken.js';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Client } from "basic-ftp"
import mdwErrorHandler from './middleware/errorHandler.js';
import mdlNotificacion from './class/clsNotificaciones.js';
import scheduleController from './controllers/csSchedule.js';
import scheduleRoutes from './routes/schedule.routes.js';
import configurationRoutes from './routes/configuration.routes.js';
import comunicationSocket from './sockets/comunication.socket.js';
import logSocket from './sockets/log.socket.js';
import vouchersSocket from './sockets/vouchers.socket.js';
import transactionsSocket from './sockets/transactions.socket.js';
import statusSocket from './sockets/status.socket.js';
import resourcesHumanSocket from './sockets/resourcesHuman.socket.js';

//import services from './services/notificaciones.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*", methods: ["GET", "POST"], transports: ['websocket', 'polling'] } });
const uploadTraspasos = multer({ dest: 'uploads/traspasos' });
let arUsuarioSocket = [];
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
app.use("/stores", storesRoutes);
app.use("/configuration", configurationRoutes);
app.use("/schedule", scheduleRoutes);


// Middleware de logging
app.use((req, res, next) => {
  const start = Date.now();

  // Captura de datos originales
  const originalSend = res.send;

  // Interceptamos la respuesta
  res.send = function (body) {
    const duration = Date.now() - start;
    console.log('--- Nueva petición ---');
    console.log('Hora:', new Date().toISOString());
    console.log('IP:', req.ip);
    console.log('Método:', req.method);
    console.log('URL:', req.originalUrl);
    console.log('Query:', req.query);
    console.log('Params:', req.params);
    console.log('Body:', req.body);
    console.log('Status:', res.statusCode);
    console.log('Respuesta:', body);
    console.log('Duración:', `${duration}ms`);
    console.log('----------------------');

    return originalSend.call(this, body);
  };

  next();
});

const emiter = new EventEmitter();

var listClient = { id: '' };

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

function onConsultarHorarioOficina(index, fecha, documento) {
  return pool.query(`SELECT TB_DIAS_TRABAJO.CODIGO_TIENDA,TB_DIAS_TRABAJO.NOMBRE_COMPLETO,TB_DIAS_TRABAJO.NUMERO_DOCUMENTO,TB_RANGO_HORA.RANGO_HORA,
          TB_DIAS_HORARIO.FECHA_NUMBER FROM TB_DIAS_TRABAJO INNER JOIN TB_RANGO_HORA ON TB_RANGO_HORA.ID_RANGO_HORA = TB_DIAS_TRABAJO.ID_TRB_RANGO_HORA 
          INNER JOIN TB_DIAS_HORARIO ON TB_DIAS_HORARIO.ID_DIAS = TB_DIAS_TRABAJO.ID_TRB_DIAS WHERE FECHA_NUMBER = '${fecha}' AND NUMERO_DOCUMENTO = '${documento}';`).then(([rs]) => {

    return [{ index: index || "", horario: ((rs || [])[0] || {})['RANGO_HORA'] || "" }];
  });
}

function sendNotification(usuario, notificacion) {
  let userSocket = arUsuarioSocket.find((usk) => usk.usuario == usuario);
  io.to(`${(userSocket || {}).idSocket}`).emit("notificaciones:get", notificacion);
}



function onVerificarCalendario() {

  const now = new Date();
  now.setDate(now.getDate());
  let day = new Date(now).toLocaleDateString().split('/');

  pool.query(`SELECT CODIGO_TIENDA FROM TB_HORARIO_PROPERTY WHERE TRIM(SUBSTRING(RANGO_DIAS,1,9)) = '${parseInt(day[0]) + 1}-${parseInt(day[1])}-${parseInt(day[2])}' GROUP BY CODIGO_TIENDA;`).then(([calendarios]) => {
    let arCalendarios = ['9M'];
    (calendarios || []).filter((c) => {
      arCalendarios.push((c || {}).CODIGO_TIENDA);
    });

    pool.query(`SELECT * FROM TB_LISTA_TIENDA;`).then(([tiendas]) => {

      let arTiendas = tiendas || [];
      let arTiendasFaltantes = [];

      (arTiendas || []).filter((tienda, i) => {
        if (!arCalendarios.includes((tienda || {}).SERIE_TIENDA)) {
          arTiendasFaltantes.push((tienda || {}).DESCRIPCION);

          //services.userNotificacion();
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

            emailController.sendEmail(['itperu@metasperu.com', 'carlosmoron@metasperu.com', 'fieldleaderbbw@metasperu.com', 'fieldleadervs@metasperu.com', 'johnnygermano@metasperu.com', 'josecarreno@metasperu.com', 'paulodosreis@metasperu.com'], `ALERTA TIENDAS SIN HORARIO CREADO`, bodyHTML, null, null)
              .catch(error => res.send(error));

          }
        }
      });
    });
  });
}


comunicationSocket(io);
logSocket(io);
vouchersSocket(io);
transactionsSocket(io);
statusSocket(io);
resourcesHumanSocket(io);

io.on('connection', async (socket) => {

  const clientIp = socket.handshake.address;
  const auth_token = socket.handshake.auth.token;
  //const payload = tokenController.verificationToken(auth_token);

  const sockets = await io.fetchSockets(); // desde Socket.IO v4
  const socketIds = sockets.map(s => s.id);

  let codeQuery = socket.handshake.query.code;
  let codeTerminal = socket.handshake.headers.code;
  let isIcg = socket.handshake.headers.icg;
  let macEqp = socket.handshake.headers.mac;

  const transport = socket.conn.transport.name; // in most cases, "polling"

  socket.conn.on("upgrade", () => {
    const upgradedTransport = socket.conn.transport.name; // in most cases, "websocket"
    console.log("upgradedTransport", upgradedTransport);
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

  app.get("/papeleta/generar/codigo", async (req, res) => {
    fnGenerarCodigoPap(fnGenerarCodigoPap()).then((codigo) => {
      res.json({ codigo: codigo });
    })
  });

  app.get("/plugin/lista", async (req, res) => {
    let [arPlugin] = await pool.query(`SELECT * FROM TB_LISTA_PLUGIN WHERE ESTADO = 'ACTIVO';`);
    res.json({ data: arPlugin, success: true });
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

  app.get("/sunat/configuration", async (req, res) => { //configuration/plugin/sunat - [GET]
    let [arConfiguracion] = await pool.query(`SELECT  
        XML_ETIQUIETA_GROUP,
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
        APLICACION_FILE 
        FROM TB_CONFIGURACION_FILE_APLICACION WHERE APLICACION_FILE = 'plugin_sunat_icg';`);

    console.log(arConfiguracion);
    res.json(arConfiguracion);
  });

  app.post("/oficina/marcacion", async (req, res) => {
    let response = req.body;
    let socketID = (response[0] || {}).socketID;

    (response || []).filter(async (mc, i) => {
      let date = new Date(mc.checkinout.split(' ')[0]).toLocaleDateString().split('/');
      let parseDate = `${date[0]}-${parseInt(date[1])}-${date[2]}`;

      if (date[2] == '2025') {
        if (i >= 0) {
          onConsultarHorarioOficina(i, parseDate, mc.documento).then(([responseHorario]) => {

            if (parseDate == '30-6-2025' && mc.documento == '76542350') {
              console.log((response || [])[(responseHorario || {}).index]);
            }

            ((response || [])[(responseHorario || {}).index] || {})['rango_horario'] = (responseHorario || {}).horario || "";
            ((response || [])[(responseHorario || {}).index] || {})['isTardanza'] = false;

            if (response.length - 1 == i) {
              setTimeout(() => {
                socket.to(`${socketID}`).emit("marcacionOficina", { id: 'OF', data: response });
                res.json({ success: true });
              }, 2000);
            }
          });
        }
      }
    });
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

  app.post("/auth_session/delete", async (req, res) => {// security/session/auth - [DELETE]{id_session}
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
      console.log(valid);
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

  app.post("/calendario/generar", async (req, res) => { // schedule/generate - [POST][{id,cargo,date,range,code_store,range_date,days,days_work,days_free,arWorkers,observation}]
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

  app.post("/calendario/searchrHorario", async (req, res) => {// schedule/search - [GET]{range_days,code_store}
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

  //EDITAR RANGO HORARIO EN SEARCH
  app.post("/horario/update/rangoHorario", async (req, res) => { // schedule/range - [PUT]{id_range,range}
    let row = (req || {}).body || {};
    await pool.query(`UPDATE TB_RANGO_HORA SET RANGO_HORA = '${(row || {}).rg}' WHERE ID_RANGO_HORA = ${(row || {}).id}`).then((a) => {
      res.json({ success: true });
    }).catch((err) => {
      res.json({ msj: err });
    });
  });

  //ELIMINAR DIA DE TRABAJO EN SEARCH|
  app.post("/horario/delete/diaTrabajo", async (req, res) => { // schedule/day/work - [DELETE]{id_daywork}
    let id_registro = ((req || {}).body || {})['id'];
    pool.query(`DELETE FROM TB_DIAS_TRABAJO WHERE ID_DIA_TRB = ${id_registro};`).then(() => {
      res.json({ success: true });
    }).catch((err) => {
      res.json({ msj: err });
    });
  });

  //ELIMINAR DIA LIBRE DE SEARCH
  app.post("/horario/delete/diaLibre", async (req, res) => { // schedule/day/free - [DELETE]{id_dayfree}
    let id_registro = ((req || {}).body || {})['id'];


    pool.query(`SELECT * FROM TB_DIAS_LIBRE WHERE ID_DIA_LBR = ${id_registro};`).then(([arTrabajo]) => {
      pool.query(`DELETE FROM TB_DIAS_LIBRE WHERE ID_DIA_LBR = ${arTrabajo[0]['ID_DIA_LBR']};`).then(() => {
        res.json({ success: true });
      }).catch((err) => {
        res.json({ msj: err });
      });
    })


  });

  //EDITAR OBSERVACION DE SEARCH
  app.post("/horario/update/observacion", async (req, res) => { // schedule/observation - [PUT]{id_observation,new_observation}
    let id_registro = ((req || {}).body || {})['id'];
    let observacion = ((req || {}).body || {})['observacion'];

    pool.query(`UPDATE TB_OBSERVACION SET OBSERVACION = '${observacion}' WHERE ID_OBSERVACION = ${id_registro};`).then(() => {
      res.json({ success: true });
    }).catch((err) => {
      res.json({ msj: err });
    });
  });

  //ELIMINAR OBSERVACION DE SEARCH
  app.post("/horario/delete/observacion", async (req, res) => { // schedule/observation - [DELETE]{id_observation}
    let id_registro = ((req || {}).body || {})['id'];
    pool.query(`DELETE FROM TB_OBSERVACION WHERE ID_OBSERVACION = ${id_registro};`).then(() => {
      res.json({ success: true });
    }).catch((err) => {
      res.json({ msj: err });
    });
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

  app.post("/frontRetail/search/horario", async (req, res) => {

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
    fs.mkdir("./download/" + (request || {}).route, (error) => {
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
      fs.unlink("./download/" + (request || {}).route, (error) => {
        if (error) {
          res.json({ msj: error.message })
        } else {
          res.json({ msj: "Directorio borrado" });
        }
      });
    } else {
      fs.rmdir("./download/" + (request || {}).route, (error) => {
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
    fs.readdirSync('./download').forEach(async (file, i) => {
      console.log(file);
      await fs.stat('./download' + file, (err, stats) => {
        arDirectory.push({
          name: file,
          size: "",
          mtime: ""
        });
        if (fs.readdirSync('./download').length == arDirectory.length) {
          res.json(arDirectory);
        }

      });
    });
  });

  app.get("/download/driveCloud", (req, res) => {

    let request = ((req || []).query || []);

    const file = "./download/" + (request || {}).route;

    var fileLocation = path.join('./', file);
    console.log(file);
    res.download(fileLocation, file);
  });


  const storageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './download/')
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname)
    }
  });

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      let __dirName = req.query.path || "";
      let dr = __dirName.length ? __dirName + "/" : "";
      console.log('./download/' + dr);
      cb(null, './download/' + dr);
    },
    filename: function (req, file, cb) {

      cb(null, file.originalname);
    }
  });

  const upload = multer({ storage: storage });

  app.post('/upload/driveCloud', upload.array('file', 10), (req, res) => {

    res.json({ message: 'success' });
  });

  app.post('/oneListDirectory', async (req, res) => {
    let arDirectory = [];
    let request = ((req || []).body || [])
    if (fs.readdirSync('./download/' + request.path).length) {
      fs.readdirSync('./download/' + request.path).forEach(async (file, i) => {
        await fs.stat('./download/' + request.path + "/" + file, (err, stats) => {
          arDirectory.push({
            name: file,
            size: stats.size,
            mtime: stats.atime
          });

          if (fs.readdirSync('./download/' + request.path).length == arDirectory.length) {
            res.json(arDirectory || []);
          }

        });
      });
    } else {
      res.json([]);
    }

  });

  app.post('/usuario/registrar', async (req, res) => { // security/user - [POST]{ username,password,default_page,email,level}
    let dataUser = (req || []).body || [];
    pool.query(`SELECT * FROM TB_LOGIN WHERE USUARIO = '${(dataUser || [])[0].usuario}';`).then(([usuario]) => {
      if (!(usuario || []).length) {
        pool.query(`INSERT INTO TB_LOGIN(USUARIO,PASSWORD,DEFAULT_PAGE,EMAIL,NIVEL)VALUES('${(dataUser || [])[0].usuario}','${(dataUser || [])[0].password}','${(dataUser || [])[0].default_page}','${(dataUser || [])[0].email}','${(dataUser || [])[0].nivel}');`).then(() => {
          res.json({ msj: true });
        });
      } else {
        res.json({ msj: false });
      }
    });
  });

  app.post('/usuario/editar', async (req, res) => { // security/user - [PUT]{ id_user,username,password,default_page,email,level}
    let dataUser = (req || []).body || [];
    pool.query(`UPDATE TB_LOGIN SET USUARIO = '${(dataUser || [])[0].usuario}',PASSWORD = '${(dataUser || [])[0].password}',DEFAULT_PAGE = '${(dataUser || [])[0].default_page}',EMAIL = '${(dataUser || [])[0].email}',NIVEL = '${(dataUser || [])[0].nivel}' WHERE ID_LOGIN = ${(dataUser || [])[0].id};`).then(() => {
      res.json({ msj: true })
    });
  });

  app.post('/menu/sistema/consulta', async (req, res) => { // configuration/menu/search - [GET]{level}
    let dataConsulta = (req || []).body || [];
    pool.query(`SELECT * FROM TB_PERMISO_SISTEMA INNER JOIN TB_MENU_SISTEMA ON TB_MENU_SISTEMA.ID_MENU = TB_PERMISO_SISTEMA.ID_MENU_PS WHERE TB_PERMISO_SISTEMA.NIVEL = '${((dataConsulta || [])[0] || {}).nivel}';`).then(([menu]) => {
      res.json(menu);
    });
  });

  app.post('/menu/sistema/delete/permisos', async (req, res) => { // configuration/menu/permission - [DELETE]{id_permission}
    let dataNivel = (req || []).body || [];
    pool.query(`DELETE FROM TB_PERMISO_SISTEMA WHERE ID_PERMISO_USER = ${(dataNivel || {})[0].id_menu};`).then(() => {
      res.json({ msj: true })
    });
  });

  app.post('/usuario/delete/tienda', async (req, res) => { // configuration/asignation/store - [DELETE]{id_asignation}
    let dataAsignacion = (req || []).body || [];
    pool.query(`DELETE FROM TB_USUARIO_TIENDAS_ASIGNADAS WHERE ID_TIENDA_ASIGANADA = ${(dataAsignacion || {})[0].id_tienda_asignada};`).then(() => {
      res.json({ msj: true })
    });
  });

  app.post('/usuario/tiendas/asigandas', async (req, res) => { // configuration/asignation/store - [GET]{id_user}
    let dataUsuario = (req || []).body || [];
    pool.query(`SELECT * FROM TB_USUARIO_TIENDAS_ASIGNADAS WHERE ID_USUARIO_TASG = ${(dataUsuario || {}).id_usuario};`).then(([tiendas]) => {
      res.json(tiendas);
    });
  });

  app.get('/notificaciones', async (req, res) => {
    const auth_token = req.header("Authorization") || "";
    const tokenResolve = tokenController.verificationToken(auth_token);
    console.log("NOTIFICACIONES", tokenResolve);

    if ((tokenResolve || {}).isValid) {
      pool.query(`SELECT * FROM TB_USUARIO_NOTIFICACION INNER JOIN TB_NOTIFICACIONES ON ID_NOTIFICACION = ID_NOTIFICACION_NT WHERE ID_LOGIN_NT = ${(tokenResolve || {}).decoded.id};`).then(([notificaciones]) => {
        let resNotificacion = [];
        (notificaciones || []).filter((noti, i) => {
          let notificacion = new mdlNotificacion((noti || {}).TIPO, (noti || {}).TITULO, (noti || {}).MENSAJE, (noti || {}).IS_READ);
          (resNotificacion || []).push(notificacion);
          if ((notificaciones || []).length - 1 == i) {
            res.json(resNotificacion);
          }
        });
      });
    } else {
      res.status(403).json(mdwErrorHandler.error({ status: 403, type: 'Forbidden', message: 'No autorizado', api: '/notificaciones' }));
    }
  });

  app.post('/notificaciones/read', async (req, res) => {
    const auth_token = req.header("Authorization") || "";
    const tokenResolve = tokenController.verificationToken(auth_token);

    if ((tokenResolve || {}).isValid) {
      let dataRequest = (req || []).body || [];
      pool.query(`UPDATE TB_USUARIO_NOTIFICACION SET IS_READ = 1 WHERE ID_USN = ${(dataRequest || {}).idNoti};`).then(() => {
        res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/notificaciones/read' }));
      });
    } else {
      res.status(403).json(mdwErrorHandler.error({ status: 403, type: 'Forbidden', message: 'No autorizado', api: '/notificaciones' }));
    }
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

});


httpServer.listen(3200, async () => {
  console.log('listening on *:3200');
});