import { pool } from '../conections/conexMysql.js';

class clsFrontRetail {
/* DATA SQL SERVER */
    onAgenteConfigList = async (req, res) => {
        let data = ((req || {}).body || []);
        let [configuration] = await pool.query(`SELECT * FROM TB_PARAMENTROS_TIENDA WHERE MAC_SERVER='${(data || {}).mac}';`);
        console.log(configuration);
        res.json(configuration)
    }

}

const frontRetailController = new clsFrontRetail;
export default frontRetailController;