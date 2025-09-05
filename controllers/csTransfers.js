import { pool } from '../conections/conexMysql.js';
import mdwErrorHandler from '../middleware/errorHandler.js';

class clsTransfers {
    allTransfers = (req, res) => {
        pool.query(`SELECT * FROM TB_HEAD_TRASPASOS ORDER BY ID_TRASPASOS DESC;`)
            .then(([requestSql]) => {
                let responseJSON = [];
                (requestSql || []).filter((transfers, i) => {
                    let code_transfers = (transfers || {}).CODIGO_TRASPASO;
                    (responseJSON || []).push({
                        code_transfer: code_transfers,
                        unid_service: (transfers || {}).UNIDAD_SERVICIO,
                        store_origin: (transfers || {}).TIENDA_ORIGEN,
                        store_destination: (transfers || {}).TIENDA_DESTINO,
                        code_warehouse_origin: (transfers || {}).CODIGO_ALM_ORIGEN,
                        code_warehouse_destination: (transfers || {}).CODIGO_ALM_DESTINO,
                        datetime: (transfers || {}).DATETIME,
                        detail: []
                    });

                    pool.query(`SELECT * FROM TB_DETALLE_TRASPASOS WHERE CODIGO_TRASPASO = '${code_transfers}';`).then(([requestSql]) => {
                        let indexTransfers = responseJSON.findIndex((trs) => trs.code_transfer == code_transfers);
                        console.log(requestSql);
                        (requestSql || []).filter((detail) => {
                            (responseJSON || [])[indexTransfers]['detail'].push({
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
                    });

                    if (requestSql.length - 1 == i) {
                        res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/transfers/all', data: responseJSON || [] }));
                    }

                });


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


    inTransfers = async (req, res) => {
        let requesJSON = ((req || {}).body || {});

        let data = ((req || {}).body || []);

        pool.query(`SELECT * FROM TB_HEAD_TRASPASOS;`).then(([responseHead]) => {

            let code_transfer = this.generarCodigoSerie((responseHead || []).length + 1, 'T', 6);

            pool.query(`INSERT INTO TB_HEAD_TRASPASOS(CODIGO_TRASPASO,UNIDAD_SERVICIO,TIENDA_ORIGEN,TIENDA_DESTINO,CODIGO_ALM_ORIGEN,CODIGO_ALM_DESTINO,DATETIME)
            VALUES('${code_transfer}','${requesJSON.unid_service}','${requesJSON.store_origin}','${requesJSON.store_destination}','${requesJSON.code_warehouse_origin}',
            '${requesJSON.code_warehouse_destination}','${requesJSON.datetime}')`).then(() => {

                ((requesJSON || {}).details || []).filter((det) => {
                    pool.query(`INSERT INTO TB_DETALLE_TRASPASOS(CODIGO_BARRA,CODIGO_ARTICULO,DESCRIPCION,TALLA,COLOR,STOCK,STOCK_SOLICITADO,CODIGO_TRASPASO)
                    VALUES('${det.barcode}','${det.article_code}','${det.description}','${det.size}','${det.color}','${det.stock}','${det.stock_required}','${code_transfer}')`);
                });

                res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/transfers/new', data: [] }));
            }).catch((err) => {
                res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'error', message: err, api: '/transfers/new', data: [] }));
            });
        });
    }


    generarCodigoSerie(numero, prefijo = 'T', longitud = 6) {
        const numeroFormateado = numero.toString().padStart(longitud, '0');
        return `${prefijo}${numeroFormateado}`;
    }
}

const transfersController = new clsTransfers;
export default transfersController;