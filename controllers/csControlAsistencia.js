import { pool } from '../conections/conexMysql.js';
import { prop as defaultResponse } from '../const/defaultResponse.js';

class clsControlAsistencia {

    onSearchData = async (req, res) => {
        let dataRecept = ((req || {}).body || {});
        let response = [];
        let dateInit = (dataRecept || {}).dateInit || '';
        let dateEnd = (dataRecept || {}).dateEnd || '';

        console.log("onSearchData", req);
        /*
        let consulta = `SELECT * FROM TB_REGISTROEMPLEADOS;`;

        if (dateInit.length && !dateEnd.length) {
            consulta = `SELECT * FROM TB_REGISTROEMPLEADOS WHERE DIA = '${dateInit}';`
        }

        if (dateInit.length && dateEnd.length) {
            consulta = `SELECT * FROM TB_REGISTROEMPLEADOS WHERE DIA BETWEEN '${dateInit}' AND '${dateEnd}';`
        }

        let [data] = await pool.query(consulta);
*/
        response.push(
            {
                data: {},
                status: defaultResponse.success.default
            }
        );

        res.json(response);
    }

}

const controlAsistenciaController = new clsControlAsistencia;
export default controlAsistenciaController;