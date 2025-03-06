import { pool } from '../conections/conexMysql.js';
import emailController from '../sendEmail.js';

class clsSessionSocket {

    async onNewTerminal(codigo) {
        
        let [data] = await pool.query(`SELECT KEY_CODE,DESC_KEY_TERMINAL FROM TB_KEY_TERMINAL WHERE KEY_CODE = '${codigo}'`)

        if (data.length) {
            await pool.query(`INSERT INTO TB_TERMINAL_TIENDA(CODIGO_TERMINAL,DESCRIPCION,VERIFICACION,CANT_COMPROBANTES,ISONLINE)
            VALUES('${codigo}','${((data || [])[0] || {}).DESC_KEY_TERMINAL}',false,0,false)`);

            return data;
        }else{
            
        }
    }

    async onEvalueIsExist(codigo) {
        let [data] = await pool.query(`SELECT * FROM TB_TERMINAL_TIENDA WHERE CODIGO_TERMINAL = '${codigo}'`);

        return data;
    }

    async connect(codigo) {
        let listSession = [];
        if (codigo) {
            console.log(codigo);
            let isExistTerminal = await this.onEvalueIsExist(codigo);
            if (!isExistTerminal.length) {
                await this.onNewTerminal(codigo);
                await pool.query(`UPDATE TB_TERMINAL_TIENDA SET ISONLINE = true WHERE CODIGO_TERMINAL = '${codigo}'`);
            } else {
                await pool.query(`UPDATE TB_TERMINAL_TIENDA SET ISONLINE = true WHERE CODIGO_TERMINAL = '${codigo}'`);

            }

            listSession = await this.sessionOneList(codigo);
        } else {
            listSession = await this.sessionList();
        }

        return listSession;
    }

    async disconnect(codigo) {
        await pool.query(`UPDATE TB_TERMINAL_TIENDA SET ISONLINE = false WHERE CODIGO_TERMINAL = '${codigo}'`);
        let listSession = await this.sessionOneList(codigo);
        return listSession;
    }

    async disconnectServer() {
        /*
        emailController.sendEmail('johnnygermano@metasperu.com', `SERVIDOR FACTURACION DESCONECTADO..!!!!!`, null, null, `SERVIDOR FACTURACION`)
            .catch(error => res.send(error));*/
    }

    async sessionList() {
        let [data] = await pool.query(`SELECT CODIGO_TERMINAL, TB_LISTA_TIENDA.DESCRIPCION, VERIFICACION, CANT_COMPROBANTES, ISONLINE FROM TB_TERMINAL_TIENDA 
        INNER JOIN TB_KEY_TERMINAL ON TB_KEY_TERMINAL.KEY_CODE = TB_TERMINAL_TIENDA.CODIGO_TERMINAL
        INNER JOIN TB_LISTA_TIENDA ON TB_TERMINAL_TIENDA.CODIGO_TERMINAL = TB_LISTA_TIENDA.SERIE_TIENDA;`);
        return data;
    }

    async sessionOneList(codigo) {
        let [data] = await pool.query(`SELECT CODIGO_TERMINAL, TB_LISTA_TIENDA.DESCRIPCION, VERIFICACION, CANT_COMPROBANTES, ISONLINE FROM TB_TERMINAL_TIENDA 
        INNER JOIN TB_KEY_TERMINAL ON TB_KEY_TERMINAL.KEY_CODE = TB_TERMINAL_TIENDA.CODIGO_TERMINAL
        INNER JOIN TB_LISTA_TIENDA ON TB_TERMINAL_TIENDA.CODIGO_TERMINAL = TB_LISTA_TIENDA.SERIE_TIENDA WHERE CODIGO_TERMINAL = '${codigo}';`);
        return data;
    }

}

const sessionSocket = new clsSessionSocket;
export default sessionSocket;
