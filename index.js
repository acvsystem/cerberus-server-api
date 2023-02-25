const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const cors = require('cors');

app.use(cors());

var bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: '1000000mb' }));
app.use(bodyParser.urlencoded({ limit: '1000000mb', extended: true }));

app.post('/verify', verifyData);

io.on('connection', (socket) => {
    socket.on('sendDataFront', (msg) => {
        console.log(msg['id']);
    });

    socket.on('consultingDataFront', (msg) => {
        console.log(msg['id']);
    });


    console.log('a user connected');

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(3200, () => {
    console.log('listening on *:3200');
});