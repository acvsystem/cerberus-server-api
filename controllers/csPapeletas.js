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
    let newCodigo = `P${codigo_tienda}${(arPapeleta || []).length + 1}`;
    res.json({ codigo: newCodigo })
}


export const recalcularHorasExtras = async (req, res) => {
    let data = ((req || {}).body || [])[0];
    pool.query(`DELETE FROM TB_HORA_EXTRA_EMPLEADO WHERE ID_HR_EXTRA = ${(data || "").id_hora_extra};`).then(() => {
        res.json(defaultResponse.success.default);
    });
};

//SE INSERTA EN LA TABLA HORA EXTRA GENERAL COMO UNA TABLA PRODUCTOS
export const regHorasExtras = async (req, res) => {
    try {
        const data = req.body || [];
        const dataResponse = [];

        // Usamos for...of para procesar secuencialmente o Promise.all para paralelo controlado
        for (const hrx of data) {
            const { documento, fecha, hrx_acumulado, hr_trabajadas, estado, aprobado, seleccionado } = hrx;

            // 1. Verificación de existencia con Query Preparada (Evita Inyección SQL)
            const [existHrx] = await pool.query(
                `SELECT * FROM TB_HORA_EXTRA_EMPLEADO 
                 WHERE NRO_DOCUMENTO_EMPLEADO = ? AND FECHA = ? AND HR_EXTRA_ACUMULADO = ?`,
                [documento, fecha, hrx_acumulado]
            );

            if (!existHrx || existHrx.length === 0) {
                // 2. Lógica de fecha simplificada (Asumiendo formato YYYY-MM-DD)
                // Si fecha es '2025-05-10', esto genera un formato compatible si es necesario
                const [year, month, day] = fecha.split("-");
                const fechaHr = `${parseInt(day)}-${parseInt(month)}-${year}`;

                // 3. Verificar si es día libre/feriado
                const [arFeriado] = await pool.query(
                    `SELECT DL.* FROM TB_DIAS_LIBRE DL
                     INNER JOIN TB_DIAS_HORARIO DH ON DH.ID_DIAS = DL.ID_TRB_DIAS
                     WHERE DL.NUMERO_DOCUMENTO = ? AND DL.FECHA_NUMBER = ?`,
                    [documento, fechaHr]
                );

                const hrFinalAcumulada = arFeriado.length > 0 ? hr_trabajadas : hrx_acumulado;

                // 4. Inserción limpia
                await pool.query(
                    `INSERT INTO TB_HORA_EXTRA_EMPLEADO (
                        NRO_DOCUMENTO_EMPLEADO, HR_EXTRA_ACUMULADO, HR_EXTRA_SOLICITADO, 
                        HR_EXTRA_SOBRANTE, ESTADO, APROBADO, SELECCIONADO, FECHA, FECHA_MODIFICACION
                    ) VALUES (?, ?, '00:00', '00:00', ?, ?, ?, ?, ?)`,
                    [documento, hrFinalAcumulada || '00:00', estado, aprobado ? 1 : 0, seleccionado ? 1 : 0, fecha, fecha]
                );
            }

            // 5. Obtener datos actualizados para la respuesta
            const [arHrExtra] = await pool.query(
                `SELECT * FROM TB_HORA_EXTRA_EMPLEADO WHERE NRO_DOCUMENTO_EMPLEADO = ? AND FECHA = ?`,
                [documento, fecha]
            );

            if (arHrExtra && arHrExtra.length > 0) {
                const registro = arHrExtra[0];

                // Buscar comentario
                const [comentarios] = await pool.query(
                    `SELECT * FROM TB_AUTORIZAR_HR_EXTRA 
                     WHERE FECHA = ? AND NRO_DOCUMENTO_EMPLEADO = ? AND HR_EXTRA_ACOMULADO = ?`,
                    [fecha, documento, registro.HR_EXTRA_ACUMULADO]
                );

                dataResponse.push({
                    id_hora_extra: registro.ID_HR_EXTRA,
                    documento: documento,
                    codigo_papeleta: hrx.codigo_papeleta,
                    fecha: fecha,
                    hrx_acumulado: registro.HR_EXTRA_ACUMULADO,
                    extra: registro.HR_EXTRA_ACUMULADO,
                    hrx_solicitado: registro.HR_EXTRA_SOLICITADO || '00:00',
                    hrx_sobrante: registro.HR_EXTRA_SOBRANTE || '00:00',
                    estado: registro.ESTADO || estado,
                    aprobado: registro.APROBADO === 1,
                    seleccionado: registro.SELECCIONADO === 1,
                    verify: registro.SELECCIONADO === 1,
                    comentario: comentarios || [],
                    arFechas: hrx.arFechas || []
                });
            } else {
                dataResponse.push({ ...hrx, verify: false });
            }
        }

        // Enviamos la respuesta una sola vez al finalizar el bucle
        return res.json(dataResponse);

    } catch (error) {
        console.error("Error procesando horas extras:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
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
            DESCRIPCION,
            ESTADO_PAPELETA
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
            '${(data || [])[0].descripcion}',
            'aceptado');`)
        .then(async () => {
            let arHorasExtra = ((data || [])[0] || {}).horas_extras || [];

            if ((arHorasExtra || []).length) {
                (arHorasExtra || []).filter(async (hrx) => {
                    if (hrx.checked) {
                        let sobrante = hrx.hrx_sobrante;
                        let [arHeadPap] = await pool.query(`SELECT * FROM TB_HEAD_PAPELETA WHERE CODIGO_TIENDA = '${(data || [])[0].codigo_tienda}' ORDER BY ID_HEAD_PAPELETA DESC LIMIT 1;`);

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

                        pool.query(`UPDATE TB_HORA_EXTRA_EMPLEADO SET HR_EXTRA_SOLICITADO = '${hrx.hrx_solicitado}',
                             ESTADO = '${hrx.estado}', HR_EXTRA_SOBRANTE = '${sobrante}', ISUPDATE = 1
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
    let [arPapeleta] = await pool.query(`SELECT * FROM TB_HEAD_PAPELETA WHERE ESTADO_PAPELETA != 'anulado' AND CODIGO_TIENDA = '${data[0].codigo_tienda}' ORDER BY DATEDIFF(DATE(FECHA_CREACION), CURDATE()) ASC;`);
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
                id_papeleta: (pap || {}).ID_HEAD_PAPELETA,
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
                is_update: (pap || {}).ISUPDATE || 0,
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




