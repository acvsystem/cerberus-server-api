import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import bodyParser from "body-parser";
import facturacionController from "./controllers/csFacturacion.js";
import sessionSocket from "./controllers/csSessionSocket.js";
import { pool } from "./conections/conexMysql.js";
import securityRoutes from "./routes/security.routes.js";
import configurationRoutes from "./routes/configuration.routes.js";
import frontRetailRoutes from "./routes/frontRetail.routes.js";
import emailController from "./sendEmail.js";
import tokenController from "./controllers/csToken.js";
import CryptoJS from "crypto-js";
import { prop } from "./keys.js";
import * as cron from "node-cron";
import templateHtmlController from "./template/csTemplatesHtml.js";
import recursosHumanosRoutes from "./routes/recursosHumanos.routes.js";
import actionBDController from "./controllers/csActionOnBD.js";
import { prop as defaultResponse } from "./const/defaultResponse.js";
import * as ftp from "basic-ftp"

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

var listClient = { id: "" };
var agenteList = [];

app.use("/security", securityRoutes);
app.use(
  "/settings",
  async (req, res, next) => {
    const token = req.header("Authorization") || "";

    let resValidation = tokenController.verificationToken(token);

    if ((resValidation || {}).isValid) {
      next();
    } else {
      return res.status(401).json("Access denied");
    }
  },
  configurationRoutes
);

app.use(
  "/rrhh",
  async (req, res, next) => {
    const token = req.header("Authorization") || "";

    let resValidation = tokenController.verificationToken(token);

    if ((resValidation || {}).isValid) {
      next();
    } else {
      return res.status(401).json("Access denied");
    }
  },
  recursosHumanosRoutes
);

app.use("/frontRetail", frontRetailRoutes);

const task_ftp_backup = cron.schedule("00 09 * * *", async () => {
  console.log("00 09");
  const client = new ftp.Client()
  client.ftp.verbose = true
  try {
    await client.access({
      host: "190.117.53.199",
      user: "metasFTP",
      password: "METAS20600516885"
    })
    console.log(await client.list())
  }
  catch (err) {
    var bodyHTML = templateHtmlController.errorFTP(err);

    emailController.sendEmail(`itperu@grupodavid.com`, `CONEXION FTP BACKUP`, bodyHTML, null, null, 'ALERTA FTP SERVER').then((response) => {
        console.log(response);
    }).catch(error => console.log(error));
  }
  client.close()
});


const task_1 = cron.schedule("00 10 * * *", () => {
  console.log("00 10");
  emitVerificationDoc();
});

const task_2 = cron.schedule("00 15 * * *", () => {
  console.log("00 15");
  emitVerificationDoc();
});

const task_3 = cron.schedule("00 19 * * *", () => {
  console.log("00 19");
  emitVerificationDoc();
});

task_1.start();
task_2.start();
task_3.start();
task_ftp_backup.start();

function emitVerificationDoc() {
  io.emit("consultingToFront", "emitVerificationDoc");
}

app.post("/control-asistencia", async (req, res) => {
  let dataRecept = ((req || {}).body || [])[0];

  let dateList = (dataRecept || []).dateList || [];

  if (dateList.length) {
    io.emit("searchAsistencia", (dataRecept || {}).centroCosto, dateList);
  } else {
    io.emit(
      "searchAsistenciaMes",
      (dataRecept || {}).centroCosto,
      (dataRecept || {}).date_1,
      (dataRecept || {}).date_2,
      socket.id
    );
  }

  res.json(defaultResponse.success.default);
});

