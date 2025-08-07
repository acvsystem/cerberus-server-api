import { pool } from './conections/conexMysql.js';

class svNotificaciones {
    userNotificacion(idUser, idNoti) {
        try {
            const [result] = pool.query(`INSERT INTO TB_USUARIO_NOTIFICACION(ID_LOGIN_NT,ID_NOTIFICACION_NT,IS_READ)VALUES(${idUser},${idNoti},FALSE);`);
            if (result.affectedRows === 1) {
                return { success: true };
            } else {
                return { success: false };
            }
        } catch (error) {
            return { success: false, error: err };
        }
    };
}

const srvNotificaciones = new svNotificaciones;
export default srvNotificaciones;