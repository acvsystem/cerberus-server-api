import { pool } from '../conections/conexMysql.js';
import tokenController from './csToken.js';

export const Login = async (req, res) => {
    let objLogin = req.body;
    let usuario = objLogin['usuario'].replace(/[^a-zA-Z-0-9 ]/g, "");
    let password = objLogin['password'];
    const [dataUser] = await pool.query(`SELECT NOMBRE, NM_NIVEL, ID_NVL_ACCESS FROM TB_PROFILE_USER 
                                        INNER JOIN TB_LOGIN ON TB_LOGIN.ID_LOGIN = TB_PROFILE_USER.FK_ID_LOGIN 
                                        INNER JOIN TB_NIVEL_ACCESS ON TB_NIVEL_ACCESS.ID_NVL_ACCESS = TB_LOGIN.FK_ID_NVL_ACCESS
                                        WHERE DESC_USUARIO = '${usuario}' AND PASSWORD = '${password}'`)

    let nivelUser = ((dataUser || [])[0] || {}).NM_NIVEL;

    if (dataUser.length > 0) {
        const [menuUser] = await pool.query(`SELECT NAME_MENU,RUTE_PAGE FROM TB_PROFILE_USER 
            INNER JOIN TB_LOGIN ON TB_LOGIN.ID_LOGIN = TB_PROFILE_USER.FK_ID_LOGIN 
            INNER JOIN TB_NIVEL_ACCESS ON TB_NIVEL_ACCESS.ID_NVL_ACCESS = TB_LOGIN.FK_ID_NVL_ACCESS
            INNER JOIN TB_MENU_SISTEMA ON TB_MENU_SISTEMA.FK_ID_LOGIN_MENU = TB_LOGIN.ID_LOGIN WHERE TB_NIVEL_ACCESS.ID_NVL_ACCESS = ${((dataUser || [])[0] || {}).ID_NVL_ACCESS}`);

        const token = tokenController.createToken(usuario, nivelUser);

        let parseResponse = {
            auth: { token: token },
            profile: { name: ((dataUser || [])[0] || {}).NOMBRE, nivel: ((dataUser || [])[0] || {}).NM_NIVEL },
            menu: menuUser
        }
        res.header('auth-token', token).json(parseResponse);
    } else {
        res.json([{ msj: 'Usuario o contraseña invalidos.' }]);
    }
}
