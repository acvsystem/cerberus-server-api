import { pool } from '../conections/conexMysql.js';

class clsTransfers {

    transfersAll() {
        pool.query(`SELECT * FROM TB_HEAD_TRASPASOS;`).then(([responseSQL]) => {
            return responseSQL;
        });
    }

}

const tokenController = new clsToken;
export default tokenController;