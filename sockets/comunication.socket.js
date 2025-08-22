import sessionSocket from '../controllers/csSessionSocket.js'

export default function (io) {
    io.on('connection', async (socket) => {

        let agenteList = [];
        let codeQuery = socket.handshake.query.code;
        let codeTerminal = socket.handshake.headers.code;
        let isIcg = socket.handshake.headers.icg;

        if ((codeTerminal || "").length) {
            let indexAgente = (agenteList || []).findIndex((data) => (data || {}).code == codeTerminal);

            if (indexAgente != -1) {
                agenteList[indexAgente]['id'] = socket.id;
            } else {
                (agenteList || []).push({ id: socket.id, code: codeTerminal });
            }
        }

        if (codeQuery == 'frontend') {
            let fullSession = await sessionSocket.connect();
            socket.broadcast.emit("comprobantes:get:response", fullSession);
        }

        if (codeTerminal == "SRVFACT") {
            await pool.query(`UPDATE TB_ESTATUS_SERVER_BACKUP SET ESTATUS_CONEXION = 1 WHERE ID_ESTATUS_SERVER = 1;`);
            await pool.query(`UPDATE TB_ESTATUS_SERVER_BACKUP SET OLD_ESTATUS = 1 WHERE ID_ESTATUS_SERVER = 1;`);
        }


        socket.on('disconnect', async () => { // DESCONEXION DE ALGUN ENLACE (SE ENVIA A COMPROBANTES)
            if (codeTerminal == "SRVFACT") {
                await pool.query(`UPDATE TB_ESTATUS_SERVER_BACKUP SET ESTATUS_CONEXION = 0 WHERE ID_ESTATUS_SERVER = 1;`);
                setTimeout(async () => {
                    let [conexionList] = await pool.query(`SELECT * FROM TB_ESTATUS_SERVER_BACKUP;`);
                    if (!((conexionList || [])[0] || {}).ESTATUS_CONEXION) {
                        await pool.query(`UPDATE TB_ESTATUS_SERVER_BACKUP SET OLD_ESTATUS = 0 WHERE ID_ESTATUS_SERVER = 1;`);
                        sessionSocket.disconnectServer();
                    }
                }, 300000);

                socket.broadcast.emit("status:serverSUNAT:send", { 'code': 'SRVFACT', 'online': 'false' });
            } else if (isIcg != 'true') {
                let listSessionDisconnet = await sessionSocket.disconnect(codeTerminal);
                socket.broadcast.emit("comprobantes:get:response", listSessionDisconnet); //ENVIA A FRONTEND COMPROBANTES
            }

            if (isIcg == 'true') {
                socket.broadcast.emit("conexion:serverICG:send", [{ 'code': codeTerminal, 'isConect': '0' }]);
            }

            if (codeTerminal == 'EQP' && (macEqp || "").length) {
                socket.broadcast.emit("desconexion:eqp:send", [{ 'mac': macEqp }]);
            }

            console.log('---- Desconection socket ---');
            console.log(`desconnect: ${codeTerminal || codeQuery}`);
            console.log(`socket: ${socket.id}`,);
            console.log(`allSocket: ${JSON.stringify(agenteList)}`,);
            console.log('dateTime:', new Date().toISOString());
            console.log('-------------------------');
        });


        console.log('---- New connection socket ---');
        console.log(`connect: ${codeTerminal || codeQuery}`);
        console.log(`socket: ${socket.id}`,);
        console.log(`allSocket: ${JSON.stringify(agenteList)}`,);
        console.log('dateTime:', new Date().toISOString());
        console.log('-------------------------');
    });
}