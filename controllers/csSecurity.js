import { pool } from '../conections/conexMysql.js';
import Jwt from 'jsonwebtoken';
import { prop } from '../keys.js';

export const Login = async (req, res) => {
    let objLogin = req.body;
    let usuario = objLogin['usuario'].replace(/[^a-zA-Z-0-9 ]/g, "");
    let password = objLogin['password'];
    const [dataUser] = await pool.query(`SELECT * FROM TB_LOGIN INNER JOIN TB_NIVEL_ACCESS ON TB_NIVEL_ACCESS.ID_NVL_ACCESS = TB_LOGIN.FK_ID_NVL_ACCESS WHERE DESC_USUARIO = '${usuario}' AND PASSWORD = '${password}'`)

    if (dataUser.length > 0) {
        let privateKey = prop.keyCrypt || 'fgpbr';
        let option = {
            issuer: 'cerberus.server',
            audience: `${((dataUser || [])[0] || {}).NM_NIVEL}`
        };
        const token = Jwt.sign({ id: usuario }, privateKey, option);
        res.header('auth-token', token).json({ auth: { token: token } });
    }
    else {
        res.json([{ msj: 'Usuario o contraseña invalidos.' }]);
    }
}
