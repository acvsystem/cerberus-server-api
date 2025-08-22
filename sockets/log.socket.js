import tokenController from "../controllers/csToken.js";

export default function (io) {
    io.on('connection', async (socket) => {
         const clientIp = socket.handshake.address;
        const auth_token = socket.handshake.auth.token;
        const payload = tokenController.socketVerifyToken(auth_token);
        let arUsuarioSocket = [];

        socket.onAny((event, data, callback) => {
            if (socket.handshake.query.code == 'app' || socket.handshake.query.code == 'frontend') {
                if (event != 'status:EQP' && event != 'status:serverSUNAT') {
                    const start = Date.now();
                    const responseData = { ok: true, recibido: data };
                    if (typeof ((payload || {}).decoded || {}).usuario != 'undefined') {

                        let indexSocket = arUsuarioSocket.findIndex((usk) => usk.usuario == ((payload || {}).decoded || {}).usuario);

                        if (indexSocket > -1) {
                            arUsuarioSocket[indexSocket]['idSocket'] = socket.id;
                        } else {
                            (arUsuarioSocket || []).push({
                                usuario: ((payload || {}).decoded || {}).usuario,
                                idSocket: socket.id
                            });
                        }
                    }


                    console.log('--- New request Socket ---');
                    console.log('Usuario', ((payload || {}).decoded || {}).usuario);
                    console.log('ID_Socket:', socket.id);
                    console.log('Hora:', new Date().toISOString());
                    console.log('IP:', clientIp);
                    console.log('event_response:', event);
                    console.log('response:', responseData);
                    console.log('conectados:', arUsuarioSocket);
                    console.log('Duración:', `${Date.now() - start}ms`);
                    console.log('----------------------');
                }
            }
        });
    });
}