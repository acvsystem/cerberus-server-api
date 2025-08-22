export default function (io) {
    io.on('connection', async (socket) => {
        socket.on("update:file:FrontAgent", (body) => {
            let file = "";
            let isZip = false;

            switch ((body || {}).fileName) {
                case "SUNAT_ICG.zip":
                    file = "SUNAT_ICG.zip";
                    isZip = true;
                    break;
                case "XML_SUNAT_ICG.zip":
                    file = "configuracion_plugin_sunat.xml";
                    isZip = false;
                    break;
                case "VALIDACION.zip":
                    file = "VALIDACION.zip";
                    isZip = true;
                    break;
                case "DLL_NOTA_CREDITO.zip":
                    file = "DLL_NOTA_CREDITO.zip";
                    isZip = true;
                    break;
                case "PLUGIN_APP_METAS_PERU_VS":
                    file = "C:/FACTURACION_IT/agenteFront.py";
                    isZip = false;
                    break;
                case "PLUGIN_APP_METAS_PERU_BBW":
                    file = "C:/FACTURACION_IT/agenteFront.py";
                    isZip = false;
                    break;
                case "PLUGIN_APP_METAS_PERU_VSFA":
                    file = "C:/FACTURACION_IT/agenteFront.py";
                    isZip = false;
                    break;
                case "PLUGIN_APP_METAS_PERU_ECOM":
                    file = "C:/FACTURACION_IT/agenteFront.py";
                    isZip = false;
            }

            let configurationList = {
                socket: (socket || {}).id,
                fileName: (body || {}).fileName,
                hash: (body || {}).hash,
                dowFile: file,
                isZip: isZip,
                mac: (body || {}).mac || "notMac"
            };

            if ((body || {}).hash.length && (body || {}).fileName.length) {
                socket.broadcast.emit("update_file_Plugin", configurationList);
            }
        });

        socket.on("update:file:response", (response) => {
            let socketID = (response || {}).socket;
            let status = (response || {}).status;
            let mac = (response || {}).mac;

            let statusList = {
                mac: mac,
                status: status,
            };

            socket.to(`${socketID}`).emit("update:file:status", statusList);
        });
    });
}