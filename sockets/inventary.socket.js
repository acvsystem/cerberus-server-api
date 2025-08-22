export default function (io) {
    io.on('connection', async (socket) => {
        /* CONSULTA STOCK TRASPASOS */

        socket.on("inventario:get:barcode", (configuracion) => {
            console.log("-----INIT SOLICITUD FRONTEND: inventario:get:barcode");
            socket.broadcast.emit("inventarioGetbarcodeFR", configuracion.codigoTienda, configuracion.origen, configuracion.barcode, (socket || {}).id);
        });

        socket.on("inventario:get:fr:barcode:response", (response) => {
            console.log("-----ENVIO RESPUESTA A FRONTEND BACKEND: inventario:get:fr:barcode:response");

            let socketID = (response || {}).socket;
            let data = [];
            data = (response || {}).data || [];
            console.log(data);
            socket.to(`${socketID}`).emit("inventario:get:barcode:response", { data: data });
        });
    });
};