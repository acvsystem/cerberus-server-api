import { pool } from '../conections/conexMysql.js';

class clsComputers {

    allComputers = (req, res) => {
        pool.query(`SELECT LT.DESCRIPCION,PT.NUM_CAJA,PT.MAC,PT.IP,PT.ONLINE,PT.UNID_SERVICIO FROM TB_PARAMETROS_TIENDA PT INNER JOIN TB_LISTA_TIENDA LT ON LT.SERIE_TIENDA = PT.SERIE_TIENDA WHERE ESTATUS = 'ACTIVO' ORDER BY LT.DESCRIPCION;`).then(([requestSql]) => {
            let responseJSON = [];
            (requestSql || []).filter((computer) => {
                (responseJSON || []).push({
                    description: (computer || {}).DESCRIPCION,
                    box_number: (computer || {}).NUM_CAJA,
                    mac: (computer || {}).MAC,
                    ip: (computer || {}).IP,
                    online: (computer || {}).ONLINE,
                    service_unit: (computer || {}).UNID_SERVICIO
                });
            });

            res.json(responseJSON);
        });
    }
}

const computersController = new clsComputers;
export default computersController;