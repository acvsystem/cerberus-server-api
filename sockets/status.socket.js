export default function (io) {
    io.on('connection', async (socket) => {
        socket.on('status:serverSUNAT', (data) => {
            socket.broadcast.emit("status:serverSUNAT:send", data);
        });

        socket.on('status:EQP', (data) => {
            socket.broadcast.emit("status:EQP:send", data);
        });
    });
}