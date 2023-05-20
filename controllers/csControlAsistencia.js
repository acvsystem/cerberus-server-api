import { pool } from '../conections/conexMysql.js';
import { prop as defaultResponse } from '../const/defaultResponse.js';

class clsControlAsistencia {

    onSearchData = async (req, res) => {
        let dataRecept = ((req || {}).query || {});
        let response = [];
        let dateInit = (dataRecept || {}).dateInit || '';
        let dateEnd = (dataRecept || {}).dateEnd || '';

        console.log("onSearchData", dataRecept);

        let consulta = `SELECT TB_REGISTROEMPLEADOS.ID_REG_EMPLEADO, TB_VENDEDORES.NOMVENDEDOR,TB_REGISTROEMPLEADOS.DIA,TB_REGISTROEMPLEADOS.HORAIN,TB_REGISTROEMPLEADOS.HORAOUT,TB_REGISTROEMPLEADOS.HORAS,TB_REGISTROEMPLEADOS.VENTAS,TB_REGISTROEMPLEADOS.NOMBRE_TIENDA FROM TB_VENDEDORES INNER JOIN TB_REGISTROEMPLEADOS ON TB_VENDEDORES.CODVENDEDOR = TB_REGISTROEMPLEADOS.CODEMPLEADO ORDER BY ID_REG_EMPLEADO DESC;`;

        if (dateInit && !dateEnd) {
            consulta = `SELECT TB_REGISTROEMPLEADOS.ID_REG_EMPLEADO, TB_VENDEDORES.NOMVENDEDOR,TB_REGISTROEMPLEADOS.DIA,TB_REGISTROEMPLEADOS.HORAIN,TB_REGISTROEMPLEADOS.HORAOUT,TB_REGISTROEMPLEADOS.HORAS,TB_REGISTROEMPLEADOS.VENTAS,TB_REGISTROEMPLEADOS.NOMBRE_TIENDA FROM TB_VENDEDORES INNER JOIN TB_REGISTROEMPLEADOS ON TB_VENDEDORES.CODVENDEDOR = TB_REGISTROEMPLEADOS.CODEMPLEADO WHERE DIA = '${dateInit}' ORDER BY ID_REG_EMPLEADO DESC;`
        }

        if (dateInit && dateEnd) {
            consulta = `SELECT TB_REGISTROEMPLEADOS.ID_REG_EMPLEADO, TB_VENDEDORES.NOMVENDEDOR,TB_REGISTROEMPLEADOS.DIA,TB_REGISTROEMPLEADOS.HORAIN,TB_REGISTROEMPLEADOS.HORAOUT,TB_REGISTROEMPLEADOS.HORAS,TB_REGISTROEMPLEADOS.VENTAS,TB_REGISTROEMPLEADOS.NOMBRE_TIENDA FROM TB_VENDEDORES INNER JOIN TB_REGISTROEMPLEADOS ON TB_VENDEDORES.CODVENDEDOR = TB_REGISTROEMPLEADOS.CODEMPLEADO WHERE DIA BETWEEN '${dateInit}' AND '${dateEnd}' ORDER BY ID_REG_EMPLEADO DESC;`
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

    onPaginationData = async (req, res) => {
        let dataRecept = ((req || {}).query || {});
        let response = [];
        let limitPage = (dataRecept || {}).limitPage || '';
        let cantRegister = (dataRecept || {}).cantRegister || '';

        console.log("onSearchData", dataRecept);


        let countData = `SELECT COUNT(*) AS COUNT FROM TB_REGISTROEMPLEADOS;`;

        let [totalCountData] = await pool.query(countData);

        if (((totalCountData || [])[0] || {}).COUNT < 10) {
            cantRegister = 0;
        }

        let consulta = `SELECT TB_REGISTROEMPLEADOS.ID_REG_EMPLEADO, TB_VENDEDORES.NOMVENDEDOR,TB_REGISTROEMPLEADOS.DIA,TB_REGISTROEMPLEADOS.HORAIN,TB_REGISTROEMPLEADOS.HORAOUT,TB_REGISTROEMPLEADOS.HORAS,TB_REGISTROEMPLEADOS.VENTAS,TB_REGISTROEMPLEADOS.NOMBRE_TIENDA FROM TB_VENDEDORES INNER JOIN TB_REGISTROEMPLEADOS ON TB_VENDEDORES.CODVENDEDOR = TB_REGISTROEMPLEADOS.CODEMPLEADO ORDER BY ID_REG_EMPLEADO DESC LIMIT ${limitPage} OFFSET ${cantRegister};`;

        let [data] = await pool.query(consulta);

        response.push(
            {
                data: data,
                cant_registros: ((totalCountData || [])[0] || {}).COUNT || 0,
                status: defaultResponse.success.default
            }
        );

        res.json(response);
    }

}

const controlAsistenciaController = new clsControlAsistencia;
export default controlAsistenciaController;