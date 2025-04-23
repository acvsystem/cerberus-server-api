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

    async verificacionDocumentos(dataVerify, vTiendaList) {

        let tiendasList = vTiendaList;

        var dataNoFound = [];
        var paseDataList = [];
        var serverData = JSON.parse((dataVerify || {}).serverData);
        var frontData = JSON.parse((dataVerify || {}).frontData);


        var codigoFront = (dataVerify || {}).codigoFront;
        //console.log(codigoFront, dataNoFound);

        (serverData || []).filter((data) => {
            var cpParse = ((data || {}).cmpNumero || "").split('-');
            (paseDataList || []).push(cpParse[0] + '-' + Number(cpParse[1]));
        });
        console.log(frontData);
        (frontData || []).filter((data) => {

            let cpParse = (data || {}).cmpSerie + '-' + (data || {}).cmpNumero;
            let identify = ((data || {}).cmpSerie || "").split("");

            if (identify[0] == "N") {
                let newSerie = (data || {}).cmpSerie.slice(1, 4);
                //  cpParse = `B${newSerie}` + '-' + (data || {}).cmpNumero;
            }

            if (identify[0] == "H") {
                let newSerie = (data || {}).cmpSerie.slice(1, 4);
                //   cpParse = `F${newSerie}` + '-' + (data || {}).cmpNumero;
            }

            if (!(paseDataList || []).includes(cpParse)) {
                (dataNoFound || []).push({
                    "CORRELATIVO": cpParse,
                    "TIPO DOCUMENTO": (data || {}).cmpTipo,
                    "FECHA": (data || {}).cmpFecha
                });
            }
        });



        let selectedLocal = tiendasList.find((data) => data.code == codigoFront);
        console.log(`${this.getDate()} - ${codigoFront} - ${(selectedLocal || {}).name} - Comprobantes enviados: ${(dataNoFound || []).length} - `, dataNoFound);
        
                if ((dataNoFound || []).length >= 10) {
                    const workSheet = XLSX.utils.json_to_sheet((dataNoFound || []));
                    const workBook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workBook, workSheet, "attendance");
                    const xlsFile = XLSX.write(workBook, { bookType: "xlsx", type: "buffer" });
                    emailController.sendEmail('johnnygermano@metasperu.com', `${(selectedLocal || {}).name} - FACTURAS FALTANTES EN SERVIDOR`, null, xlsFile, (selectedLocal || {}).name)
                        .catch(error => res.send(error));
                }        
        
        await pool.query(`UPDATE TB_TERMINAL_TIENDA SET VERIFICACION = true, CANT_COMPROBANTES = ${(dataNoFound || []).length} WHERE CODIGO_TERMINAL = '${codigoFront}'`);
        let listSession = await sessionSocket.sessionOneList(codigoFront);
        return listSession;
    }

    verificacionCoeData(dataVerify) {
        return new Promise((resolve, reject) => {
            try {
                var dataNoFound = [];
                var paseDataList = [];
                var coeDatabd = JSON.parse((dataVerify || {}).coeData);
                var dataBk = JSON.parse((dataVerify || {}).databk);
                console.log("VERIFICACION ENTRE BASES DE DATOS", coeDatabd.length, dataBk.length);
                (coeDatabd || []).filter((data, i) => {
                    var cpParse = (data || {}).cmpNumero.split('-');
                    (paseDataList || []).push(cpParse[0] + '-' + Number(cpParse[1]));

                    if (coeDatabd.length - 1 == i) {

                        (dataBk || []).filter((data, j) => {
                            var cpParse = (data || {}).cmpNumero;
                            if (typeof cpParse != 'undefined') {
                                let parse1 = (cpParse || '').split('-');
                                let subparse = parse1[0].substring(3, 4);
                                let subparse2 = parse1[0].substring(0, 3);
                                let letterNC = subparse == 'N' ? 'B' : subparse == 'H' ? 'F' : subparse;
                                let comp = letterNC + subparse2 + '-' + parse1[1];

                                if (!(paseDataList || []).includes(comp)) {
                                    (dataNoFound || []).push({
                                        "CORRELATIVO": comp,
                                        "FECHA": (data || {}).cmpFecha
                                    });
                                }

                                if (dataBk.length - 1 == j) {
                                    if (!dataNoFound.length) {
                                        resolve([
                                            {
                                                code_data: coeDatabd.length,
                                                manager_data: dataBk.length
                                            }
                                        ]);
                                    } else {
                                        resolve(dataNoFound);
                                    }
                                }
                            }
                        });
                    }
                });
            } catch (error) {
                reject(error)
            }
        });
    }
}

const facturacionController = new clsFacturacion;
export default facturacionController;