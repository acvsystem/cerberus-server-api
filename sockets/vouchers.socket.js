export default function (io) {
    io.on('connection', async (socket) => {
        /* CONSULTAR DOCUMENTOS FALTANTES */

        socket.on('comprobantes:get', (data) => {
            let configuration = {
                socket: (socket || {}).id
            };

            socket.broadcast.emit("comprobantesGetFR", configuration); //SE ENVIA AL PYTHON DEL FRONT RETAIL
        });

        socket.on('comprobantes:get:fr:response', (data) => {
            let selectAgente = (agenteList || []).find((data) => (data || {}).id == socket.id);
            if (typeof codeTerminal != 'undefined' && codeTerminal != '') {
                socket.broadcast.emit("comprobantesGetSBK", data, codeTerminal); // SE ENVIA AL PYTHON DEL SERVIDOR BACKUP
            }
        });

        socket.on('comprobantes:get:sbk:response', async (resData) => { // RESPUESTA DESDE EL SERVIDOR BACKUP
            if ((resData || "").id == "server") {
                let tiendasList = [];
                let socketID = resData['frontData']['configuration']['socket'];

                pool.query(`SELECT * FROM TB_LISTA_TIENDA;`).then(([tienda]) => {

                    (tienda || []).filter(async (td, i) => {
                        tiendasList.push({ code: (td || {}).SERIE_TIENDA, name: (td || {}).DESCRIPCION });

                        if (tienda.length - 1 == i) {
                            let listSessionConnect = await facturacionController.verificacionDocumentos({ serverData: resData['serverData'], frontData: resData['frontData']['data'], codigoFront: resData['codigoFront'] }, tiendasList);

                            socket.to(`${socketID}`).emit("comprobantes:get:response", listSessionConnect); // SE ENVIA A FRONTEND
                        }

                    });
                });
            }
        });

        socket.on('terminales:get:name:fr:response', async (data) => {
            console.log(
                `-----ENVIO RESPUESTA DE FRONT RETAIL A BACKEND
               FRONT RETAIL: terminales:get:name:fr:response`
            );
            let socketID = data['configuration']['socket'];
            let response = JSON.parse(data['data']);
            socket.to(`${socketID}`).emit("terminales:get:name:response", response); // ENVIA A FRONTEND
        });

        /* CONSULTA CANTIDAD EN TERMINALES FRONT RETAIL */

        socket.on('terminales:get:cantidad', (data) => {
            console.log(
                `-----INIT SOLICITUD
               FRONTEND: terminales:get:cantidad`
            );

            let configuration = {
                socket: (socket || {}).id
            };

            socket.broadcast.emit("terminalesGetcantidadFR", configuration);
        });

        socket.on('terminales:get:cantidad:fr:response', async (data) => {
            console.log(
                `-----ENVIO RESPUESTA A FRONTEND
               BACKEND: terminales:get:cantidad:response`
            );

            let socketID = data['configuration']['socket'];
            let response = JSON.parse(data['data']);
            socket.to(`${socketID}`).emit("terminales:get:cantidad:response", response);
        });

        socket.on('resClient', async (data) => {
            console.log('resClient', data);
            let response = JSON.parse(data);
            // let [tiendaExist] = await pool.query(`SELECT * FROM TB_CLIENTES_BLANCO WHERE SERIE_TIENDA = ${codeTerminal};`);
            //console.log('tiendaExist', tiendaExist);
            /*if ((tiendaExist || []).length) {
              await pool.query(`UPDATE TB_CLIENTES_BLANCO SET NUMERO_CLIENTES = ${response[0]['clientCant']} WHERE SERIE_TIENDA = ${codeTerminal});`);
            } else {
              await pool.query(`INSERT INTO TB_CLIENTES_BLANCO(SERIE_TIENDA,NUMERO_CLIENTES)VALUES(${codeTerminal},${response[0]['clientCant']});`);
            }*/

            let body = [
                {
                    code: codeTerminal,
                    clientCant: response[0]['clientCant']
                }
            ];

            socket.to(`${response[0].socket}`).emit("sendDataClient", body);

        });

        socket.on('cleanClient', (data) => {
            console.log('cleanClient');
            let socketID = (socket || {}).id;
            socket.broadcast.emit("searchCantCliente", data, socketID);
        });

        socket.on('emitCleanClient', (data) => {
            console.log('cleanClient');
            let socketID = (socket || {}).id;
            socket.broadcast.emit("limpiarCliente", data, socketID);
        });

        socket.on('cleanColaFront', (data) => {
            console.log('clearColaUpdatePanama');
            socket.broadcast.emit("clearColaUpdatePanama", data);
        });

    });
}