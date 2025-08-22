import { pool } from '../conections/conexMysql.js';

class svToolFunction {

    async verifyUser(username, password) {
        
        let querySQL = `SELECT ID_LOGIN,USUARIO,DEFAULT_PAGE,TB_LOGIN.NIVEL,NOMBRE_MENU,RUTA,EMAIL FROM TB_PERMISO_SISTEMA 
                INNER JOIN TB_MENU_SISTEMA ON TB_MENU_SISTEMA.ID_MENU = TB_PERMISO_SISTEMA.ID_MENU_PS
                INNER JOIN TB_LOGIN ON TB_LOGIN.NIVEL = TB_PERMISO_SISTEMA.NIVEL
                WHERE USUARIO = '${username}' AND PASSWORD = '${password}'`;

        const [resultados] = await pool.query(querySQL);

        return resultados.length > 0 ? resultados : null;
    }

    async userStore(id_user) {
        let querySQL = `SELECT SERIE_TIENDA,USUARIO,DESCRIPCION FROM TB_LOGIN_TIENDA 
                            INNER JOIN TB_LISTA_TIENDA ON TB_LOGIN_TIENDA.ID_TIENDA_ASSIGN = TB_LISTA_TIENDA.ID_TIENDA
                            INNER JOIN TB_LOGIN ON TB_LOGIN.ID_LOGIN = TB_LOGIN_TIENDA.ID_LOGIN_ASSIGN`;
        if (id_user) {
            querySQL = + ` WHERE TB_LOGIN.ID_LOGIN = ${id_user};`;
        }

        const [resultados] = await pool.query(querySQL);

        return resultados.length > 0 ? resultados : null;
    }

    async inventaryEmail() {
        let querySQL = `SELECT EMAIL FROM TB_LOGIN WHERE NIVEL = 'OPERACIONES' OR NIVEL = 'INVENTARIO' OR NIVEL = 'SISTEMAS';`;
        const [resultados] = await pool.query(querySQL);

        return resultados.length > 0 ? resultados : null;
    }

    async allParameterStore() {
        let querySQL = `SELECT * FROM TB_PARAMETROS_TIENDA;`;
        const [resultados] = await pool.query(querySQL);

        return resultados.length > 0 ? resultados : null;
    }

    async allPermissionSB() {
        let querySQL = `SELECT ID_CONF_HP,ID_TIENDA,SERIE_TIENDA,DESCRIPCION,IS_FREE_HORARIO,IS_FREE_PAPELETA FROM TB_CONFIGURACION_HORARIO_PAP 
                        INNER JOIN TB_LISTA_TIENDA ON TB_LISTA_TIENDA.ID_TIENDA = TB_CONFIGURACION_HORARIO_PAP.ID_TIENDA_HP;`;
        const [resultados] = await pool.query(querySQL);

        return resultados.length > 0 ? resultados : null;
    }
}

const srvToolFunction = new svToolFunction;
export default srvToolFunction;