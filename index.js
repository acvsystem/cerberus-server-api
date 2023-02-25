const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const cors = require('cors');

app.use(cors());

var bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: '1000000mb' }));
app.use(bodyParser.urlencoded({ limit: '1000000mb', extended: true }));

io.on('connection', (socket) => {
    socket.on('verifyDocument', (resData) => {
        if ((resData || "").id == "server") {
            var allData = JSON.parse((resData || {}).allData);
            var receptData = JSON.parse((resData || {}).receptData);
            var dataFront = JSON.parse(receptData.data);
            var refTienda = receptData.local;
            var arAllComprobantes = [];
            var arrNotReg = [];
            let date = new Date();
            let day = `0${date.getDate()}`.slice(-2);
            let month = `0${date.getMonth() + 1}`.slice(-2);
            let year = date.getFullYear();

            (allData || []).filter((dataCentral) => {
                var newCp = (dataCentral || {}).cmpNumero.split('-');
                (arAllComprobantes || []).push(newCp[0] + '-' + Number(newCp[1]));
            });

            (dataFront || []).filter((cmp) => {
                var newCp = (cmp || {}).cmpSerie + '-' + (cmp || {}).cmpNumero;
                if (!(arAllComprobantes || {}).includes(newCp)) {
                    (arrNotReg || []).push({
                        "CORRELATIVO": newCp,
                        "TIPO DOCUMENTO": (cmp || {}).cmpTipo,
                        "FECHA": (cmp || {}).cmpFecha
                    });
                }
            });

            console.log(`${day}-${month}-${year} - ${refTienda} - Comprobantes enviados: ${arrNotReg.length}`);

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
        socket.broadcast.emit("sendDataFront", data['local']);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    console.log('a user connected');
});

server.listen(3200, () => {
    console.log('listening on *:3200');
});