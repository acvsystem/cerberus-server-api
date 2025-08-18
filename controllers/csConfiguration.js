import { pool } from '../conections/conexMysql.js';
import mdwErrorHandler from '../middleware/errorHandler.js';

class clsConfiguration {
    clearClient = (req, res) => {
        pool.query(`SELECT * FROM TB_CLIENTES_CLEAR_FORNT;`)
            .then(([responseSql]) => {
                let responseJSON = [];
                (responseSql || []).filter((column) => {
                    (responseJSON || []).push({
                        client_clear: (column || {}).LIST_CLIENTE
                    });
                });

                res.json(responseJSON);
            });
    }

    inClearClient = (req, res) => {
        pool.query(`SELECT * FROM TB_CLIENTES_CLEAR_FORNT;`).then(([responseSQL]) => {
            let value = ((req || []).body || {})['client_clear'];
            if (!(responseSQL || []).length) {
                pool.query(`INSERT INTO TB_CLIENTES_CLEAR_FORNT(LIST_CLIENTE)VALUES('${value}');`);
            } else {
                pool.query(`UPDATE TB_CLIENTES_CLEAR_FORNT SET LIST_CLIENTE = '${value}' WHERE ID_CLIENTE_CLEAR = 1;`);
            }

            res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/configuration/client/list/clear' }));
        });
    };

    pluginSunat = (req, res) => {
        pool.query(`SELECT  
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
        FROM TB_CONFIGURACION_FILE_APLICACION WHERE APLICACION_FILE = 'plugin_sunat_icg';`).then(([responseSQL]) => {
            res.json(responseSQL);
        });
    }

    AllMenu = (req, res) => {
        pool.query(`SELECT * FROM TB_MENU_SISTEMA;`).then(([responseSQL]) => {
            let responseJSON = [];
            (responseSql || []).filter((column) => {
                (responseJSON || []).push({
                    name_menu: (column || {}).NOMBRE_MENU,
                    route: (column || {}).RUTA,
                    icon: (column || {}).ICO
                });
            });

            res.json(responseJSON);
        });
    }

    AllLevel = (req, res) => {
        pool.query(`SELECT * FROM TB_NIVELES_SISTEMA;`).then(([responseSQL]) => {
            let responseJSON = [];
            (responseSql || []).filter((column) => {
                (responseJSON || []).push({
                    level: (column || {}).NIVEL_DESCRIPCION
                });
            });

            res.json(responseJSON);
        });
    }
}

const configurationController = new clsConfiguration;
export default configurationController;