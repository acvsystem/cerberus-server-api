import { pool } from '../conections/conexMysql.js';
import mdwErrorHandler from '../middleware/errorHandler.js';

class clsTransfers {
    allTransfers = (req, res) => {
        pool.query(`SELECT * FROM TB_HEAD_TRASPASOS;`)
            .then(([requestSql]) => {
                let responseJSON = [];
                (requestSql || []).filter((transfers) => {
                    (responseJSON || []).push({
                        code_transfer: (transfers || {}).CODIGO_TRASPASO,
                        unid_service: (transfers || {}).UNIDAD_SERVICIO,
                        store_origin: (transfers || {}).TIENDA_ORIGEN,
                        store_destination: (transfers || {}).TIENDA_DESTINO,
                        code_warehouse_origin: (transfers || {}).CODIGO_ALM_ORIGEN,
                        code_warehouse_destination: (transfers || {}).CODIGO_ALM_DESTINO,
                        datetime: (transfers || {}).DATETIME
                    });
                });

                res.json(responseJSON);
            });
    }

    inHeadTransfers = (req, res) => {
        let requesJSON = ((req || {}).body || {});
        pool.query(`INSERT INTO TB_HEAD_TRASPASOS(CODIGO_TRASPASO,UNIDAD_SERVICIO,TIENDA_ORIGEN,TIENDA_DESTINO,CODIGO_ALM_ORIGEN,CODIGO_ALM_DESTINO,DATETIME)
            VALUES('${requesJSON.code_transfer}','${requesJSON.unid_service}','${requesJSON.store_origin}','${requesJSON.store_destination}','${requesJSON.code_warehouse_origin}',
            '${requesJSON.code_warehouse_destination}','${requesJSON.datetime}')`).then(() => {
                
        });
    }



}

const transfersController = new clsTransfers;
export default transfersController;