export default function (io) {
    io.on('connection', async (socket) => {

        socket.on('conexion:serverICG', (data) => {
            socket.broadcast.emit("conexion:serverICG:send", data);
        });

        /* VERIFICACION DE BASES DE DATOS CON COE_DATA */

        socket.on('comparacion:get:bd', (response) => {
            let configuration = {
                socket: (socket || {}).id
            };

            socket.broadcast.emit("comparacionGetBdSBK", configuration);
        });

        
    });
}