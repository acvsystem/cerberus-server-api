import { pool } from "../conections/conexMysql.js";
import { prop as defaultResponse } from "../const/defaultResponse.js";
import tokenController from "./csToken.js";
import Jwt from "jsonwebtoken";
import request from "request";

//SE GENERA EL CODIGO PARA PAPELETA SEGUN SERIE DE TIENDA
export const generarCodigo = async (req, res) => {
    let data = ((req || {}).body || []);
    let codigo_tienda = (data || {}).serie_tienda;
    let [arPapeleta] = await pool.query(`SELECT * FROM TB_HEAD_PAPELETA WHERE CODIGO_TIENDA = '${codigo_tienda}';`);
    console.log((arPapeleta || []).length);
    let newCodigo = `P${codigo_tienda}${(arPapeleta || []).length + 1}`;
    res.json({ codigo: newCodigo })
}

//SE INSERTA EN LA TABLA HORA EXTRA GENERAL COMO UNA TABLA PRODUCTOS
export const regHorasExtras = async (req, res) => {
    let data = ((req || {}).body || []);
    let dataResponse = [];


    await (data || []).filter(async (hrx, i) => {

        let [existHrx] = await pool.query(`SELECT * FROM TB_HORA_EXTRA_EMPLEADO WHERE NRO_DOCUMENTO_EMPLEADO = '${(hrx || {}).documento}' AND FECHA = '${(hrx || {}).fecha}' AND  HR_EXTRA_ACUMULADO = '${(hrx || {}).hrx_acumulado}'`);

        if (!(existHrx || []).length || typeof existHrx == 'undefined') {
            let fh = ((hrx || {}).fecha || "").split("-");
            let fecha = (hrx || {}).fecha;
            let fechaHr = parseInt(fh[1]) < 10 ? `${fh[0]}-${parseInt(fecha.split("-")[1].substr(0, 1)) == 0 ? fecha.split("-")[1].substr(1, 2) : fecha.split("-")[1].substr(0, 2)}-${fh[2]}` : (hrx || {}).fecha;

            let [arFeriado] = await pool.query(`SELECT * FROM TB_DIAS_LIBRE 
                INNER JOIN TB_DIAS_HORARIO ON TB_DIAS_HORARIO.ID_DIA_HORARIO = TB_DIAS_LIBRE.ID_TRB_HORARIO
                WHERE TB_DIAS_LIBRE.NUMERO_DOCUMENTO = '${(hrx || {}).documento}'
                AND FECHA_NUMBER = '${fechaHr}';`);

            console.log(arFeriado, (hrx || {}).hr_trabajadas);

            let hrxAcomulado = arFeriado.length ? (hrx || {}).hr_trabajadas : (hrx || {}).hrx_acumulado;

            await pool.query(`INSERT INTO TB_HORA_EXTRA_EMPLEADO(
                    NRO_DOCUMENTO_EMPLEADO,
                    HR_EXTRA_ACUMULADO,
                    HR_EXTRA_SOLICITADO,
                    HR_EXTRA_SOBRANTE,
                    ESTADO,
                    APROBADO,
                    SELECCIONADO,
                    FECHA,
                    FECHA_MODIFICACION
                    )VALUES(
                    '${(hrx || {}).documento}',
                    '${hrxAcomulado || '00:00'}',
                    '00:00',
                    '00:00',
                    '${(hrx || {}).estado}',
                    '${(hrx || {}).aprobado ? 1 : 0}',
                    '${(hrx || {}).seleccionado ? 1 : 0}',
                    '${(hrx || {}).fecha}',
                    '${(hrx || {}).fecha}');`)
                .catch((err) => {
                    console.log(err)
                });

        }

        if ((data || []).length - 1 == i) {
            await (data || []).filter(async (hrx, i) => {
                let [arHrExtra] = await pool.query(`SELECT * FROM TB_HORA_EXTRA_EMPLEADO WHERE NRO_DOCUMENTO_EMPLEADO = '${hrx['documento']}' AND FECHA = '${hrx['fecha']}';`);

                if ((arHrExtra || []).length || typeof arHrExtra != 'undefined') {

                    (dataResponse || []).push({
                        id_hora_extra: ((arHrExtra || [])[0] || {})['ID_HR_EXTRA'],
                        documento: (hrx || {}).documento,
                        codigo_papeleta: (hrx || {}).codigo_papeleta,
                        fecha: (hrx || {}).fecha,
                        hrx_acumulado: (hrx || {}).hrx_acumulado,
                        extra: (hrx || {}).extra,
                        hrx_solicitado: ((arHrExtra || [])[0] || {})['HR_EXTRA_SOLICITADO'] || '00:00',
                        hrx_sobrante: ((arHrExtra || [])[0] || {})['HR_EXTRA_SOBRANTE'] || '00:00',
                        estado: (hrx || {}).estado || ((arHrExtra || [])[0] || {})['ESTADO'],
                        aprobado: ((arHrExtra || [])[0] || {})['APROBADO'] == 1 ? true : false,
                        seleccionado: ((arHrExtra || [])[0] || {})['SELECCIONADO'] == 1 ? true : false,
                        verify: ((arHrExtra || [])[0] || {})['SELECCIONADO'] == 1 ? true : false,
                        arFechas: (hrx || {}).arFechas || []
                    });
                } else {
                    data[i]['verify'] = false;
                    (dataResponse || []).push(hrx);
                }

                if ((data || []).length == (dataResponse || []).length) {
                    res.json(dataResponse);
                }
            });
        }
    });


}

