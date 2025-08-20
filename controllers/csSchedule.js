import { pool } from '../conections/conexMysql.js';
import mdwErrorHandler from '../middleware/errorHandler.js';

class clsSchedule {

    allSchedule = (req, res) => {
        pool.query(`SELECT RANGO_DIAS,CODIGO_TIENDA FROM TB_HORARIO_PROPERTY ORDER BY  DATEDIFF(DATE(SUBSTRING_INDEX(RANGO_DIAS,' ',1)), CURDATE()) asc;`).then(([requestSql]) => {
            let responseJSON = [];
            (requestSql || []).filter((schedule) => {
                (responseJSON || []).push({
                    range_days: (schedule || {}).RANGO_DIAS,
                    code_store: (schedule || {}).CODIGO_TIENDA
                });
            });

            res.json(responseJSON);
        });
    }

    generateSchedule = (req, res) => {
        let dataSchedule = ((req || {}).body || []);
        let code_store = ((dataSchedule || [])[0] || {})['code_store'];
        let range = ((dataSchedule || [])[0] || {})['range'];
        let resSchedule = [];

        await(dataSchedule || []).filter(async (schedule, indexSchedule) => {
            let [arScheduleProperty] = await pool.query(`SELECT * FROM TB_HORARIO_PROPERTY WHERE RANGO_DIAS = '${(schedule || {}).range}' AND CODIGO_TIENDA = '${(schedule || {}).code_store}';`);
            if (!(arScheduleProperty || []).length) {
                await pool.query(`INSERT INTO TB_HORARIO_PROPERTY(CARGO,CODIGO_TIENDA,FECHA,RANGO_DIAS)VALUES('${(schedule || {}).cargo}','${(schedule || {}).code_store}','${(schedule || {}).date}','${(schedule || {}).range}')`);

                if (indexSchedule == 3) {
                    let [requestProperty] = await pool.query(`SELECT * FROM TB_HORARIO_PROPERTY WHERE CODIGO_TIENDA = '${code_store}' AND RANGO_DIAS = '${range}';`);

                    if (!(requestProperty || []).length) {
                        res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'Error', message: 'Ocurrio un error al generar horario.', api: '/schedule/generate', data: [] }));
                    } else {
                        await (requestProperty || []).filter(async (sql, indexSql) => {
                            let arDays = [];
                            (schedule || [])['dias'].filter(async (scheduleDay) => {
                                await pool.query(`INSERT INTO TB_DIAS_HORARIO(DIA,FECHA,ID_DIA_HORARIO,POSITION,FECHA_NUMBER)VALUES('${(scheduleDay || {}).dia}','${(scheduleDay || {}).fecha}',${(sql || {}).ID_HORARIO},${(scheduleDay || {}).id},'${(scheduleDay || {}).fecha_number}');`);
                            });

                            let [requestDays] = await pool.query(`SELECT * FROM TB_DIAS_HORARIO WHERE ID_DIA_HORARIO = ${sql.ID_HORARIO} ORDER BY POSITION  ASC;`);
                            await (requestDays || []).filter(async (reqDay) => {
                                (arDays || []).push({ dia: (reqDay || {}).DIA, fecha: (reqDay || {}).FECHA, fecha_number: (reqDay || {}).FECHA_NUMBER, id: (reqDay || {}).ID_DIAS, position: (reqDay || {}).position, isExpired: false });
                            });

                            (resSchedule || []).push({
                                id: (sql || {}).ID_HORARIO,
                                cargo: (sql || {}).CARGO,
                                codigo_tienda: (sql || {}).CODIGO_TIENDA,
                                rg_hora: [],
                                dias: arDia || [],
                                dias_trabajo: [],
                                dias_libres: [],
                                arListTrabajador: [],
                                observacion: []
                            });

                            if (indexSql == 3) {
                                res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/schedule/generate', data: resSchedule }));
                            }
                        });
                    }
                }

            } else {
                res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'Error', message: 'Ya existe un calendario con este rango de fecha.', api: '/schedule/generate', data: [] }));
            }
        });
    }

    searchSchedule = async (req, res) => {
        let range_days = ((req || {}).body || {}).range_days;
        let code_store = ((req || {}).body || {}).code_store;

        let responseSchedule = [];
        let arObservation = [];
        let [requestSql] = await pool.query(`SELECT * FROM TB_HORARIO_PROPERTY WHERE CODIGO_TIENDA = '${code_store}' AND RANGO_DIAS = '${range_days}';`);

        await (requestSql || []).filter(async (sql) => {
            (responseSchedule || []).push({
                id: (sql || {}).ID_HORARIO,
                cargo: (sql || {}).CARGO,
                codigo_tienda: (sql || {}).CODIGO_TIENDA,
                rg_hora: [],
                dias: [],
                dias_trabajo: [],
                dias_libres: [],
                arListTrabajador: [],
                observacion: []
            });
        });

        if (responseSchedule.length) {
            (responseSchedule || []).filter(async (dth, index) => {

                pool.query(`SELECT * FROM TB_RANGO_HORA WHERE ID_RG_HORARIO = ${dth.id};`).then(([requestRange]) => {
                    (requestRange || []).filter(async (rdh) => {
                        (((responseSchedule || [])[index] || {})['rg_hora'] || []).push({
                            id: (rdh || {}).ID_RANGO_HORA,
                            position: (((responseSchedule || [])[index] || {})['rg_hora'] || []).length + 1,
                            rg: (rdh || {}).RANGO_HORA,
                            codigo_tienda: code_store
                        });
                    });

                    pool.query(`SELECT * FROM TB_DIAS_HORARIO WHERE ID_DIA_HORARIO = ${dth.id} ORDER BY POSITION  ASC;`).then(([requestDay]) => {
                        (requestDay || []).filter(async (rdh) => {
                            (((responseSchedule || [])[index] || {})['dias'] || []).push({
                                dia: (rdh || {}).DIA,
                                fecha: (rdh || {}).FECHA,
                                fecha_number: (rdh || {}).FECHA_NUMBER,
                                id: (rdh || {}).ID_DIAS,
                                position: (((responseSchedule || [])[index] || {})['dias'] || []).length + 1
                            });
                        });

                        pool.query(`SELECT * FROM TB_DIAS_TRABAJO WHERE ID_TRB_HORARIO = ${dth.id};`).then(([requestDayWork]) => {
                            (requestDayWork || []).filter(async (rdb) => {
                                (((responseSchedule || [])[index] || {})['dias_trabajo'] || []).push({
                                    id: (rdb || {}).ID_DIA_TRB,
                                    id_cargo: (rdb || {}).ID_TRB_HORARIO,
                                    id_dia: (rdb || {}).ID_TRB_DIAS,
                                    nombre_completo: (rdb || {}).NOMBRE_COMPLETO,
                                    numero_documento: (rdb || {}).NUMERO_DOCUMENTO,
                                    rg: (rdb || {}).ID_TRB_RANGO_HORA,
                                    codigo_tienda: (rdb || {}).CODIGO_TIENDA
                                });
                            });

                            pool.query(`SELECT * FROM TB_DIAS_LIBRE WHERE ID_TRB_HORARIO = ${dth.id};`).then(([requestDayFree]) => {
                                (requestDayFree || []).filter(async (rdb) => {
                                    (((responseSchedule || [])[index] || {})['dias_libres'] || []).push({
                                        id: (rdb || {}).ID_DIA_LBR,
                                        id_cargo: (rdb || {}).ID_TRB_HORARIO,
                                        id_dia: (rdb || {}).ID_TRB_DIAS,
                                        nombre_completo: (rdb || {}).NOMBRE_COMPLETO,
                                        numero_documento: (rdb || {}).NUMERO_DOCUMENTO,
                                        rg: (rdb || {}).ID_TRB_RANGO_HORA,
                                        codigo_tienda: (rdb || {}).CODIGO_TIENDA
                                    });
                                });

                                pool.query(`SELECT * FROM TB_OBSERVACION WHERE ID_OBS_HORARIO = ${dth.id};`).then(async (requestObservation) => {
                                    const [row, field] = requestObservation;

                                    await (row || []).filter(async (obs) => {
                                        (((responseSchedule || [])[index] || {})['observacion'] || []).push({
                                            id: (obs || {}).ID_OBSERVACION,
                                            id_dia: (obs || {}).ID_OBS_DIAS,
                                            nombre_completo: (obs || {}).NOMBRE_COMPLETO,
                                            observacion: (obs || {}).OBSERVACION
                                        });
                                    });

                                    (arObservation || []).push("true");

                                    if ((requestSql || []).length - 1 == index) {
                                        setTimeout(() => {
                                            res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/schedule/search', data: responseSchedule }));
                                        }, 2000);
                                    }
                                });
                            });
                        });
                    });
                });
            });
        } else {
            res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'OK', message: 'No hay ningun calendario en este rago de fecha.', api: '/schedule/search', data: [] }));
        }
    }

    inRange = (req, res) => {
        let code_store = ((req || {}).body || {}).code_store;
        let range = ((req || {}).body || {}).range;
        let id_schedule = ((req || {}).body || {}).id_schedule;

        pool.query(`INSERT INTO TB_RANGO_HORA(CODIGO_TIENDA,RANGO_HORA,ID_RG_HORARIO) VALUES('${code_store}','${range}',${id_schedule})`).then(() => {
            pool.query(`SELECT * FROM TB_RANGO_HORA WHERE CODIGO_TIENDA = '${code_store}' AND RANGO_HORA = '${range}' AND ID_RG_HORARIO = ${id_schedule} ORDER by ID_RANGO_HORA DESC LIMIT 1;`).then(([responseSQL]) => {
                res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/schedule/range', data: [{ id_range_date: ((responseSQL || [])[0] || {})['ID_RANGO_HORA'] }] }));
            });
        }).catch((err) => {
            res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'Error', message: err, api: '/schedule/range', data: [] }));
        });
    }

    updRange = (req, res) => {
        let id_range = ((req || {}).body || {}).id_range;
        let range = ((req || {}).body || {}).range;
        pool.query(`UPDATE TB_RANGO_HORA SET RANGO_HORA = '${range}' WHERE ID_RANGO_HORA = ${id_range}`).then(() => {
            res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/schedule/range', data: [] }));
        }).catch((err) => {
            res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'Error', message: err, api: '/schedule/range', data: [] }));
        });
    }

    inDayWork = (req, res) => {
        let code_store = ((req || {}).body || {}).code_store;
        let identity_document = ((req || {}).body || {}).identity_document;
        let full_name = ((req || {}).body || {}).full_name;
        let id_range = ((req || {}).body || {}).id_range;
        let id_day = ((req || {}).body || {}).id_day;
        let id_schedule = ((req || {}).body || {}).id_schedule;

        pool.query(`SET FOREIGN_KEY_CHECKS=0;`);
        pool.query(`INSERT INTO TB_DIAS_TRABAJO(CODIGO_TIENDA,NUMERO_DOCUMENTO,NOMBRE_COMPLETO,ID_TRB_RANGO_HORA,ID_TRB_DIAS,ID_TRB_HORARIO) VALUES('${(row || {}).codigo_tienda}','${(row || {}).numero_documento}','${(row || {}).nombre_completo}',${(row || {}).id_rango},${(row || {}).id_dia},${(row || {}).id_horario})`).then(() => {
            pool.query(`SELECT * FROM TB_DIAS_TRABAJO WHERE CODIGO_TIENDA = '${code_store}' AND NUMERO_DOCUMENTO = '${identity_document}' AND NOMBRE_COMPLETO = '${full_name}' AND ID_TRB_RANGO_HORA = ${id_range} AND ID_TRB_DIAS = ${id_day} AND ID_TRB_HORARIO = ${id_schedule} ORDER by ID_DIA_TRB DESC LIMIT 1;`).then(([requestSql]) => {
                res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/schedule/day/work', data: [{ id_day_work: ((requestSql || [])[0] || {})['ID_DIA_TRB'] }] }));
            });
        }).catch((err) => {
            res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'Error', message: err, api: '/schedule/day/work', data: [] }));
        });
    }

    delDayWork = (req, res) => {
        let id_daywork = ((req || {}).query || {}).id_daywork || "";
        pool.query(`DELETE FROM TB_DIAS_TRABAJO WHERE ID_DIA_TRB = ${id_daywork};`).then(() => {
            res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/schedule/day/work', data: [] }));
        }).catch((err) => {
            res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'OK', message: err, api: '/schedule/day/work', data: [] }));
        });
    }

    inDayFree = (req, res) => {

        let code_store = ((req || {}).body || {}).code_store;
        let identity_document = ((req || {}).body || {}).identity_document;
        let full_name = ((req || {}).body || {}).full_name;
        let id_range = ((req || {}).body || {}).id_range;
        let id_day = ((req || {}).body || {}).id_day;
        let id_schedule = ((req || {}).body || {}).id_schedule;

        pool.query(`SET FOREIGN_KEY_CHECKS=0;`);
        pool.query(`INSERT INTO TB_DIAS_LIBRE(CODIGO_TIENDA,NUMERO_DOCUMENTO,NOMBRE_COMPLETO,ID_TRB_RANGO_HORA,ID_TRB_DIAS,ID_TRB_HORARIO) VALUES('${code_store}','${identity_document}','${full_name}',${id_range},${id_day},${id_schedule})`).then(() => {
            pool.query(`SELECT * FROM TB_DIAS_LIBRE WHERE CODIGO_TIENDA = '${code_store}' AND NUMERO_DOCUMENTO = '${identity_document}' AND NOMBRE_COMPLETO = '${full_name}' AND ID_TRB_RANGO_HORA = ${id_range} AND ID_TRB_DIAS = ${id_day} AND ID_TRB_HORARIO = ${id_schedule} ORDER by ID_DIA_LBR DESC LIMIT 1;`).then(([responseSQL]) => {

                let jsonResponse = [{
                    id_day_free: ((responseSQL || [])[0] || {})['ID_DIA_LBR']
                }];

                res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/schedule/day/free', data: jsonResponse }));
            });
        }).catch((err) => {
            res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'Error', message: err, api: '/schedule/day/free', data: [] }));
        });
    }

    delDayFree = (req, res) => {
        let id_dayfree = ((req || {}).query || {}).id_dayfree;

        pool.query(`SELECT * FROM TB_DIAS_LIBRE WHERE ID_DIA_LBR = ${id_dayfree};`).then(([responseSQL]) => {
            pool.query(`DELETE FROM TB_DIAS_LIBRE WHERE ID_DIA_LBR = ${((responseSQL || [])[0] || {})['ID_DIA_LBR']};`).then(() => {
                res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/schedule/day/free', data: [] }));
            }).catch((err) => {
                res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'Error', message: err, api: '/schedule/day/free', data: [] }));
            });
        })
    }

    inObservation = async (req, res) => {
        let id_day = ((req || {}).query || {}).id_day;
        let id_schedule = ((req || {}).query || {}).id_schedule;
        let code_store = ((req || {}).query || {}).code_store;
        let full_name = ((req || {}).query || {}).full_name;
        let observation = ((req || {}).query || {}).observation;

        await pool.query(`SET FOREIGN_KEY_CHECKS=0;`);
        pool.query(`INSERT INTO TB_OBSERVACION(ID_OBS_DIAS,ID_OBS_HORARIO,CODIGO_TIENDA,NOMBRE_COMPLETO,OBSERVACION) VALUES(${id_day},${id_schedule},'${code_store}','${full_name}','${observation}')`).then(() => {
            pool.query(`SELECT * FROM TB_OBSERVACION WHERE ID_OBS_DIAS = ${id_day} AND ID_OBS_HORARIO = ${id_schedule} AND CODIGO_TIENDA = '${code_store}' AND NOMBRE_COMPLETO = '${full_name}' AND OBSERVACION = '${observation}' ORDER by ID_OBSERVACION DESC LIMIT 1;`).then(([responseSQL]) => {
                res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/schedule/observation', data: [{ id_observation: ((responseSQL || [])[0] || {})['ID_OBSERVACION'] }] }));
            });
        }).catch((err) => {
            res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'Error', message: err, api: '/schedule/observation', data: [] }));
        });
    }

    updObservation = (req, res) => {
        let id_observation = ((req || {}).body || {}).id_observation;
        let new_observation = ((req || {}).body || {}).new_observation;

        pool.query(`UPDATE TB_OBSERVACION SET OBSERVACION = '${new_observation}' WHERE ID_OBSERVACION = ${id_observation};`).then(() => {
            res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/schedule/observation', data: [] }));
        }).catch((err) => {
            res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'Error', message: err, api: '/schedule/observation', data: [] }));
        });
    }

    delObservation = (req, res) => {
        let id_observation = ((req || {}).query || {}).id_observation;
        pool.query(`DELETE FROM TB_OBSERVACION WHERE ID_OBSERVACION = ${id_observation};`).then(() => {
            res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/schedule/observation', data: [] }));
        }).catch((err) => {
            res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'Error', message: err, api: '/schedule/observation', data: [] }));
        });
    }

    registerSchedule = (req, res) => {
        // schedule/register - [POST][{id,cargo,date,range,code,range_date,days,days_work,days_free,arWorkers,observation}]
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
                                                        res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/schedule/register', data: response }));
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
    }
}

const scheduleController = new clsSchedule;
export default scheduleController;