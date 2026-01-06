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
        if (!Array.isArray(data) || data.length === 0) return res.json([]);

        // 1. Extraer datos únicos para consultas masivas
        const documentos = [...new Set(data.map(d => d.documento))];
        const fechas = [...new Set(data.map(d => d.fecha))];

        // 2. Traer existentes para evitar duplicar inserciones
        const [existentes] = await pool.query(
            `SELECT NRO_DOCUMENTO_EMPLEADO, FECHA FROM TB_HORA_EXTRA_EMPLEADO 
             WHERE NRO_DOCUMENTO_EMPLEADO IN (?) AND FECHA IN (?)`,
            [documentos, fechas]
        );

        const existentesSet = new Set(existentes.map(e => `${e.NRO_DOCUMENTO_EMPLEADO}-${e.FECHA}`));

        // 3. Inserción de nuevos registros
        for (const hrx of data) {
            const key = `${hrx.documento}-${hrx.fecha}`;

            if (!existentesSet.has(key)) {
                const parts = hrx.fecha.split("-");
                const fechaHr = `${parseInt(parts[2])}-${parseInt(parts[1])}-${parts[0]}`;

                const [feriados] = await pool.query(
                    `SELECT DL.NUMERO_DOCUMENTO FROM TB_DIAS_LIBRE DL
                     INNER JOIN TB_DIAS_HORARIO DH ON DH.ID_DIAS = DL.ID_TRB_DIAS
                     WHERE DL.NUMERO_DOCUMENTO = ? AND DL.FECHA_NUMBER = ? LIMIT 1`,
                    [hrx.documento, fechaHr]
                );

                const hrFinal = feriados.length > 0 ? hrx.hr_trabajadas : hrx.hrx_acumulado;

                await pool.query(
                    `INSERT INTO TB_HORA_EXTRA_EMPLEADO (
                        NRO_DOCUMENTO_EMPLEADO, HR_EXTRA_ACUMULADO, HR_EXTRA_SOLICITADO, 
                        HR_EXTRA_SOBRANTE, ESTADO, APROBADO, SELECCIONADO, FECHA, FECHA_MODIFICACION
                    ) VALUES (?, ?, '00:00', '00:00', ?, ?, ?, ?, ?)`,
                    [hrx.documento, hrFinal || '00:00', hrx.estado, hrx.aprobado ? 1 : 0, hrx.seleccionado ? 1 : 0, hrx.fecha, hrx.fecha]
                );
                // Evitamos re-insertar el mismo en este loop
                existentesSet.add(key);
            }
        }

        // 4. Obtener datos finales con JOIN (Optimización de tiempo)
        const [finalResults] = await pool.query(
            `SELECT he.*, ae.COMENTARIO 
             FROM TB_HORA_EXTRA_EMPLEADO he
             LEFT JOIN TB_AUTORIZAR_HR_EXTRA ae ON 
                ae.FECHA = he.FECHA AND 
                ae.NRO_DOCUMENTO_EMPLEADO = he.NRO_DOCUMENTO_EMPLEADO AND 
                ae.HR_EXTRA_ACOMULADO = he.HR_EXTRA_ACUMULADO
             WHERE he.NRO_DOCUMENTO_EMPLEADO IN (?) AND he.FECHA IN (?)
             ORDER BY he.ID_HR_EXTRA ASC`, // Ordenamos para que el último sea el más reciente
            [documentos, fechas]
        );

        // 5. Filtrar para dejar SOLO EL ÚLTIMO registro por fecha
        const lastRecordsMap = {};

        finalResults.forEach(row => {
            const original = data.find(d => d.documento === row.NRO_DOCUMENTO_EMPLEADO && d.fecha === row.FECHA) || {};

            // Usamos la fecha como clave. Si hay varios, el último del loop (el ID más alto) quedará guardado.
            lastRecordsMap[row.FECHA] = {
                id_hora_extra: row.ID_HR_EXTRA,
                documento: row.NRO_DOCUMENTO_EMPLEADO,
                codigo_papeleta: original.codigo_papeleta,
                fecha: row.FECHA,
                hrx_acumulado: row.HR_EXTRA_ACUMULADO,
                extra: row.HR_EXTRA_ACUMULADO,
                hrx_solicitado: row.HR_EXTRA_SOLICITADO || '00:00',
                hrx_sobrante: row.HR_EXTRA_SOBRANTE || '00:00',
                estado: row.ESTADO,
                aprobado: row.APROBADO === 1,
                seleccionado: row.SELECCIONADO === 1,
                verify: row.SELECCIONADO === 1,
                comentario: row.COMENTARIO ? [row.COMENTARIO] : [],
                arFechas: original.arFechas || []
            };
        });

        // Convertimos el objeto de vuelta a un Array
        const response = Object.values(lastRecordsMap);

        return res.json(response);

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ message: "Error interno", detail: error.message });
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