//REGISTRO DE PAPELETA TANTO EL HEAD COMO EL DETALLE DONDE SE REGISTRAN O SE ENLAZAN CON LAS HORAS EXTRAS REGISTRADAS
export const regPapeleta = async (req, res) => {
    let data = ((req || {}).body || []);

    await pool.query(`INSERT INTO TB_HEAD_PAPELETA(
            CODIGO_PAPELETA,
            NOMBRE_COMPLETO,
            NRO_DOCUMENTO_EMPLEADO,
            ID_PAP_TIPO_PAPELETA,
            CARGO_EMPLEADO,
            FECHA_DESDE,
            FECHA_HASTA,
            HORA_SALIDA,
            HORA_LLEGADA,
            HORA_ACUMULADA,
            HORA_SOLICITADA,
            CODIGO_TIENDA,
            FECHA_CREACION,
            DESCRIPCION
            )VALUES(
            '${(data || [])[0].codigo_papeleta}',
            '${(data || [])[0].nombre_completo}',
            '${(data || [])[0].documento}',
            '${(data || [])[0].id_tipo_pap}',
            '${(data || [])[0].cargo_empleado}',
            '${(data || [])[0].fecha_desde}',
            '${(data || [])[0].fecha_hasta}',
            '${(data || [])[0].hora_salida}',
            '${(data || [])[0].hora_llegada}',
            '${(data || [])[0].hora_acumulado}',
            '${(data || [])[0].hora_solicitada}',
            '${(data || [])[0].codigo_tienda}',
            '${(data || [])[0].fecha_creacion}',
            '${(data || [])[0].descripcion}');`)
        .then(async () => {
            let arHorasExtra = (data || [])[0].horas_extras;

            if ((arHorasExtra || []).length) {
                (arHorasExtra || []).filter(async (hrx) => {
                    if (hrx.checked) {
                        let sobrante = hrx.hrx_sobrante;
                        let [arHeadPap] = await pool.query(`SELECT * FROM TB_HEAD_PAPELETA WHERE CODIGO_TIENDA = '${(data || [])[0].codigo_tienda}' ORDER BY ID_HEAD_PAPELETA DESC LIMIT 1;`);

                        console.log(`INSERT INTO TB_DETALLE_PAPELETA(
                            DET_ID_HEAD_PAPELETA,
                            DET_ID_HR_EXTRA,
                            HR_EXTRA_ACUMULADO,
                            HR_EXTRA_SOLICITADO,
                            HR_EXTRA_SOBRANTE,
                            ESTADO,
                            APROBADO,
                            SELECCIONADO,
                            FECHA,
                            FECHA_MODIFICACION
                            )VALUES(
                            ${arHeadPap[0]['ID_HEAD_PAPELETA']},
                            ${hrx.id_hora_extra},
                            '${hrx.hrx_acumulado}',
                            '${hrx.hrx_solicitado}',
                            '${sobrante}',
                            '${hrx.estado}',
                            '${hrx.aprobado == true ? 1 : 0}',
                            '${hrx.checked == true ? 1 : 0}',
                            '${hrx.fecha}',
                            ''
                            );`);

                        pool.query(`INSERT INTO TB_DETALLE_PAPELETA(
                            DET_ID_HEAD_PAPELETA,
                            DET_ID_HR_EXTRA,
                            HR_EXTRA_ACUMULADO,
                            HR_EXTRA_SOLICITADO,
                            HR_EXTRA_SOBRANTE,
                            ESTADO,
                            APROBADO,
                            SELECCIONADO,
                            FECHA,
                            FECHA_MODIFICACION
                            )VALUES(
                            ${arHeadPap[0]['ID_HEAD_PAPELETA']},
                            ${hrx.id_hora_extra},
                            '${hrx.hrx_acumulado}',
                            '${hrx.hrx_solicitado}',
                            '${sobrante}',
                            '${hrx.estado}',
                            '${hrx.aprobado == true ? 1 : 0}',
                            '${hrx.checked == true ? 1 : 0}',
                            '${hrx.fecha}',
                            ''
                            );`)
                            .then(() => {
                                res.json(defaultResponse.success.default);
                            });

                        console.log(`UPDATE TB_HORA_EXTRA_EMPLEADO SET HR_EXTRA_SOLICITADO = '${hrx.hrx_solicitado}',
                             ESTADO = '${hrx.estado}', HR_EXTRA_SOBRANTE = '${sobrante}'
                             WHERE ID_HR_EXTRA = ${hrx.id_hora_extra};`);

                        pool.query(`UPDATE TB_HORA_EXTRA_EMPLEADO SET HR_EXTRA_SOLICITADO = '${hrx.hrx_solicitado}',
                             ESTADO = '${hrx.estado}', HR_EXTRA_SOBRANTE = '${sobrante}'
                             WHERE ID_HR_EXTRA = ${hrx.id_hora_extra};`);

                    }
                });
            } else {
                res.json(defaultResponse.success.default);
            }


        })
        .catch((err) => {
            console.log(err);
            res.json(defaultResponse.error.default);
        });
}