io.use(function (socket, next) {
  let token = socket.handshake.query.token;
  let hash = socket.handshake.headers.hash;

  if (hash) {
    var bytes = CryptoJS.AES.decrypt(hash, prop.keyCryptHash);
    var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8)) || {};

    if (Object.keys(decryptedData).length) {
      token = tokenController.createToken(
        (decryptedData || {}).user,
        (decryptedData || {}).nivel
      );
    }
  }

  let resValidToken = tokenController.verificationToken(token);

  if ((resValidToken || {}).isValid) {
    socket.decoded = (resValidToken || {}).decoded;
    next();
  } else {
    next(new Error("Authentication error"));
  }
}).on("connection", async (socket) => {
  let codeQuery = socket.handshake.query.code;
  let codeTerminal = socket.handshake.headers.code;
  let isIcg = socket.handshake.headers.icg;
  const userId = socket.id;

  if (socket.decoded.aud == "AGENTE") {
    let indexAgente = (agenteList || []).findIndex(
      (data, i) => (data || {}).code == codeTerminal
    );

    if (indexAgente != -1) {
      agenteList[indexAgente]["id"] = socket.id;
    } else {
      agenteList.push({ id: socket.id, code: codeTerminal });
    }
  }

  if (codeQuery == "app") {
    console.log("app", socket.id);
    listClient.id = socket.id;
    let listSessionConnect = await sessionSocket.connect();
    socket.emit("sessionConnect", listSessionConnect);
    let [documentList] = await pool.query(
      `SELECT * FROM TB_DOCUMENTOS_ERROR_SUNAT;`
    );
    socket.emit("sendNotificationSunat", documentList);
  }

  socket.on("emitRRHHEmpleados", () => {
    let confConsulting = [
      {
        socket: (socket || {}).id,
      },
    ];
    io.emit("updateEmployee", confConsulting);
  });

  socket.on("updReceptEmpleados", async (response) => {
    let configurationList = ((response || {}).configuration || {})[0] || {};
    let socketID = (configurationList || {}).socket;
    let dataEmpServidor = JSON.parse((response || {}).serverData);

    let dataEmployee = [];
    let [empleadoList] = await actionBDController.execQuery(
      `SELECT * FROM TB_EMPLEADO;`
    );

    let listDocumentEmp = [];
    await empleadoList.filter((doc) => {
      listDocumentEmp.push(((doc ||{}).NRO_DOC).trim());
    });
console.log(dataEmpServidor);
    await (dataEmpServidor || []).filter(async (empSrv, i) => {
      
      if((empSrv || {}).STATUS == "VIG") {
          let existEMP = listDocumentEmp.indexOf(((empSrv ||{}).NUMDOC).trim());

          if (existEMP == -1) {
  
            dataEmployee.push(empSrv);
            await actionBDController.execQuery(`INSERT INTO TB_EMPLEADO(
                                            CODIGO_ICG,
                                            CODIGO_EJB,
                                            AP_PATERNO,
                                            AP_MATERNO,
                                            NOM_EMPLEADO,
                                            ESTADO_EMP,
                                            ESTADO_CIVIL,
                                            TIPO_DOC,
                                            NRO_DOC,
                                            TLF_EMP,
                                            EMAIL_EMP,
                                            FEC_NAC,
                                            PAIS_NAC,
                                            TIENDA_ASIGNADO,
                                            SALARIO_BASE,
                                            FEC_INGRESO)VALUES(
                                                "",
                                                '${((empSrv ||{}).CODEJB || "").trim()}',
                                                '${((empSrv ||{}).APEPAT || "")}',
                                                '${((empSrv ||{}).APEMAT || "")}',
                                                '${((empSrv ||{}).NOMBRE || "")}',
                                                'ACEPTADO',
                                                '',
                                                '',
                                                '${((empSrv ||{}).NUMDOC || "").trim()}',
                                                '${((empSrv ||{}).TELEFO || "").trim()}',
                                                '${((empSrv ||{}).EMAIL || "").trim()}',
                                                '${((empSrv ||{}).FECNAC || "").trim()}',
                                                '',
                                                '',
                                                0.0,
                                                ""
                                            );`);
          }
      } else {
        let existEMP = listDocumentEmp.indexOf(((empSrv || {}).NUMDOC).trim());
        if(existEMP){
          await actionBDController.execQuery(`DELETE FROM TB_EMPLEADO WHERE NRO_DOC = '${((empSrv || {}).NUMDOC || "").trim()}';`);
        }
      }
      
    });

    if (dataEmpServidor.length) {
      socket.to(`${socketID}`).emit("sendUDPEmpleados", dataEmpServidor);
    }
  });


  socket.on("reporteAssitencia", async (response) => {
    let dataAsistensList = JSON.parse((response || {}).serverData);

    let tiendasList = [
      { code: "7A", name: "BBW JOCKEY" },
      { code: "9A", name: "VSBA JOCKEY" },
      { code: "PC", name: "AEO JOCKEY" },
      { code: "PB", name: "AEO ASIA" },
      { code: "7E", name: "BBW LA RAMBLA" },
      { code: "9D", name: "VSBA LA RAMBLA" },
      { code: "9N", name: "VSBA MALL AVENTURA" },
      { code: "7J", name: "BBW MALL AVENTURA" },
      { code: "9B", name: "VSBA PLAZA NORTE" },
      { code: "7C", name: "BBW SAN MIGUEL" },
      { code: "9C", name: "VSBA SAN MIGUEL" },
      { code: "7D", name: "BBW SALAVERRY" },
      { code: "9I", name: "VSBA SALAVERRY" },
      { code: "9G", name: "VSBA MALL DEL SUR" },
      { code: "9H", name: "VSBA PURUCHUCO" },
      { code: "9M", name: "VSBA ECOMMERCE" },
      { code: "7F", name: "BBW ECOMMERCE" },
      { code: "PA", name: "AEO ECOMMERCE" },
      { code: "9K", name: "VSBA MEGA PLAZA" },
      { code: "9L", name: "VSBA MINKA" },
      { code: "9F", name: "VSFA JOCKEY PLAZA" },
      { code: "7A7", name: "BBW ASIA" },
    ];

    let [originEmpleadoList] = await actionBDController.execQuery(
      `SELECT * FROM TB_EMPLEADO;`
    );
    let c_costo;
    let listDocumentEmp = [];

    await originEmpleadoList.filter((doc) => {
      (listDocumentEmp || []).push(doc.NRO_DOC);
    });

    let listNMFl = [];

    (dataAsistensList || []).filter(async (asits) => {
      if ((listDocumentEmp || []).indexOf(asits.nroDocumento) == -1) {
        listNMFl.push({nom: (asits || {}).nombreCompleto, dni: (asits || {}).nroDocumento});
      }
    });


    await (originEmpleadoList || []).filter((emp) => {
      return (dataAsistensList || []).filter(async (asits) => {
        
        if ((emp || {}).NRO_DOC == (asits ||{}).nroDocumento) {
          let serie = (asits || {}).caja.slice(0, 2);
          
          c_costo = new Promise((resolve, reject) => {
            (tiendasList || {}).filter((tienda) => {
              if ((tienda || {}).code == serie && serie != "7A") {
                resolve(tienda);
              } else {
                if ((asits || {}).caja == "7A7") {
                  resolve(tienda);
                } else {
                  if (serie == "7A") {
                    resolve(tienda);
                  }
                }
              }
            });
          });

          return c_costo.then(async (res) => {

            if ((emp || {}).TIENDA_ASIGNADO != (res || {}).name) {
              await actionBDController.execQuery(
                `UPDATE TB_EMPLEADO SET TIENDA_ASIGNADO = '${
                  (res || {}).name
                }' WHERE NRO_DOC = '${((asits ||{}).nroDocumento || "").trim()}';`
              );
              return;
            }
          });
        } else {
        }
      });
    });



    /*if ((listNMFl || []).length) {
      const workSheet = XLSX.utils.json_to_sheet(listNMFl || []);
      const workBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workBook, workSheet, "attendance");
      const xlsFile = XLSX.write(workBook, {
        bookType: "xlsx",
        type: "buffer",
      });
      emailController
        .sendEmail(
          "itperu@grupodavid.com",
          `REGISTROS FALTANTES`,
          null,
          xlsFile,
          "reporteAssitencia"
        )
        .catch((error) => res.send(error));
    }*/

    let [empleadoList] = await actionBDController.execQuery(
      `SELECT * FROM TB_EMPLEADO;`
    );

    let configurationList = ((response || {}).configuration || {})[0] || {};
    let socketID = (configurationList || {}).socket;

    let isReportForDay = (configurationList || {}).isReportForDay;
    let isReportTotal = (configurationList || {}).isReportTotal;
    let dateList = (configurationList || {}).dateList;
    let documentListAdd = [];
    let reportData = [];

    (empleadoList || []).filter((emp) => {
      let hrWorking = 0;
      let nroTransacciones = 0;
      let hExcedente = 0;
      let hFaltante = 0;

      (dataAsistensList || []).filter(async (asits) => {
        let nombreEmpleado = `${(emp || {}).AP_PATERNO} ${
          (emp || {}).AP_MATERNO
        } ${(emp || {}).NOM_EMPLEADO}`;

        if (emp.NRO_DOC == asits.nroDocumento) {
          let index = -1;

          if (isReportForDay) {
            index = (reportData || []).findIndex(
              (report) =>
                report.documento == asits.nroDocumento &&
                report.fecha == (asits || {}).dia
            );

            if (index == -1) {
              hrWorking = 0;
              hExcedente = 0;
              hFaltante = 0;
            }
          }

          hrWorking += Math.round(parseFloat(asits.hrWorking.toFixed(2)));

          nroTransacciones += asits.nroVentas;

          if (hrWorking > 8) {
            hExcedente += hrWorking % 8;
          }

          if (hrWorking < 8) {
            hFaltante += 8 - hrWorking;
          }

          if (isReportForDay) {
            if (index != -1) {
              let hora_1 =
                parseInt(reportData[index]["hsb"].split(":")[0]) * 60 +
                parseInt(reportData[index]["hsb"].split(":")[1]);
              let hora_2 =
                parseInt(asits.hrIn.split(":")[0]) * 60 +
                parseInt(asits.hrIn.split(":")[1]);

              ((reportData || [])[index] || {})["hib"] = asits.hrIn;
              ((reportData || [])[index] || {})["hSalida"] = asits.hrOut;
              ((reportData || [])[index] || {})["hBreak"] = Math.round(
                parseFloat((hora_2 - hora_1) / 60)
              );

              ((reportData || [])[index] || {})["hTrabajadas"] = Math.round(
                parseFloat(hrWorking.toFixed(2))
              );

              let fexc =
                ((reportData || [])[index] || {})["hTrabajadas"] > 8
                  ? ((reportData || [])[index] || {})["hTrabajadas"] - 8
                  : 0;
              let hfalt =
                ((reportData || [])[index] || {})["hTrabajadas"] < 8
                  ? 8 - ((reportData || [])[index] || {})["hTrabajadas"]
                  : 0;

              ((reportData || [])[index] || {})["hExcedente"] = Math.round(
                parseFloat(fexc.toFixed(2))
              );
              ((reportData || [])[index] || {})["hFaltantes"] = Math.round(
                parseFloat(hfalt.toFixed(2))
              );

              ((reportData || [])[index] || {})["data"].push(asits);
              ((reportData || [])[index] || {})["observacion"] =
                ((reportData || [])[index] || {})["data"].length > 2
                  ? true
                  : false;
            } else {
              let RegisterAddList = {};
              let itemReport = {};

              RegisterAddList = (documentListAdd || []).filter(
                (register) =>
                  register.dni == asits.nroDocumento &&
                  register.fecha == (asits || {}).dia
              );
              (documentListAdd || []).push({
                dni: emp.nroDocumento,
                fecha: (emp || {}).dia,
              });
              itemReport = {
                nomEmpleado: nombreEmpleado,
                documento: asits.nroDocumento,
                centro_costo: (emp || {}).TIENDA_ASIGNADO,
                fecha: asits.dia,
                hIngreso: asits.hrIn,
                hsb: asits.hrOut,
                hib: "",
                hSalida: "",
                hTrabajadas: Math.round(parseFloat(hrWorking.toFixed(2))),
                hExcedente: Math.round(parseFloat(hExcedente.toFixed(2))),
                hFaltantes: Math.round(parseFloat(hFaltante.toFixed(2))),
                hBreak: 0,
                data: [asits],
                observacion: false,
              };

              if (!RegisterAddList.length) {
                reportData.push(itemReport);
              }
            }
          }

          if (isReportTotal) {
            let itemReport = {};

            var fecha_1 = new Date(dateList[0]);
            var fecha_2 = new Date(dateList[1]);

            const diffInDays = Math.floor(
              (fecha_2 - fecha_1) / (1000 * 60 * 60 * 24)
            );

            index = (reportData || []).findIndex(
              (report) => report.documento == asits.nroDocumento
            );

            if (index != -1) {
              ((reportData || [])[index] || {})["hTrabajadas"] = Math.round(
                parseFloat(hrWorking.toFixed(2))
              );

              let hexc =
                ((reportData || [])[index] || {})["hTrabajadas"] -
                diffInDays * 8;
              let hfalt =
                diffInDays * 8 -
                ((reportData || [])[index] || {})["hTrabajadas"];

              ((reportData || [])[index] || {})["hExcedente"] =
                hexc > -1 ? hexc : 0;
              ((reportData || [])[index] || {})["hFaltantes"] =
                hfalt > -1 ? hfalt : 0;
              ((reportData || [])[index] || {})["data"].push(asits);
            }

            if (emp.NRO_DOC == asits.nroDocumento && index == -1) {
              itemReport = {
                nomEmpleado: nombreEmpleado,
                documento: asits.nroDocumento,
                hTrabajadas: Math.round(parseFloat(hrWorking.toFixed(2))),
                hExcedente: Math.round(parseFloat(hExcedente.toFixed(2))),
                hFaltantes: Math.round(parseFloat(hFaltante.toFixed(2))),
                data: [asits],
                observacion: false,
              };
              console.log("isReportTotal", itemReport);
              reportData.push(itemReport);
            }
          }
        }
      });
    });

    socket.to(`${socketID}`).emit("sendControlAsistencia", reportData);
  });
  
  

  //EMITE DESDE EL SERVIDOR
  socket.on("verifyDocument", async (resData) => {
    if (socket.decoded.aud == "SERVER") {
      let listSessionConnect =
        await facturacionController.verificacionDocumentos(resData);
      socket.to(`${listClient.id}`).emit("sessionConnect", listSessionConnect);
    }
  });

  //EMITE DESDE EL AGENTE PY
  socket.on("petitionFront", (data) => {
    let selectAgente = (agenteList || []).find(
      (data) => (data || {}).id == socket.id
    );
    if (typeof codeTerminal != "undefined" && codeTerminal != "") {
      socket.broadcast.emit("sendDataFront", data, codeTerminal);
    }
  });

  //EMITE DESDE EL FRONT
  socket.on("comunicationFront", (data) => {
    if (socket.decoded.aud == "ADMINISTRADOR") {
      socket.broadcast.emit("consultingToFront", "ready");
    }
  });

  socket.on("emitRRHH", (request) => {
    let dataRequest = (request || [])[0] || {};
    let isReportForDay = (dataRequest || {}).isReportForDay;
    let isReportTotal = (dataRequest || {}).isReportTotal;
    let isReportMtDate = (dataRequest || {}).isReportMtDate;
    let isReporRgDate = (dataRequest || {}).isReporRgDate;
    let dateList = (dataRequest || []).dateList || [];

    let confConsulting = [
      {
        socket: (socket || {}).id,
        isReportForDay: isReportForDay,
        isReportTotal: isReportTotal,
        isReportMtDate: isReportMtDate,
        isReporRgDate: isReporRgDate,
        centroCosto: (dataRequest || {}).centroCosto,
        dateList: dateList,
      },
    ];
    
    io.emit("searchAsistencia", confConsulting);
  });

  socket.on("update:file:FrontAgent", (body) => {
    let configurationList = {
      socket: (socket || {}).id,
      hash: body.hash,
      fileName: body.fileName,
    };

    if (socket.decoded.aud == "ADMINISTRADOR") {
      socket.broadcast.emit("update_file_Agente", configurationList);
    }
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

  socket.on("conexion:serverICG", (data) => {
    //  socket.broadcast.emit("conexion:serverICG:send", data);
  });

  socket.on("disconnect", async () => {
    if (codeTerminal == "SRVFACT") {
      sessionSocket.disconnectServer();
      socket.broadcast.emit("status:serverSUNAT:send", {
        code: "SRVFACT",
        online: "false",
      });
    } else if (isIcg != "true") {
      console.log(`disconnect ${codeTerminal} - idApp`, listClient.id);
      let listSessionDisconnet = await sessionSocket.disconnect(codeTerminal);
      socket
        .to(`${listClient.id}`)
        .emit("sessionConnect", listSessionDisconnet);
    }

    if (isIcg == "true") {
      socket.broadcast.emit("conexion:serverICG:send", [
        { code: codeTerminal, isConect: "0" },
      ]);
    }

    console.log("user disconnected");
  });

  socket.on("status:serverSUNAT", (data) => {
    socket.broadcast.emit("status:serverSUNAT:send", data);
  });

  let listSessionConnect = await sessionSocket.connect(codeTerminal);
  socket.to(`${listClient.id}`).emit("sessionConnect", listSessionConnect);

  if (codeTerminal != "SRVFACT" && isIcg != "true") {
    let listSessionConnect = await sessionSocket.connect(codeTerminal);
    socket.to(`${listClient.id}`).emit("sessionConnect", listSessionConnect);
  } else {
    if (codeTerminal == "SRVFACT") {
      /* emailController.sendEmail('johnnygermano@grupodavid.com', `SERVIDOR FACTURACION CONECTADO..!!!!!`, null, null, `SERVIDOR FACTURACION`)
                 .catch(error => res.send(error));*/
    }
  }

  app.post("/sunat-notification", async (req, res) => {
    let arrDocumento = ((req || []).body || [])[0] || {};
    let tiendasList = [
      {
        code: "7A",
        name: "BBW JOCKEY",
        email: "bbwjockeyplaza@grupodavid.com",
      },
      {
        code: "9N",
        name: "VS MALL AVENTURA",
        email: "vsmallaventura@grupodavid.com",
      },
      {
        code: "7J",
        name: "BBW MALL AVENTURA",
        email: "bbwmallaventura@grupodavid.com",
      },
      {
        code: "PC",
        name: "AEO JOCKEY",
        email: "americaneaglejp@grupodavid.com",
      },
      {
        code: "7E",
        name: "BBW LA RAMBLA",
        email: "bbwlarambla@grupodavid.com",
      },
      { code: "9D", name: "VS LA RAMBLA", email: "vslarambla@grupodavid.com" },
      {
        code: "9B",
        name: "VS PLAZA NORTE",
        email: "vsplazanorte@grupodavid.com",
      },
      {
        code: "7C",
        name: "BBW SAN MIGUEL",
        email: "bbwsanmiguel@grupodavid.com",
      },
      {
        code: "9C",
        name: "VS SAN MIGUEL",
        email: "vssanmiguel@grupodavid.com",
      },
      {
        code: "7D",
        name: "BBW SALAVERRY",
        email: "bbwsalaverry@grupodavid.com",
      },
      { code: "9I", name: "VS SALAVERRY", email: "vssalaverry@grupodavid.com" },
      {
        code: "9G",
        name: "VS MALL DEL SUR",
        email: "vsmalldelsur@grupodavid.com",
      },
      { code: "9H", name: "VS PURUCHUCO", email: "vspuruchuco@grupodavid.com" },
      { code: "9M", name: "VS ECOMMERCE", email: "vsecommpe@grupodavid.com" },
      {
        code: "7F",
        name: "BBW ECOMMERCE",
        email: "bbwecommperu@grupodavid.com",
      },
      { code: "PA", name: "AEO ECOMMERCE", email: "aeecompe@grupodavid.com" },
      {
        code: "9K",
        name: "VS MEGA PLAZA",
        email: "vsmegaplaza@grupodavid.com",
      },
      { code: "9L", name: "VS MINKA", email: "vsoutletminka@grupodavid.com" },
      {
        code: "9F",
        name: "VSFA JOCKEY FULL",
        email: "vsfajockeyplaza@grupodavid.com",
      },
      { code: "7A7", name: "BBW ASIA", email: "bbwasia@grupodavid.com" },
    ];

    if (
      (arrDocumento || {}).CODIGO_ERROR_SUNAT == 2800 ||
      (arrDocumento || {}).CODIGO_ERROR_SUNAT == 1032 ||
      (arrDocumento || {}).CODIGO_ERROR_SUNAT == 2022
    ) {
      let [verifyDocument] = await pool.query(
        `SELECT * FROM TB_DOCUMENTOS_ERROR_SUNAT WHERE CODIGO_DOCUMENTO = ${
          (arrDocumento || {}).CODIGO_DOCUMENTO
        };`
      );
      let isEmailEnvio =
        ((verifyDocument || [])[0] || {}).ENVIO_EMAIL || "false";
      console.log("verifyDocument", verifyDocument);

      if (!(verifyDocument || []).length) {
        await pool.query(`INSERT INTO TB_DOCUMENTOS_ERROR_SUNAT(CODIGO_DOCUMENTO,NRO_CORRELATIVO,NOM_ADQUIRIENTE,NRO_DOCUMENTO,TIPO_DOCUMENTO_ADQUIRIENTE,OBSERVACION,ESTADO_SUNAT,ESTADO_COMPROBANTE,CODIGO_ERROR_SUNAT,ENVIO_EMAIL,FECHA_EMISION)
                                VALUES(${(arrDocumento || {}).CODIGO_DOCUMENTO},
                                '${(arrDocumento || {}).NRO_CORRELATIVO}',
                                '${(arrDocumento || {}).NOM_ADQUIRIENTE}',
                                '${(arrDocumento || {}).NRO_DOCUMENTO}',
                                '${
                                  (arrDocumento || {})
                                    .TIPO_DOCUMENTO_ADQUIRIENTE
                                }',
                                '${(arrDocumento || {}).OBSERVACION}',
                                '${(arrDocumento || {}).ESTADO_SUNAT}',
                                '${(arrDocumento || {}).ESTADO_COMPROBANTE}',
                                '${(arrDocumento || {}).CODIGO_ERROR_SUNAT}',
                                'false',
                                '${(arrDocumento || {}).FECHA_EMISION}');`);

        res.send("RECEPCION EXITOSA..!!");
      } else {
        await pool.query(`UPDATE TB_DOCUMENTOS_ERROR_SUNAT SET
                                NOM_ADQUIRIENTE ='${
                                  (arrDocumento || {}).NOM_ADQUIRIENTE
                                }',
                                NRO_DOCUMENTO = '${
                                  (arrDocumento || {}).NRO_DOCUMENTO
                                }',
                                TIPO_DOCUMENTO_ADQUIRIENTE = '${
                                  (arrDocumento || {})
                                    .TIPO_DOCUMENTO_ADQUIRIENTE
                                }',
                                OBSERVACION = '${
                                  (arrDocumento || {}).OBSERVACION
                                }',
                                ESTADO_SUNAT = '${
                                  (arrDocumento || {}).ESTADO_SUNAT
                                }',
                                ESTADO_COMPROBANTE = '${
                                  (arrDocumento || {}).ESTADO_COMPROBANTE
                                }',
                                CODIGO_ERROR_SUNAT = '${
                                  (arrDocumento || {}).CODIGO_ERROR_SUNAT
                                }' WHERE CODIGO_DOCUMENTO = ${
          (arrDocumento || {}).CODIGO_DOCUMENTO
        };`);
        res.send("RECEPCION EXITOSA..!!");
      }

      let [documentList] = await pool.query(
        `SELECT * FROM TB_DOCUMENTOS_ERROR_SUNAT;`
      );
      socket.to(`${listClient.id}`).emit("sendNotificationSunat", documentList);

      var bodyHTML = templateHtmlController.errorSunat(arrDocumento);

      let serie = ((arrDocumento || {}).NRO_CORRELATIVO || "").split("-")[0];

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

      if (Object.keys(selectedLocal).length && isEmailEnvio != "true") {
        console.log("sunat:codigo_tienda", codigo);
        console.log("sunat:tienda", selectedLocal);

        await pool.query(
          `UPDATE TB_DOCUMENTOS_ERROR_SUNAT SET ENVIO_EMAIL ='true' WHERE CODIGO_DOCUMENTO = ${
            (arrDocumento || {}).CODIGO_DOCUMENTO
          };`
        );

        /* emailController.sendEmail([(selectedLocal || {}).email || '', 'johnnygermano@grupodavid.com'], `FACTURA CON RUC ERRADO ${(selectedLocal || {}).name || ''}`, bodyHTML, null, null)
                     .catch(error => res.send(error));*/
      }
    }
  });

  console.log(`connect ${codeTerminal} - idApp`, listClient.id);
  console.log("a user connected");
});

httpServer.listen(4200, async () => {
  console.log("listening on *:4200");
});
