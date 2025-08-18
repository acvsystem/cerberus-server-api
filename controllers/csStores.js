import { pool } from '../conections/conexMysql.js';

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
}

const storesController = new clsStores;
export default storesController;