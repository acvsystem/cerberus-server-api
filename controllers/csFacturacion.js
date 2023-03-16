import emailController from '../sendEmail.js';
import * as XLSX from 'xlsx';
import { pool } from '../conections/conexMysql.js';
import sessionSocket from './csSessionSocket.js'

class clsFacturacion {

    getDate() {
        let date = new Date();
        let day = `0${date.getDate()}`.slice(-2);
        let month = `0${date.getMonth() + 1}`.slice(-2);
        let year = date.getFullYear();

        return `${day}-${month}-${year}`;
    }

    async verificacionDocumentos(dataVerify) {
        let tiendasList = [
            { code: '7A', name: 'BBW JOCKEY' },
            { code: '9A', name: 'VSBA JOCKEY' },
            { code: 'PC', name: 'AEO JOCKEY' },
            { code: 'PB', name: 'AEO ASIA' },
            { code: '7E', name: 'BBW LA RAMBLA' },
            { code: '9D', name: 'VS LA RAMBLA' },
            { code: '9B', name: 'VS PLAZA NORTE' },
            { code: '7C', name: 'BBW SAN MIGUEL' },
            { code: '9C', name: 'VS SAN MIGUEL' },
            { code: '7D', name: 'BBW SALAVERRY' },
            { code: '9I', name: 'VS SALAVERRY' },
            { code: '9G', name: 'VS MALL DEL SUR' },
            { code: '9H', name: 'VS PURUCHUCO' },
            { code: '9M', name: 'VS ECOMMERCE' },
            { code: '7F', name: 'BBW ECOMMERCE' },
            { code: 'PA', name: 'AEO ECOMMERCE' },
            { code: '9K', name: 'VS MEGA PLAZA' },
            { code: '9L', name: 'VS MINKA' },
            { code: '9F', name: 'VSFA JOCKEY FULL' },
            { code: '7A7', name: 'BBW ASIA' }
        ];
        var dataNoFound = [];
        var paseDataList = [];
        var serverData = JSON.parse((dataVerify || {}).serverData);
        var frontData = JSON.parse((dataVerify || {}).frontData);
        var codigoFront = (dataVerify || {}).codigoFront;

        (serverData || []).filter((data) => {
            var cpParse = (data || {}).cmpNumero.split('-');
            (paseDataList || []).push(cpParse[0] + '-' + Number(cpParse[1]));
        });

        (frontData || []).filter((data) => {
            var cpParse = (data || {}).cmpSerie + '-' + (data || {}).cmpNumero;
            if (!(paseDataList || []).includes(cpParse)) {
                (dataNoFound || []).push({
                    "CORRELATIVO": cpParse,
                    "TIPO DOCUMENTO": (data || {}).cmpTipo,
                    "FECHA": (data || {}).cmpFecha
                });
            }
        });

        let selectedLocal = tiendasList.find((data) => data.code == codigoFront);
        console.log(`${this.getDate()} - ${codigoFront} - ${(selectedLocal || {}).name} - Comprobantes enviados: ${(dataNoFound || []).length}`);

        if ((dataNoFound || []).length) {
            const workSheet = XLSX.utils.json_to_sheet((dataNoFound || []));
            const workBook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workBook, workSheet, "attendance");
            const xlsFile = XLSX.write(workBook, { bookType: "xlsx", type: "buffer" });
            emailController.sendEmail('andrecanalesv@gmail.com', `${(selectedLocal || {}).name} - FACTURAS FALTANTES EN SERVIDOR`, xlsFile, (selectedLocal || {}).name)
                .catch(error => res.send(error));
        }

        await pool.query(`UPDATE TB_TERMINAL_TIENDA SET VERIFICACION = true, CANT_COMPROBANTES = ${(dataNoFound || []).length} WHERE CODIGO_TERMINAL = '${codigoFront}'`);
        let listSession = await sessionSocket.sessionList();
        return listSession;
    }
}

const facturacionController = new clsFacturacion;
export default facturacionController;