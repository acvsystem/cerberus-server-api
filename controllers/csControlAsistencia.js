import { pool } from '../conections/conexMysql.js';
import { prop as defaultResponse } from '../const/defaultResponse.js';

class clsControlAsistencia {

    onSearchData = async (req, res) => {
        let dataRecept = ((req || {}).query || {});
        let response = [];
        let dateInit = (dataRecept || {}).dateInit || '';
        let dateEnd = (dataRecept || {}).dateEnd || '';

        console.log("onSearchData", dataRecept);
       
        let consulta = `SELECT * FROM TB_REGISTROEMPLEADOS ORDER BY ID_REG_EMPLEADO DESC;`;

        if (dateInit && !dateEnd) {
            consulta = `SELECT * FROM TB_REGISTROEMPLEADOS WHERE DIA = '${dateInit}' ORDER BY ID_REG_EMPLEADO DESC;`
        }

        if (dateInit && dateEnd) {
            consulta = `SELECT * FROM TB_REGISTROEMPLEADOS WHERE DIA BETWEEN '${dateInit}' AND '${dateEnd}' ORDER BY ID_REG_EMPLEADO DESC;`
        }
        console.log(consulta);
        let [data] = await pool.query(consulta);

        response.push(
            {
                data: data,
                status: defaultResponse.success.default
            }
        );

        res.json(response);
    }

}

const controlAsistenciaController = new clsControlAsistencia;
export default controlAsistenciaController;