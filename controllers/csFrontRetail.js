import { pool } from '../conections/conexMysql.js';

class clsFrontRetail {

    onAgenteConfigList = async (req, res) => {
        let data = ((req || {}).body || []);
        let [configuration] = await pool.query(`SELECT * FROM TB_CONFIGURATION_CONEX_AGENTE WHERE MAC='${(data || {}).mac}';`);
        console.log(configuration);
        res.json(configuration)
    }

}

const frontRetailController = new clsFrontRetail;
export default frontRetailController;