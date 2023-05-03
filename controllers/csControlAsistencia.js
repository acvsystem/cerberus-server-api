import { pool } from '../conections/conexMysql.js';

class clsControlAsistencia {

    onSearchData = async (req, res) => {
        let dataRecept = ((req || {}).body || {});
        let response = [];
        let dateInit = (dataRecept || {}).dataRecept || '';
        let dateEnd = (dataRecept || {}).dateEnd || '';

        console.log("onSearchData", dataRecept);
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