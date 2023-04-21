import { pool } from '../conections/conexMysql.js';
import { prop } from '../const/defaultResponse.js';
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
    console.log(objLogin);
    if (dataUser.length > 0) {
        const [menuUser] = await pool.query(`SELECT NAME_MENU,RUTE_PAGE FROM TB_PROFILE_USER 
            INNER JOIN TB_LOGIN ON TB_LOGIN.ID_LOGIN = TB_PROFILE_USER.FK_ID_LOGIN 
            INNER JOIN TB_NIVEL_ACCESS ON TB_NIVEL_ACCESS.ID_NVL_ACCESS = TB_LOGIN.FK_ID_NVL_ACCESS
            INNER JOIN TB_MENU_SISTEMA ON TB_MENU_SISTEMA.FK_ID_LOGIN_MENU = TB_LOGIN.ID_LOGIN WHERE TB_NIVEL_ACCESS.ID_NVL_ACCESS = ${((dataUser || [])[0] || {}).ID_NVL_ACCESS};`);

        const token = tokenController.createToken(usuario, nivelUser);

        let parseResponse = {
            auth: { token: token },
            profile: { name: ((dataUser || [])[0] || {}).NOMBRE, nivel: ((dataUser || [])[0] || {}).NM_NIVEL },
            menu: menuUser
        }

        res.header('Authorization', token).json(parseResponse);
    } else {
        res.json(prop.error.login);
    }
}

export const CreateNewUser = async (req, res) => {

    let newRegister = (req || {}).body || {};
    let headers = (req || {}).headers;
    let validToken = tokenController.verificationToken((headers || {}).authorization);
    console.log(validToken);
    let [nivel] = await pool.query(`SELECT * FROM TB_NIVEL_ACCESS WHERE NM_NIVEL='${(newRegister || {}).nivel}'`);

    await pool.query(`INSERT INTO TB_LOGIN(DESC_USUARIO,PASSWORD,FK_ID_NVL_ACCESS)
            VALUES('${newRegister.usuario}','${newRegister.password}',${((nivel || [])[0] || {}).ID_NVL_ACCESS})`);

    const [id_new_user] = await pool.query(`SELECT ID_LOGIN FROM TB_LOGIN WHERE DESC_USUARIO = '${newRegister.usuario}' AND PASSWORD = '${newRegister.password}'`);

    if (id_new_user.length) {
        await pool.query(`INSERT INTO TB_PROFILE_USER(NOMBRE,FK_ID_LOGIN)
        VALUES('${newRegister.nombreProfile} ${newRegister.apellidoProfile}',${id_new_user[0].ID_LOGIN})`);

        res.json(prop.success.default);
    } else {
        res.json(prop.error.default);
    }


}
