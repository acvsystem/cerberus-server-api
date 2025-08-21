import { pool } from '../conections/conexMysql.js';
import mdwErrorHandler from '../middleware/errorHandler.js';

class clsStores {
    allStores = (req, res) => {
        pool.query(`SELECT * FROM TB_LISTA_TIENDA WHERE ESTATUS = 'ACTIVO';`)
            .then(([requestSql]) => {
                let responseJSON = [];
                (requestSql || []).filter((store) => {
                    (responseJSON || []).push({
                        serie: (store || {}).SERIE_TIENDA,
                        description: (store || {}).DESCRIPCION,
                        code_wharehouse: (store || {}).COD_ALMACEN,
                        service_unit: (store || {}).UNID_SERVICIO,
                        status: (store || {}).ESTATUS,
                        store_type: (store || {}).TIPO_TIENDA,
                        email: (store || {}).EMAIL,
                        code_store_ejb: (store || {}).COD_TIENDA_EJB,
                    });
                });

                res.json(responseJSON);
            });
    }

    allStoresTerminals = (req, res) => {
        pool.query(`SELECT * FROM TB_TERMINAL_TIENDA;`)
            .then(([requestSql]) => {
                let responseJSON = [];
                (requestSql || []).filter((store) => {
                    (responseJSON || []).push({
                        code_terminal: (store || {}).CODIGO_TERMINAL,
                        description: (store || {}).DESCRIPCION,
                        verification: (store || {}).VERIFICACION,
                        voucher_quantity: (store || {}).CANT_COMPROBANTES,
                        online: (store || {}).ISONLINE,
                    });
                });

                res.json(responseJSON);
            });
    }

    inStore = (req, res) => {
        let serie_store = ((req || {}).body || {}).serie_store;
        let name_store = ((req || {}).body || {}).name_store;
        let code_wharehouse = ((req || {}).body || {}).code_wharehouse;
        let unit_service = ((req || {}).body || {}).unit_service;
        let type_store = ((req || {}).body || {}).type_store;
        let email = ((req || {}).body || {}).email;
        let code_ejb = ((req || {}).body || {}).code_ejb;

        pool.query(`INSERT INTO TB_LISTA_TIENDA (SERIE_TIENDA,DESCRIPCION,COD_ALMACEN,UNID_SERVICIO,ESTATUS,TIPO_TIENDA,EMAIL,COD_TIENDA_EJB)
        VALUES('${serie_store}','${name_store}','${code_wharehouse}','${unit_service}','ACTIVO','${type_store}','${email}','${code_ejb}');`).then((rs) => {
            pool.query(`INSERT INTO TB_TERMINAL_TIENDA(CODIGO_TERMINAL,DESCRIPCION,VERIFICACION,CANT_COMPROBANTES,ISONLINE)
                    VALUES('${serie_store}','${name_store}',false,0,false)`).then(() => {
                pool.query(`INSERT INTO TB_KEY_TERMINAL(KEY_CODE,DESC_KEY_TERMINAL)VALUES('${serie_store}','${name_store}')`).then(() => {
                    res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/stores/register', data: [] }));
                }).catch((err) => {
                    res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'Error', message: 'Error tb_key_terminal', api: '/stores/register', data: [] }));
                });
            }).catch((err) => {
                res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'Error', message: 'Error tb_terminal_tienda', api: '/stores/register', data: [] }));
            });
        }).catch((err) => {
            res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'Error', message: 'Error tb_lista_tienda', api: '/stores/register', data: [] }));
        });
    }

    inParameterStore = (req, res) => {
        let box_number = ((req || {}).body || {}).box_number;
        let mac = ((req || {}).body || {}).mac;
        let serie_store = ((req || {}).body || {}).serie_store;
        let database_instance = ((req || {}).body || {}).database_instance;
        let database_name = ((req || {}).body || {}).database_name;
        let code_type_bill = ((req || {}).body || {}).code_type_bill;
        let code_type_ticket = ((req || {}).body || {}).code_type_ticket;
        let property_stock = ((req || {}).body || {}).property_stock;
        let subject_email_report_stock = ((req || {}).body || {}).subject_email_report_stock;
        let name_excel_report_sotck = ((req || {}).body || {}).name_excel_report_sotck;
        let route_download_py = ((req || {}).body || {}).route_download_py;
        let route_download_sunat = ((req || {}).body || {}).route_download_sunat;
        let route_download_validation = ((req || {}).body || {}).route_download_validation;
        let is_main_server = ((req || {}).body || {}).is_main_server;
        let ip = ((req || {}).body || {}).ip;
        let online = ((req || {}).body || {}).online;
        let unit_service = ((req || {}).body || {}).unit_service;

        pool.query(`INSERT INTO TB_PARAMETROS_TIENDA(NUM_CAJA,MAC,SERIE_TIENDA,DATABASE_INSTANCE,DATABASE_NAME,COD_TIPO_FAC,COD_TIPO_BOL,PROPERTY_STOCK,ASUNTO_EMAIL_REPORT_STOCK,
            NAME_EXCEL_REPORT_STOCK,RUTA_DOWNLOAD_PY,RUTA_DOWNLOAD_SUNAT,
            RUTA_DOWNLOAD_VALIDACION,IS_PRINCIPAL_SERVER,IP,ONLINE,UNID_SERVICIO)
            VALUES(${box_number},'${mac}','${serie_store}','${database_instance}','${database_name}','${code_type_bill}','${code_type_ticket}','${property_stock}','${subject_email_report_stock}',
            '${name_excel_report_sotck}','${route_download_py}','${route_download_sunat}','${route_download_validation}','${is_main_server}',${ip},'${online}','${unit_service}');`)
            .then(() => {
                res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/stores/parameter', data: [] }));
            });
    }


}

const storesController = new clsStores;
export default storesController;