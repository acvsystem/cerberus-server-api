module.exports = (io) => {
    io.on('connection', (socket) => {

        /* CONSULTA KARDEX */

        socket.on("kardex:get:comprobantes", (configuracion) => {
            console.log("-----INIT SOLICITUD FRONTEND: kardex:get:comprobantes");
            let configurationList = {
                socket: (socket || {}).id,
                init: configuracion.init,
                end: configuracion.end,
                code: configuracion.code
            };

            socket.broadcast.emit("kardexGetcomprobantesFR", configurationList);
        });

        socket.on("kardex:get:comprobantes:fr:response", (response) => {
            console.log("-----ENVIO RESPUESTA A FRONTEND BACKEND: kardex:get:comprobantes:response");

            let socketID = ((response || {}).configuration || {}).socket;
            let data = [];
            data = (response || {}).front || [];
            console.log(data);
            socket.to(`${socketID}`).emit("kardex:get:comprobantes:response", { id: response.id, data: data });
        });

        /* INSERTAR REGISTRO CAMPOS LIBRES KARDEX */

        socket.on("kardex:post:camposlibres", (configuracion) => {
            console.log("-----INIT SOLICITUD FRONTEND: kardex:post:camposlibres");
            let configurationList = {
                socket: (socket || {}).id,
                code: (configuracion || {}).code,
                num_albaran: (configuracion || {}).num_albaran,
                num_serie: (configuracion || {}).num_serie,
                n: (configuracion || {}).n,
                numero_despacho: (configuracion || {}).numero_despacho,
                tasa_cambio: (configuracion || {}).tasa_cambio,
                total_gastos: (configuracion || {}).total_gastos,
                flete_acarreo: (configuracion || {}).flete_acarreo,
                registro_sanitario: (configuracion || {}).registro_sanitario,
                motivo: (configuracion || {}).motivo,
                tipo_documento: (configuracion || {}).tipo_documento,
                numero_serie: (configuracion || {}).numero_serie,
                observacion: (configuracion || {}).observacion,
                contenedor: (configuracion || {}).contenedor
            };

            socket.broadcast.emit("kardexPostcamposlibresFR", configurationList);
        });

        socket.on("kardex:post:camposlibres:fr:response", (response) => {
            console.log("-----ENVIO RESPUESTA A FRONTEND BACKEND: kardex:post:camposlibres:fr:response");

            let socketID = ((response || {}).configuration || {}).socket;
            let data = [];
            data = (response || {}).data || [];
            console.log(data);
            socket.to(`${socketID}`).emit("kardex:post:camposlibres:response", { id: response.id, data: data });
        });

        /* INSERTAR CUO KARDEX */

        socket.on("kardex:post:cuo", (configuracion) => {
            console.log("-----INIT SOLICITUD FRONTEND: kardex:post:cuo");

            let configurationList = {
                socket: (socket || {}).id,
                data: configuracion
            };

            socket.broadcast.emit("kardexPostcuoFR", configurationList);
        });

        socket.on("kardex:post:cuo:fr:response", (response) => {
            console.log("-----ENVIO RESPUESTA A FRONTEND BACKEND: kardex:post:cuo:fr:response");

            let socketID = ((response || {}).configuration || {}).socket;
            let data = [];
            data = (response || {}).data || [];
            console.log(data);
            socket.to(`${socketID}`).emit("kardex:post:cuo:response", { id: response.id, data: data });
        });

        /* CONSULTA CUO KARDEX */

        socket.on("kardex:get:cuo", (configuracion) => {
            console.log("-----INIT SOLICITUD FRONTEND: kardex:get:cuo");
            let configurationList = {
                socket: (socket || {}).id,
                init: configuracion.init,
                end: configuracion.end,
                code: configuracion.code
            };

            socket.broadcast.emit("kardexGetcuoFR", configurationList);
        });

        socket.on("kardex:get:cuo:fr:response", (response) => {
            console.log("-----ENVIO RESPUESTA A FRONTEND BACKEND: kardex:get:comprobantes:response");

            let socketID = ((response || {}).configuration || {}).socket;
            let data = [];
            data = (response || {}).front || [];
            console.log(data);
            socket.to(`${socketID}`).emit("kardex:get:cuo:response", { id: response.id, data: data });
        });
    });
};