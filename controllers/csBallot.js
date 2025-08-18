import { pool } from '../conections/conexMysql.js';

class clsBallot {

    allBallot = (req, res) => {
        pool.query(`SELECT * FROM TB_HEAD_PAPELETA WHERE ESTADO_PAPELETA != 'anulado' ORDER BY DATEDIFF(DATE(FECHA_CREACION), CURDATE()) ASC;`).then(([requestSql]) => {
            let responseJSON = [];
            (requestSql || []).filter((ballot) => {
                (responseJSON || []).push({
                    codigo_papeleta: (ballot || {}).CODIGO_PAPELETA,
                    nombre_completo: (ballot || {}).NOMBRE_COMPLETO,
                    documento: (ballot || {}).NRO_DOCUMENTO_EMPLEADO,
                    id_tipo_papeleta: (ballot || {}).ID_PAP_TIPO_PAPELETA,
                    cargo_empleado: (ballot || {}).CARGO_EMPLEADO,
                    fecha_desde: (ballot || {}).FECHA_DESDE,
                    fecha_hasta: (ballot || {}).FECHA_HASTA,
                    hora_salida: (ballot || {}).HORA_SALIDA,
                    hora_llegada: (ballot || {}).HORA_LLEGADA,
                    hora_acumulado: (ballot || {}).HORA_ACUMULADA,
                    hora_solicitada: (ballot || {}).HORA_SOLICITADA,
                    codigo_tienda: (ballot || {}).CODIGO_TIENDA,
                    fecha_creacion: (ballot || {}).FECHA_CREACION,
                    horas_extras: []
                });
            });

            res.json(responseJSON);
        });
    }

    allType = (req, res) => {
        pool.query(`SELECT * FROM TB_TIPO_PAPELETA`).then(([requestSql]) => {
            let responseJSON = [];
            (requestSql || []).filter((ballot) => {
                (responseJSON || []).push({
                    description: (ballot || {}).DESCRIPCION
                });
            });

            res.json(responseJSON);
        });
    }

    allAuthorization = (req, res) => {
        pool.query(`SELECT * FROM TB_AUTORIZAR_HR_EXTRA ORDER BY FECHA DESC;`).then(([requestSql]) => {
            let responseJSON = [];
            (requestSql || []).filter((auth) => {
                (responseJSON || []).push({
                    accumulated_overtime: (auth || {}).HR_EXTRA_ACOMULADO,
                    document_employe: (auth || {}).TB_AUTORIZAR_HR_EXTRA,
                    full_name: (auth || {}).NOMBRE_COMPLETO,
                    approved: (auth || {}).APROBADO,
                    rejection: (auth || {}).RECHAZADO,
                    date: (auth || {}).FECHA,
                    code_store: (auth || {}).CODIGO_TIENDA,
                    modified_by: (auth || {}).USUARIO_MODF,
                    comment: (auth || {}).COMENTARIO
                });
            });

            res.json(responseJSON);
        });
    }
}

const ballotController = new clsBallot;
export default ballotController;