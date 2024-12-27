import { pool } from "../conections/conexMysql.js";
import { prop as defaultResponse } from "../const/defaultResponse.js";
import tokenController from "./csToken.js";
import Jwt from "jsonwebtoken";
import request from "request";

//SE GENERA EL CODIGO PARA PAPELETA SEGUN SERIE DE TIENDA
export const generarCodigo = async (req, res) => {
    let data = ((req || {}).body || []);
    let codigo_tienda = (data || {}).serie_tienda;
    let [arPapeleta] = await pool.query(`SELECT * FROM TB_HEAD_PAPELETA WHERE CODIGO_PAPELETA = '${data.serie_tienda}';`);
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
                    '00:00',
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
                console.log(arHrExtra);
                if ((arHrExtra || []).length || typeof arHrExtra != 'undefined') {
                    (dataResponse || []).push(arHrExtra);
                } else {
                    data[i]['verify'] = false;
                    //(dataResponse || []).push(hrx);
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
            '${(data || {}).codigo_papeleta}',
            '${(data || {}).nombre_completo}',
            '${(data || {}).documento}',
            '${(data || {}).id_tipo_pap}',
            '${(data || {}).cargo_empleado}',
            '${(data || {}).fecha_desde}',
            '${(data || {}).fecha_hasta}',
            '${(data || {}).hora_salida}',
            '${(data || {}).hora.llegada}',
            '${(data || {}).hora_acumulado}',
            '${(data || {}).hora_solicitada}',
            '${(data || {}).codigo_tienda}',
            '${(data || {}).fecha_creacion}',
            '${(data || {}).descripcion}');`)
        .then(async () => {
            let arHorasExtra = (data || []).arHrExtra;
            (arHorasExtra || []).filter(async (hrx) => {
                let [arHeadPap] = await pool.query(`SELECT * FROM TB_HEAD_PAPELETA WHERE CODIGO_PAPELETA = '${data.serie_tienda}' ORDER BY ID_HEAD_PAPELETA DESC LIMIT 1;`);

                await pool.query(`INSERT INTO TB_DETALLE_PAPELETA(
                    DET_ID_HEAD_PAPELETA,
                    DET_ID_HR_EXTRA
                    )VALUES(
                    ${arHeadPap[0]['ID_HEAD_PAPELETA']},
                    ${hrx.id_hora_extra}
                    );`)
                    .then(() => {
                        res.json(defaultResponse.success.default);
                    })
                    .catch(() => {
                        res.json(defaultResponse.error.default);
                    });
            });
        })
        .catch(() => {
            res.json(defaultResponse.error.default);
        });
}




