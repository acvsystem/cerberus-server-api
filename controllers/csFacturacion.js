class clsFacturacion {

    getDate() {
        let date = new Date();
        let day = `0${date.getDate()}`.slice(-2);
        let month = `0${date.getMonth() + 1}`.slice(-2);
        let year = date.getFullYear();

        return `${day}-${month}-${year}`;
    }

    verificacionDocumentos(dataVerify) {
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
            { code: '7A', name: 'AEO ASIA' }
        ];
        var dataNoFound = [];
        var paseDataList = [];
        var nroSerie = '00';
        var serverData = JSON.parse((dataVerify || {}).serverData);
        var frontData = JSON.parse((dataVerify || {}).frontData);
        
        (serverData || []).filter((data) => {
            var cpParse = (data || {}).cmpNumero.split('-');
            (paseDataList || []).push(cpParse[0] + '-' + Number(cpParse[1]));
        });

        (frontData || []).filter((data) => {
            nroSerie = (data || {}).cmpSerie.substr(1, 2) || '00';
            var cpParse = (data || {}).cmpSerie + '-' + (data || {}).cmpNumero;
            if (!(paseDataList || []).includes(cpParse)) {
                (dataNoFound || []).push({
                    "CORRELATIVO": cpParse,
                    "TIPO DOCUMENTO": (data || {}).cmpTipo,
                    "FECHA": (data || {}).cmpFecha
                });
            }
        });

        let selectedLocal = tiendasList.find((data) => data.code == (objVerificacion || {}).nroSerie);
        console.log(`${getDate()} - ${nroSerie} - ${(selectedLocal || {}).name} - Comprobantes enviados: ${(dataNoFound || []).length}`);

        if ((dataNoFound || []).length) {
            const XLSX = require("xlsx");
            const workSheet = XLSX.utils.json_to_sheet((dataNoFound || []));
            const workBook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workBook, workSheet, "attendance");
            const xlsFile = XLSX.write(workBook, { bookType: "xlsx", type: "buffer" });
            require("./send_mail")('andrecanalesv@gmail.com', `${(selectedLocal || {}).name} - FACTURAS FALTANTES EN SERVIDOR`, xlsFile, (selectedLocal || {}).name)
                .catch(error => res.send(error));
        }
    }
}

const facturacionController = new clsFacturacion;
export default facturacionController;