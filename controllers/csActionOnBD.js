import { pool } from '../conections/conexMysql.js';

class clsActionBD {

    async verificationRegister(tableName, cadenaWhere) {
        let [data] = await pool.query(`SELECT * FROM ${tableName} WHERE ${cadenaWhere}`);
        return data || [];
    }

    async insertRegister(tableName, columnCadena, cadenaValue) {

        await pool.query(`INSERT INTO ${tableName}(${columnCadena})VALUES(${cadenaValue});`);

        return true;
    }

}

const actionBDController = new clsActionBD;
export default actionBDController;