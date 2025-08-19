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
}

const scheduleController = new clsSchedule;
export default scheduleController;