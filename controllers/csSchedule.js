import { pool } from '../conections/conexMysql.js';

class clsSchedule {

    allSchedule = (req, res) => {
        pool.query(`SELECT RANGO_DIAS,CODIGO_TIENDA FROM TB_HORARIO_PROPERTY ORDER BY  DATEDIFF(DATE(SUBSTRING_INDEX(RANGO_DIAS,' ',1)), CURDATE()) asc;`).then(([requestSql]) => {
            let responseJSON = [];
            (requestSql || []).filter((schedule) => {
                (responseJSON || []).push({
                    range_days: (schedule || {}).RANGO_DIAS,
                    code_store: (schedule || {}).CODIGO_TIENDA
                });
            });

            res.json(responseJSON);
        });
    }
}

const scheduleController = new clsSchedule;
export default scheduleController;