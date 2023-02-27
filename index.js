const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: { origin: '*' }
});
const cors = require('cors');

app.use(cors());

var bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: '1000000mb' }));
app.use(bodyParser.urlencoded({ limit: '1000000mb', extended: true }));

io.on('connection', (socket) => {
    socket.on('verifyDocument', (resData) => {
        if ((resData || "").id == "server") {
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
            var allData = JSON.parse((resData || {}).allData);
            var receptData = JSON.parse((resData || {}).receptData);
            var dataFront = JSON.parse(receptData.data);
            var arAllComprobantes = [];
            var arrNotReg = [];
            let date = new Date();
            let day = `0${date.getDate()}`.slice(-2);
            let month = `0${date.getMonth() + 1}`.slice(-2);
            let year = date.getFullYear();
            let numeroSerie = '';
            (allData || []).filter((dataCentral) => {
                var newCp = (dataCentral || {}).cmpNumero.split('-');
                (arAllComprobantes || []).push(newCp[0] + '-' + Number(newCp[1]));
            });

            (dataFront || []).filter((cmp) => {
                numeroSerie = (cmp || {}).cmpSerie.substr(1, 2);
                var newCp = (cmp || {}).cmpSerie + '-' + (cmp || {}).cmpNumero;
                if (!(arAllComprobantes || {}).includes(newCp)) {
                    (arrNotReg || []).push({
                        "CORRELATIVO": newCp,
                        "TIPO DOCUMENTO": (cmp || {}).cmpTipo,
                        "FECHA": (cmp || {}).cmpFecha
                    });
                }
            });

            let selectedLocal = tiendasList.find((data) => data.code == numeroSerie);
            console.log(`${day}-${month}-${year} - ${(selectedLocal || {}).name} - Comprobantes enviados: ${arrNotReg.length}`);

            if (arrNotReg.length) {
                const XLSX = require("xlsx");
                const workSheet = XLSX.utils.json_to_sheet(arrNotReg);
                const workBook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workBook, workSheet, "attendance");
                const xlsFile = XLSX.write(workBook, { bookType: "xlsx", type: "buffer" });
                require("./send_mail")('andrecanalesv@gmail.com', `${refTienda} - FACTURAS FALTANTES EN SERVIDOR`, xlsFile)
                    .catch(error => res.send(error));
            }

        }
    });

    socket.on('petitionFront', (data) => {
        socket.broadcast.emit("sendDataFront", data);
    });

    socket.on('comunicationFront', (data) => {
        socket.broadcast.emit("consultinfToFront", 'ready');
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    console.log('a user connected');
});

server.listen(3200, () => {
    console.log('listening on *:3200');
});