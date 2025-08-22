export default function (io) {
    io.on('connection', async (socket) => {
        socket.on('comunicationStock', (email, arrCodeTienda) => {
            console.log('comunicationStock');
            socket.broadcast.emit("searchStockTest", email, arrCodeTienda);
        });

        socket.on('comunicationStockTable', (arrCodeTienda, barcode) => {
            console.log('comunicationStockTable');
            socket.broadcast.emit("searchStockTable", arrCodeTienda, barcode, (socket || {}).id);
        });

        socket.on('responseStock', (data) => {
            console.log(data);
            socket.to(`${listClient.id}`).emit("dataStock", data);
        });
    });
};