export default function (io) {
    io.on('connection', async (socket) => {
        /* ENVIAR TRSPASOS POR FTP */

        app.post('/upload/traspasos', uploadTraspasos.single('file'), async (req, res) => { // transfers/upload/file - [POST]{formData:Blob}
            const filePath = req.file.path;
            const fileName = req.file.originalname;
            const rutaDirectory = req.body.ftpDirectorio;
            const client = new Client()
            client.ftp.verbose = true;

            try {
                await client.access({
                    host: '199.89.54.31',
                    port: 9879,
                    user: 'ftpuser25801247',
                    password: 'Cfz&}q)]i_^c~6MSVPI%',
                    secure: false
                });

                await client.ensureDir(`ITPERU/${rutaDirectory}`)
                await client.uploadFrom(filePath, fileName);
                await client.uploadFromDir(`ITPERU/${rutaDirectory}`)

                res.send('Archivo subido al FTP con éxito');
            } catch (err) {
                res.status(500).send('Error subiendo al FTP: ' + err.message);
            } finally {
                client.close();
                fs.unlinkSync(filePath); // Borrar archivo local temporal
            }
        });
    });
};