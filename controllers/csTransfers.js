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

                res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/transfers/all', data: responseJSON }));
            }).catch((err) => {
                res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'error', message: err, api: '/transfers/all', data: responseJSON }));
            });
    }

    searchDetailsTransfers = (req, res) => {
        let requesJSON = ((req || {}).body || {});
        let code_transfers = (requesJSON || {}).code_trasnfers;
        pool.query(`SELECT * FROM TB_DETALLE_TRASPASOS WHERE CODIGO_TRASPASO = '${code_transfers}';`).then(([requestSql]) => {
            let responseJSON = [];
            (requestSql || []).filter((detail) => {
                responseJSON.json({
                    barcode: detail.CODIGO_BARRA,
                    article_code: detail.CODIGO_ARTICULO,
                    description: detail.DESCRIPCION,
                    size: detail.TALLA,
                    color: detail.COLOR,
                    stock: detail.STOCK,
                    stock_required: detail.STOCK_SOLICITADO,
                    status: detail.ESTADO,
                    code_transfers: detail.CODIGO_TRASPASO
                });
            });
            res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/transfers/search/detail', data: responseJSON }));
        }).catch((err) => {
            res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'error', message: err, api: '/transfers/search/detail', data: responseJSON }));
        });
    }


    inTransfers = (req, res) => {
        let requesJSON = ((req || {}).body || {});
        pool.query(`INSERT INTO TB_HEAD_TRASPASOS(CODIGO_TRASPASO,UNIDAD_SERVICIO,TIENDA_ORIGEN,TIENDA_DESTINO,CODIGO_ALM_ORIGEN,CODIGO_ALM_DESTINO,DATETIME)
            VALUES('${requesJSON.code_transfer}','${requesJSON.unid_service}','${requesJSON.store_origin}','${requesJSON.store_destination}','${requesJSON.code_warehouse_origin}',
            '${requesJSON.code_warehouse_destination}','${requesJSON.datetime}')`).then(() => {

            ((requesJSON || {}).details || []).filter((det) => {
                pool.query(`INSERT INTO TB_DETALLE_TRASPASOS(CODIGO_BARRA,CODIGO_ARTICULO,DESCRIPCION,TALLA,COLOR,STOCK,STOCK_SOLICITADO,ESTADO,CODIGO_TRASPASO)
                    VALUES('${det.barcode}','${det.article_code}','${det.description}','${det.size}','${det.color}','${det.stock}','${det.stock_required}','${det.status}','${det.code_transfers}')`);
            });

            res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/transfers/new', data: [] }));
        }).catch((err) => {
            res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'error', message: err, api: '/transfers/new', data: [] }));
        });
    }
}

const transfersController = new clsTransfers;
export default transfersController;