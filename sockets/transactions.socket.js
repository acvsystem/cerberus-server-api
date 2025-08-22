export default function (io) {
    io.on('connection', async (socket) => {

        /* VERIFICACION DE TRANSACCIONES */

        socket.on('transacciones:get', (data) => { //ENVIA A FRONT RETAIL
            let configuration = {
                socket: (socket || {}).id
            };

            socket.broadcast.emit("transaccionesGetFR", configuration);
        });

        socket.on('transacciones:get:fr:response', (data) => { //RECIBE DE FRONT RETAIL
            let socketID = data['configuration']['socket'];
            let response = JSON.parse(data['data']);
            let body = [
                {
                    code: codeTerminal,
                    transaciones: response[0]['remCount']
                }
            ];

            socket.to(`${socketID}`).emit("transacciones:get:response", body); // ENVIA A FRONTEND
        });

        /* CONSULTA NOMBRES DE TERMINALES FRONT RETAIL */

        socket.on('terminales:get:name', (data) => {
            let configuration = {
                socket: (socket || {}).id
            };

            socket.broadcast.emit("terminalesGetNameFR", configuration);
        });

        /* TRANFERENCIA DE TRANSACIONES ENTRE FRONT RETAIL */

        socket.on('transacciones:post', (data) => {
            socket.broadcast.emit("transaccionesPostFR", data);
        });
    });
}