export const listPapeleta = async (req, res) => {
    let data = req.body;
    let [arPapeleta] = await pool.query(`SELECT * FROM TB_HEAD_PAPELETA WHERE CODIGO_TIENDA = '${data[0].codigo_tienda}';`);
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
}


export const seachPapeleta = async (req, res) => {
    let data = req.body;
    console.log(`SELECT * FROM TB_DETALLE_PAPELETA 
                                        INNER JOIN TB_HEAD_PAPELETA ON TB_DETALLE_PAPELETA.DET_ID_HEAD_PAPELETA = TB_HEAD_PAPELETA.ID_HEAD_PAPELETA
                                        INNER JOIN TB_HORA_EXTRA_EMPLEADO ON TB_DETALLE_PAPELETA.DET_ID_HR_EXTRA = TB_HORA_EXTRA_EMPLEADO.ID_HR_EXTRA 
                                        WHERE TB_HEAD_PAPELETA.CODIGO_PAPELETA = '${data[0].codigo_papeleta}';`);
    let [arPapeleta] = await pool.query(`SELECT * FROM TB_HEAD_PAPELETA WHERE CODIGO_PAPELETA = '${data[0].codigo_papeleta}';`);
    let parsePap = [];
    let [arHrExtra] = await pool.query(`SELECT    CODIGO_PAPELETA,
                    TB_HEAD_PAPELETA.NRO_DOCUMENTO_EMPLEADO,
                    TB_DETALLE_PAPELETA.HR_EXTRA_ACUMULADO,
                    TB_DETALLE_PAPELETA.HR_EXTRA_SOLICITADO,
                    TB_DETALLE_PAPELETA.HR_EXTRA_SOBRANTE,
                    TB_DETALLE_PAPELETA.ESTADO,
                    TB_DETALLE_PAPELETA.APROBADO,
                    TB_DETALLE_PAPELETA.SELECCIONADO,
                    TB_DETALLE_PAPELETA.FECHA FROM  TB_HEAD_PAPELETA 
                    INNER JOIN TB_DETALLE_PAPELETA ON TB_HEAD_PAPELETA.ID_HEAD_PAPELETA  = TB_DETALLE_PAPELETA.DET_ID_HEAD_PAPELETA
                    WHERE TB_HEAD_PAPELETA.CODIGO_PAPELETA = '${data[0].codigo_papeleta}';`);

    if ((arPapeleta || []).length) {
        await (arPapeleta || []).filter((pap) => {
            parsePap.push({
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
                descripcion: (pap || {}).DESCRIPCION,
                horas_extras: []
            });
        });

        if ((arHrExtra || []).length) {
            await (arHrExtra || []).filter((hrx) => {
                if ((hrx || {}).SELECCIONADO == 1) {
                    parsePap[0]['horas_extras'].push({
                        codigoGenerado: (hrx || {}).CODIGO_PAPELETA,
                        documento: (hrx || {}).NRO_DOCUMENTO_EMPLEADO,
                        hrx_acumulado: (hrx || {}).HR_EXTRA_ACUMULADO,
                        hrx_solicitado: (hrx || {}).HR_EXTRA_SOLICITADO,
                        hrx_sobrante: (hrx || {}).HR_EXTRA_SOBRANTE,
                        estado: (hrx || {}).ESTADO,
                        aprobado: (hrx || {}).APROBADO == 1 ? true : false,
                        seleccionado: (hrx || {}).SELECCIONADO == 1 ? true : false,
                        fecha: (hrx || {}).FECHA
                    });
                }
            });
        }

        res.json(parsePap);
    } else {
        res.json({ msj: "No existe una papeleta con ese codigo." });
    }
}




