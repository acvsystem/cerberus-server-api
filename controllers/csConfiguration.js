import { pool } from '../conections/conexMysql.js';
import mdlNotificacion from '../class/clsNotificaciones.js';

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
}

const configurationController = new clsConfiguration;
export default configurationController;