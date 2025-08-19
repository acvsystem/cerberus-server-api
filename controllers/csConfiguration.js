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

    inMenu = (req, res) => {
        let nameMenu = ((req || []).body || {})['name_menu'];
        let route = ((req || []).body || {})['route'];
        pool.query(`INSERT INTO TB_MENU_SISTEMA(NOMBRE_MENU,RUTA)VALUES('${nameMenu}','${route}');`).then(() => {
            res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/configuration/menu' }));
        }).catch(() => {
            res.status(500).json(mdwErrorHandler.error({ status: 500, type: 'InternalServerError', message: 'Error en la base de datos.', api: '/configuration/menu', data: [] }));
        });
    }

    searchMenu = (req, res) => {
        let level = ((req || {}).query || {}).level;
        pool.query(`SELECT * FROM TB_PERMISO_SISTEMA INNER JOIN TB_MENU_SISTEMA ON TB_MENU_SISTEMA.ID_MENU = TB_PERMISO_SISTEMA.ID_MENU_PS WHERE TB_PERMISO_SISTEMA.NIVEL = '${level}';`).then(([responseSQL]) => {
            res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/configuration/menu/search', data: responseSQL }));
        }).catch(() => {
            res.status(500).json(mdwErrorHandler.error({ status: 500, type: 'InternalServerError', message: 'Error en la base de datos.', api: '/configuration/menu/search', data: [] }));
        });
    }

    inLevel = (req, res) => {
        let level = ((req || []).body || {}).level;
        pool.query(`INSERT INTO TB_NIVELES_SISTEMA(NIVEL_DESCRIPCION)VALUES('${level}');`).then(() => {
            res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/configuration/level', data: [] }));
        }).catch(() => {
            res.status(500).json(mdwErrorHandler.error({ status: 500, type: 'InternalServerError', message: 'Error en la base de datos.', api: '/configuration/level', data: [] }));
        });
    }

    inPermissionMenu = (req, res) => {
        let id_menu = ((req || []).body || {}).id_menu || "";
        let level = ((req || []).body || {}).level || "";

        pool.query(`INSERT INTO TB_PERMISO_SISTEMA(ID_MENU_PS,NIVEL)VALUES(${id_menu},'${level}');`).then(() => {
            res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/configuration/menu/permission', data: [] }));
        }).catch(() => {
            res.status(500).json(mdwErrorHandler.error({ status: 500, type: 'InternalServerError', message: 'Error en la base de datos.', api: '/configuration/menu/permission', data: [] }));
        });
    }

    delPermissionMenu = (req, res) => {
        let id_permission = ((req || {}).query || {}).id_permission || "";
        pool.query(`DELETE FROM TB_PERMISO_SISTEMA WHERE ID_PERMISO_USER = ${id_permission};`).then(() => {
            res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/configuration/menu/permission', data: [] }));
        }).catch(() => {
            res.status(500).json(mdwErrorHandler.error({ status: 500, type: 'InternalServerError', message: 'Error en la base de datos.', api: '/configuration/menu/permission', data: [] }));
        });
    }

    inAsignationStore = (req, res) => {
        let id_user = ((req || []).body || {}).id_user || "";
        let id_store = ((req || []).body || {}).id_store || "";
        let description_store = ((req || []).body || {}).description_store || "";
        pool.query(`INSERT INTO TB_USUARIO_TIENDAS_ASIGNADAS(ID_USUARIO_TASG,ID_TIENDA_TASG,DESCRIPCION_TIENDA)VALUES('${id_user}','${id_store}','${description_store}');`).then(() => {
            res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/configuration/asignation/store', data: [] }));
        }).catch(() => {
            res.status(500).json(mdwErrorHandler.error({ status: 500, type: 'InternalServerError', message: 'Error en la base de datos.', api: '/configuration/asignation/store', data: [] }));
        });
    }

    delAsignationStore = (req, res) => {
        let id_asignation = ((req || {}).query || {}).id_asignation || "";
        pool.query(`DELETE FROM TB_USUARIO_TIENDAS_ASIGNADAS WHERE ID_TIENDA_ASIGANADA = ${id_asignation};`).then(() => {
            res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/configuration/asignation/store', data: [] }));
        }).catch(() => {
            res.status(500).json(mdwErrorHandler.error({ status: 500, type: 'InternalServerError', message: 'Error en la base de datos.', api: '/configuration/asignation/store', data: [] }));
        });
    }

    searchAsignationStore = (req, res) => {
        let id_user = ((req || {}).query || {}).id_user || "";
        pool.query(`SELECT * FROM TB_USUARIO_TIENDAS_ASIGNADAS WHERE ID_USUARIO_TASG = ${id_user};`).then(([responseSQL]) => {
            res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/configuration/asignation/store', data: responseSQL }));
        }).catch(() => {
            res.status(500).json(mdwErrorHandler.error({ status: 500, type: 'InternalServerError', message: 'Error en la base de datos.', api: '/configuration/asignation/store', data: [] }));
        });
    }
}

const configurationController = new clsConfiguration;
export default configurationController;