const express = require('express');
const cors = require('cors');
const uuid = require('uuid');

const app = express();

app.use(cors());


var bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: '1000000mb' }));
app.use(bodyParser.urlencoded({ limit: '1000000mb', extended: true }));

let subscribers = [];

function events(request, response, next) {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };

    response.writeHead(200, headers);

    const subscriberId = uuid.v4();
    const data = `data: ${JSON.stringify({ id: subscriberId })}\n\n`;

    response.write(data);

    const subscriber = {
        id: subscriberId,
        response
    };

    subscribers.push(subscriber);

    request.on('close', () => {
        console.log(`${subscriberId} Connection closed`);
        subscribers = subscribers.filter(sub => sub.id !== subscriberId);
    });
}

async function sendEvent(request, response, next) {
    const data = request.body;
    subscribers.forEach(subscriber => {
        subscriber.response.write(`data: ${JSON.stringify(data)}\n\n`);
        var resData = data;
        if ((resData || "").id == "response") {
            var allData = JSON.parse((resData || {}).allData);
            var receptData = JSON.parse((resData || {}).receptData);
            var dataFront = JSON.parse(receptData.data);
            var refTienda = receptData.local;
            var arAllComprobantes = [];
            var arrNotReg = [];

            (allData || []).filter((dataCentral) => {
                var newCp = (dataCentral || {}).cmpNumero.split('-');
                (arAllComprobantes || []).push(newCp[0] + '-' + Number(newCp[1]));
            });

            (dataFront || []).filter((cmp) => {
                var newCp = (cmp || {}).cmpSerie + '-' + (cmp || {}).cmpNumero;
                if (!(arAllComprobantes || {}).includes(newCp)) {
                    (arrNotReg || []).push({
                        "CORRELATIVO": newCp,
                        "FECHA": (cmp || {}).cmpFecha
                    });
                }
            });

            
                const XLSX = require("xlsx");
                const workSheet = XLSX.utils.json_to_sheet(arrNotReg);
                const workBook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workBook, workSheet, "attendance");
                const xlsFile = XLSX.write(workBook, { bookType: "xlsx", type: "buffer" });
                require("./send_mail")('andrecanalesv@gmail.com', `${refTienda} - FACTURAS FALTANTES EN SERVIDOR`, xlsFile)
                    .catch(error => res.send(error));
            
            

        }
    });


    response.json({ success: true });
}

async function verifyData(request, response, next) {
    var resData = JSON.parse(req.body);
    console.log(resData);
}

app.get('/events', events);
app.post('/send-event', sendEvent);
app.post('/verify', verifyData);

app.listen(3200, () => {
    console.log('Events service started at http://localhost:3200')
});