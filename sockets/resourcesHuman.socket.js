export default function (io) {
    io.on('connection', (socket) => {
        socket.on('consultAsistencia', async (configuracion) => {
            //(configuracion || [])['socket'] = listClient.id;

            socket.emit("searchAsistencia", configuracion);
        });

        socket.on('reporteAssitencia', async (resData) => {
            print(resData)
            if ((resData || "").id == "server") {
                socket.to(`${(resData || [])['configuration']['socket']}`).emit("responseAsistencia", resData);
            }
        });

        socket.on("consultaMarcacion", (configuracion) => {
            console.log(configuracion);
            let configurationList = {
                socket: (socket || {}).id,
                isDefault: configuracion.isDefault,
                isFeriados: configuracion.isFeriados,
                isDetallado: configuracion.isDetallado,
                centroCosto: configuracion.centroCosto,
                dateList: configuracion.dateList
            };

            socket.broadcast.emit("consultarEJB", configurationList);
            socket.broadcast.emit("consultarServGen", configurationList);
        });

        socket.on("consultaPlanilla", (configuracion) => {
            console.log(configuracion);
            let configurationList = {
                socket: (socket || {}).id,
                tipo: configuracion.tipo_planilla,
                date: configuracion.date
            };

            socket.broadcast.emit("consultarQuincena", configurationList);
        });

        socket.on("resAdelandoQuinc", (response) => {
            let socketID = (response || {}).configuration.socket;
            let dataEJB = [];
            dataEJB = JSON.parse((response || {}).serverData || []);
            console.log(dataEJB);
            socket.to(`${socketID}`).emit("reporteQuincena", { id: response.id, data: dataEJB });
        });

        socket.on("marcacion_of", async (data) => {
            socket.broadcast.emit("solicitar_marcacion_of", { socketID: (socket || {}).id });
        });

        socket.on("solicitar_aprobacion_hrx", async (data) => {

            let [arHrExtra] = await pool.query(`SELECT * FROM TB_AUTORIZAR_HR_EXTRA WHERE HR_EXTRA_ACOMULADO = '${data.hora_extra}' AND CODIGO_TIENDA = '${data.codigo_tienda}'  AND FECHA = '${data.fecha}' AND NRO_DOCUMENTO_EMPLEADO = '${data.nro_documento}';`);

            if (!(arHrExtra || []).length) {
                await pool.query(`INSERT INTO TB_AUTORIZAR_HR_EXTRA(
                 HR_EXTRA_ACOMULADO,
                 NRO_DOCUMENTO_EMPLEADO,
                 NOMBRE_COMPLETO,
                 APROBADO,
                 RECHAZADO,
                 FECHA,
                 CODIGO_TIENDA)VALUES('${(data || {}).hora_extra}','${(data || {}).nro_documento}','${(data || {}).nombre_completo}',${(data || {}).aprobado},false,'${(data || {}).fecha}','${(data || {}).codigo_tienda}')`);
            }

            let [arAutorizacion] = await pool.query(`SELECT * FROM TB_AUTORIZAR_HR_EXTRA;`);

            let tiendasList = [
                { code: '7A', name: 'BBW JOCKEY', email: 'bbwjockeyplaza@metasperu.com' },
                { code: '9N', name: 'VS MALL AVENTURA', email: 'vsmallaventura@metasperu.com' },
                { code: '7J', name: 'BBW MALL AVENTURA', email: 'bbwmallaventura@metasperu.com' },
                { code: '7E', name: 'BBW LA RAMBLA', email: 'bbwlarambla@metasperu.com' },
                { code: '9D', name: 'VS LA RAMBLA', email: 'vslarambla@metasperu.com' },
                { code: '9B', name: 'VS PLAZA NORTE', email: 'vsplazanorte@metasperu.com' },
                { code: '7C', name: 'BBW SAN MIGUEL', email: 'bbwsanmiguel@metasperu.com' },
                { code: '9C', name: 'VS SAN MIGUEL', email: 'vssanmiguel@metasperu.com' },
                { code: '7D', name: 'BBW SALAVERRY', email: 'bbwsalaverry@metasperu.com' },
                { code: '9I', name: 'VS SALAVERRY', email: 'vssalaverry@metasperu.com' },
                { code: '9G', name: 'VS MALL DEL SUR', email: 'vsmalldelsur@metasperu.com' },
                { code: '9H', name: 'VS PURUCHUCO', email: 'vspuruchuco@metasperu.com' },
                { code: '9M', name: 'VS ECOMMERCE', email: 'vsecommpe@metasperu.com' },
                { code: '7F', name: 'BBW ECOMMERCE', email: 'bbwecommperu@metasperu.com' },
                { code: '9K', name: 'VS MEGA PLAZA', email: 'vsmegaplaza@metasperu.com' },
                { code: '9L', name: 'VS MINKA', email: 'vsoutletminka@metasperu.com' },
                { code: '9F', name: 'VSFA JOCKEY FULL', email: 'vsfajockeyplaza@metasperu.com' },
                { code: '7A7', name: 'BBW ASIA', email: 'bbwasia@metasperu.com' },
                { code: '9P', name: 'VS MALL PLAZA', email: 'vsmallplazatrujillo@metasperu.com' },
                { code: '7I', name: 'BBW MALL PLAZA', email: 'bbwmallplazatrujillo@metasperu.com' }
            ];

            let selectedLocal = tiendasList.find((td) => td.code == data.codigo_tienda) || {};

            socket.broadcast.emit("lista_solicitudes", arAutorizacion);

            let bodyHTML = `<table style="width:100%;border-spacing:0">
                        <tbody>
                            <tr style="display:flex">
                                <td>
                                    <table style="border-radius:4px;border-spacing:0;border:1px solid #155795;min-width:450px">
                                        <tbody>
                                            <tr>
                                                <td style="border-top-left-radius:4px;border-top-right-radius:4px;display:flex;background:#155795;padding:20px">
                                                    <p style="margin-left:72px;color:#fff;font-weight:700;font-size:30px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif"><span class="il">METAS PERU</span> S.A.C</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="text-align: center;padding:10px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
                                                    <p>Hola, tienes horas extras pendientes de aprobar.</p> 
        
                                                    <table align="left" cellspacing="0" style="width: 100%;border: solid 1px;">
                                                        <thead>
                                                            <tr>
                                                                <th style="border: 1px solid #9E9E9E;border-right:0px" width="110px">FECHA</th>
                                                                <th style="border: 1px solid #9E9E9E;border-right:0px" width="110px">NOMBRE COMPLETO</th>
                                                                <th style="border: 1px solid #9E9E9E;border-right:0px" width="110px">H.EXTRA</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr>
                                                                <td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center;border-right:0px">${(data || {}).fecha}</td>
                                                                <td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center">${(data || {}).nombre_completo}</td>
                                                                <td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center;border-right:0px">${(data || {}).hora_extra}</td>
                                                            </tr>
                                                    
                                                        </tbody>
                                                    </table>
        
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="margin-bottom:10px;display:flex">
                                                    <a style="margin-left:155px;text-decoration:none;background:#155795;padding:10px 30px;font-size:18px;color:#ffff;border-radius:4px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif" href="http://metasperu.net.pe/auth-hora-extra" target="_blank">horas extras</a>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>`;

            let correo = ['itperu@metasperu.com', 'johnnygermano@metasperu.com'];

            pool.query(`SELECT TB_LISTA_TIENDA.SERIE_TIENDA,TB_LOGIN.EMAIL FROM TB_USUARIO_TIENDAS_ASIGNADAS 
                        INNER JOIN TB_LISTA_TIENDA ON TB_LISTA_TIENDA.ID_TIENDA = TB_USUARIO_TIENDAS_ASIGNADAS.ID_TIENDA_TASG
                        INNER JOIN TB_LOGIN ON TB_LOGIN.ID_LOGIN = TB_USUARIO_TIENDAS_ASIGNADAS.ID_USUARIO_TASG WHERE TB_LISTA_TIENDA.SERIE_TIENDA = '${(data || {}).codigo_tienda}';`).then(([tienda]) => {

                console.log("solicitar_aprobacion_hrx", (data || {}).codigo_tienda, tienda);

                (tienda || []).filter((td, i) => {
                    (correo || []).push((td || {}).EMAIL);

                    if ((tienda || []).length - 1 == i) {
                        console.log("solicitar_aprobacion_hrx", correo);

                        emailController.sendEmail(correo, `SOLICITUD DE APROBACION DE HORA EXTRA - ${(selectedLocal || {}).name || ''}`, bodyHTML, null, null)
                            .catch(error => res.send(error));
                    }
                });
            });
        });

        socket.on("autorizar_hrx", async (data) => {

            let [arHrExtra] = await pool.query(`SELECT * FROM TB_AROBADO_HR_EXTRA WHERE HR_EXTRA_ACOMULADO = '${data.hora_extra}' AND CODIGO_TIENDA = '${data.codigo_tienda}'  AND FECHA = '${data.fecha}' AND NRO_DOCUMENTO_EMPLEADO = '${data.nro_documento}';`);
            let aprobado = data.aprobado ? 'aprobado' : 'rechazado';

            if (!(arHrExtra || []).length) {
                await pool.query(`INSERT INTO TB_AROBADO_HR_EXTRA(
                HR_EXTRA_ACOMULADO,
                NRO_DOCUMENTO_EMPLEADO,
                NOMBRE_COMPLETO,
                APROBADO,
                RECHAZADO,
                FECHA,
                CODIGO_TIENDA)VALUES('${data.hora_extra}','${data.nro_documento}','${data.nombre_completo}',${data.aprobado},${data.rechazado},'${data.fecha}','${data.codigo_tienda}')`);

                await pool.query(`UPDATE TB_AUTORIZAR_HR_EXTRA SET COMENTARIO = '${((data || {}).comentario || "")}', USUARIO_MODF = '${data.usuario}', APROBADO = ${data.aprobado == true ? 1 : 0},RECHAZADO = ${data.rechazado} WHERE HR_EXTRA_ACOMULADO = '${data.hora_extra}' AND CODIGO_TIENDA = '${data.codigo_tienda}'  AND FECHA = '${data.fecha}' AND NRO_DOCUMENTO_EMPLEADO = '${data.nro_documento}';`);
                let [arHrExtra] = await pool.query(`SELECT * FROM TB_HORA_EXTRA_EMPLEADO WHERE FECHA = '${data.fecha}' AND NRO_DOCUMENTO_EMPLEADO = '${data.nro_documento}' AND HR_EXTRA_ACUMULADO = '${data.hora_extra}';`);

                if ((arHrExtra || []).length || typeof arHrExtra != 'undefined') {
                    await pool.query(`UPDATE TB_HORA_EXTRA_EMPLEADO SET ESTADO = '${aprobado}',APROBADO = ${data.aprobado == true ? 1 : 0} WHERE ID_HR_EXTRA = ${((arHrExtra || [])[0] || {})['ID_HR_EXTRA']};`);
                }

            } else {

                let [arHrExtra] = await pool.query(`SELECT * FROM TB_HORA_EXTRA_EMPLEADO WHERE FECHA = '${data.fecha}' AND NRO_DOCUMENTO_EMPLEADO = '${data.nro_documento}' AND HR_EXTRA_ACUMULADO = '${data.hora_extra}';`);

                if ((arHrExtra || []).length || typeof arHrExtra != 'undefined') {
                    console.log(`UPDATE TB_HORA_EXTRA_EMPLEADO SET ESTADO = '${aprobado}',APROBADO = ${data.aprobado == true ? 1 : 0} WHERE ID_HR_EXTRA = ${((arHrExtra || [])[0] || {})['ID_HR_EXTRA']};`);
                    await pool.query(`UPDATE TB_HORA_EXTRA_EMPLEADO SET ESTADO = '${aprobado}',APROBADO = ${data.aprobado == true ? 1 : 0} WHERE ID_HR_EXTRA = ${((arHrExtra || [])[0] || {})['ID_HR_EXTRA']};`);
                }

                await pool.query(`UPDATE TB_AUTORIZAR_HR_EXTRA SET COMENTARIO = '${((data || {}).comentario || "")}', USUARIO_MODF = '${data.usuario}', APROBADO = ${data.aprobado == true ? 1 : 0},RECHAZADO = ${data.rechazado} WHERE HR_EXTRA_ACOMULADO = '${data.hora_extra}' AND CODIGO_TIENDA = '${data.codigo_tienda}'  AND FECHA = '${data.fecha}' AND NRO_DOCUMENTO_EMPLEADO = '${data.nro_documento}';`);
                let comentario = data.aprobado == true ? "" : `${((data || {}).comentario || "")}`;
                await pool.query(`UPDATE TB_AROBADO_HR_EXTRA SET COMENTARIO = '${comentario}', APROBADO = ${data.aprobado == true ? 1 : 0}, RECHAZADO = ${data.rechazado} WHERE HR_EXTRA_ACOMULADO = '${data.hora_extra}' AND CODIGO_TIENDA = '${data.codigo_tienda}'  AND FECHA = '${data.fecha}' AND NRO_DOCUMENTO_EMPLEADO = '${data.nro_documento}';`);


            }

            let [arAutorizacion] = await pool.query(`SELECT * FROM TB_AUTORIZAR_HR_EXTRA;`);
            let [arAutorizacionEmp] = await pool.query(`SELECT * FROM TB_AUTORIZAR_HR_EXTRA WHERE NRO_DOCUMENTO_EMPLEADO = '${data.nro_documento}';`);
            let [arAutorizacionResponse] = await pool.query(`SELECT * FROM TB_AROBADO_HR_EXTRA WHERE HR_EXTRA_ACOMULADO = '${data.hora_extra}' AND CODIGO_TIENDA = '${data.codigo_tienda}'  AND FECHA = '${data.fecha}' AND NRO_DOCUMENTO_EMPLEADO = '${data.nro_documento}';`);


            if (aprobado == 'rechazado') {

                if ((data || {}).comentario == 'No marco su salida de turno' || (data || {}).comentario == 'No marco su salida a break') {
                    let tiendasList = [
                        { code: '7A', name: 'BBW JOCKEY', email: 'bbwjockeyplaza@metasperu.com' },
                        { code: '9N', name: 'VS MALL AVENTURA', email: 'vsmallaventura@metasperu.com' },
                        { code: '7J', name: 'BBW MALL AVENTURA', email: 'bbwmallaventura@metasperu.com' },
                        { code: '7E', name: 'BBW LA RAMBLA', email: 'bbwlarambla@metasperu.com' },
                        { code: '9D', name: 'VS LA RAMBLA', email: 'vslarambla@metasperu.com' },
                        { code: '9B', name: 'VS PLAZA NORTE', email: 'vsplazanorte@metasperu.com' },
                        { code: '7C', name: 'BBW SAN MIGUEL', email: 'bbwsanmiguel@metasperu.com' },
                        { code: '9C', name: 'VS SAN MIGUEL', email: 'vssanmiguel@metasperu.com' },
                        { code: '7D', name: 'BBW SALAVERRY', email: 'bbwsalaverry@metasperu.com' },
                        { code: '9I', name: 'VS SALAVERRY', email: 'vssalaverry@metasperu.com' },
                        { code: '9G', name: 'VS MALL DEL SUR', email: 'vsmalldelsur@metasperu.com' },
                        { code: '9H', name: 'VS PURUCHUCO', email: 'vspuruchuco@metasperu.com' },
                        { code: '9M', name: 'VS ECOMMERCE', email: 'vsecommpe@metasperu.com' },
                        { code: '7F', name: 'BBW ECOMMERCE', email: 'bbwecommperu@metasperu.com' },
                        { code: '9K', name: 'VS MEGA PLAZA', email: 'vsmegaplaza@metasperu.com' },
                        { code: '9L', name: 'VS MINKA', email: 'vsoutletminka@metasperu.com' },
                        { code: '9F', name: 'VSFA JOCKEY FULL', email: 'vsfajockeyplaza@metasperu.com' },
                        { code: '7A7', name: 'BBW ASIA', email: 'bbwasia@metasperu.com' },
                        { code: '9P', name: 'VS MALL PLAZA', email: 'vsmallplazatrujillo@metasperu.com' },
                        { code: '7I', name: 'BBW MALL PLAZA', email: 'bbwmallplazatrujillo@metasperu.com' }
                    ];

                    let selectedLocal = tiendasList.find((td) => td.code == data.codigo_tienda) || {};

                    let bodyHTML = `<table style="width:100%;border-spacing:0">
                        <tbody>
                            <tr style="display:flex">
                                <td>
                                    <table style="border-radius:4px;border-spacing:0;border:1px solid #155795;min-width:450px">
                                        <tbody>
                                            <tr>
                                                <td style="border-top-left-radius:4px;border-top-right-radius:4px;background:#155795;padding:40px;text-align: center">
                                                    <p style="color:#fff;font-weight:700;font-size:30px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif"><span class="il">METAS PERU</span> S.A.C</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="text-align: center;padding:10px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
                                                    <p style="font-weight: 500;">Usuario responsable: ${data.usuario}</p>
                                                    <p>Hora extra rechazada por marcacion.</p> 
        
                                                    <table align="left" cellspacing="0" style="width: 100%;border: solid 1px;">
                                                        <thead>
                                                            <tr>
                                                                <th style="border: 1px solid #9E9E9E;border-right:0px" width="150px">TIENDA</th>
                                                                <th style="border: 1px solid #9E9E9E;border-right:0px" width="110px">FECHA</th>
                                                                <th style="border: 1px solid #9E9E9E;border-right:0px" width="110px">H.EXTRA</th>
                                                                <th style="border: 1px solid #9E9E9E;border-right:0px" width="180px">NOMBRE COMPLETO</th>
                                                                <th style="border: 1px solid #9E9E9E;border-right:0px" width="200px">COMENTARIO</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr>
                                                                <td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center;border-right:0px">${(selectedLocal || {}).name}</td>
                                                                <td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center;border-right:0px">${(data || {}).fecha}</td>
                                                                <td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center;border-right:0px">${(data || {}).hora_extra}</td>
                                                                <td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center">${((arAutorizacionEmp || [])[0] || {})['NOMBRE_COMPLETO']}</td>
                                                                <td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center;border-right:0px">${(data || {}).comentario}</td>
        
                                                            </tr>
                                                    
                                                        </tbody>
                                                    </table>
        
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>`;

                    let correo = ['itperu@metasperu.com', 'johnnygermano@metasperu.com', 'metasperurrhh@gmail.com', 'metasperurrhh2@gmail.com'];

                    emailController.sendEmail(correo, `NOTIFICACION H.EXTRA RECHAZADO POR MARCACION - ${(selectedLocal || {}).name || ''}`, bodyHTML, null, null)
                        .catch(error => res.send(error));
                }
            }

            socket.broadcast.emit("lista_solicitudes", arAutorizacion);
            socket.broadcast.emit("respuesta_autorizacion", arAutorizacionResponse);
        });

        socket.on("actualizarHorario", async (data) => {

            let dataHorario = data || [];

            dataHorario.filter(async (dth) => {
                await pool.query(`DELETE FROM TB_DIAS_TRABAJO WHERE ID_TRB_HORARIO = ${(dth || {}).id};`);
                await pool.query(`DELETE FROM TB_DIAS_LIBRE WHERE ID_TRB_HORARIO = ${(dth || {}).id};`);
                await pool.query(`DELETE FROM TB_OBSERVACION WHERE ID_OBS_HORARIO = ${(dth || {}).id};`);



                dth['rg_hora'].filter(async (rg, i) => {

                    let data = await pool.query(`SELECT * FROM TB_RANGO_HORA WHERE CODIGO_TIENDA = '${(rg || {}).codigo_tienda}' AND ID_RG_HORARIO = ${(dth || {}).id} AND ID_RANGO_HORA = ${(rg || {}).id};`);

                    if (Object.values(data[0]).length) {

                        await pool.query(`UPDATE TB_RANGO_HORA SET RANGO_HORA = '${rg.rg}' WHERE ID_RANGO_HORA = ${(rg || {}).id};`);
                    } else {
                        let dataRg = await pool.query(`SELECT * FROM TB_RANGO_HORA WHERE CODIGO_TIENDA = '${(rg || {}).codigo_tienda}' AND ID_RG_HORARIO = ${(dth || {}).id} AND RANGO_HORA = '${rg.rg}';`);

                        if (!Object.values(dataRg[0]).length) {
                            console.log(dth.cargo, `SELECT * FROM TB_RANGO_HORA WHERE CODIGO_TIENDA = '${(rg || {}).codigo_tienda}' AND ID_RG_HORARIO = ${(dth || {}).id} AND RANGO_HORA = '${rg.rg}';`);
                            console.log(!Object.values(dataRg[0]).length);
                            await pool.query(`INSERT INTO TB_RANGO_HORA(CODIGO_TIENDA,RANGO_HORA,ID_RG_HORARIO)VALUES('${dth.codigo_tienda}','${rg.rg}',${(dth || {}).id})`);
                        }
                    }

                });

                let [diasHorario] = await pool.query(`SELECT * FROM TB_DIAS_HORARIO WHERE ID_DIA_HORARIO = ${(dth || {}).id};`);

                if (dth['dias'].length) {
                    dth['dias'].filter(async (diah) => {

                        if ((diasHorario || []).length) {
                            let [diaHorarioSelected] = await pool.query(`SELECT * FROM TB_DIAS_HORARIO WHERE DIA = '${(diah || {}).dia}' AND ID_DIA_HORARIO = ${(dth || {}).id};`);
                            await pool.query(`SET FOREIGN_KEY_CHECKS=0;`);
                            await pool.query(`UPDATE TB_DIAS_HORARIO SET FECHA='${diah.fecha}' , FECHA_NUMBER='${diah.fecha_number}' WHERE ID_DIAS = ${(diaHorarioSelected[0] || []).ID_DIAS};`);
                        } else {
                            await pool.query(`SET FOREIGN_KEY_CHECKS=0;`);
                            await pool.query(`INSERT INTO TB_DIAS_HORARIO(DIA,FECHA,ID_DIA_HORARIO,POSITION,FECHA_NUMBER)VALUES('${diah.dia}','${diah.fecha}',${(dth || {}).id},${(diah || {}).position},'${(diah || {}).fecha_number}')`);
                        }

                    });
                }

                if (dth['dias_trabajo'].length) {
                    dth['dias_trabajo'].filter(async (diat) => {
                        await pool.query(`SET FOREIGN_KEY_CHECKS=0;`);
                        await pool.query(`INSERT INTO TB_DIAS_TRABAJO(CODIGO_TIENDA,NUMERO_DOCUMENTO,NOMBRE_COMPLETO,ID_TRB_RANGO_HORA,ID_TRB_DIAS,ID_TRB_HORARIO)VALUES('${diat.codigo_tienda}','${diat.numero_documento}','${diat.nombre_completo}',${(diat || {}).rg},${(diat || {}).id_dia},${(dth || {}).id})`);
                    });
                }

                if (dth['dias_libres'].length) {
                    dth['dias_libres'].filter(async (diat) => {
                        await pool.query(`SET FOREIGN_KEY_CHECKS=0;`);
                        await pool.query(`INSERT INTO TB_DIAS_LIBRE(CODIGO_TIENDA,NUMERO_DOCUMENTO,NOMBRE_COMPLETO,ID_TRB_RANGO_HORA,ID_TRB_DIAS,ID_TRB_HORARIO)VALUES('${diat.codigo_tienda}','${diat.numero_documento}','${diat.nombre_completo}',${diat.rg},${diat.id_dia},${(dth || {}).id})`);
                    });
                }

                if (dth['observacion'].length) {
                    dth['observacion'].filter(async (obs) => {
                        await pool.query(`SET FOREIGN_KEY_CHECKS=0;`);
                        await pool.query(`INSERT INTO TB_OBSERVACION(ID_OBS_DIAS,ID_OBS_HORARIO,CODIGO_TIENDA,NOMBRE_COMPLETO,OBSERVACION)VALUES(${(obs || {}).id_dia},${(dth || {}).id},'${(obs || {}).codigo_tienda}','${(obs || {}).nombre_completo}','${(obs || {}).observacion}')`);
                    });
                }
            });

        });

        socket.on("consultaHorasTrab", (configuracion) => {
            console.log("consultaHorasTrab", configuracion);
            let configurationList = {
                socket: (socket || {}).id,
                fechain: configuracion[0].fechain,
                fechaend: configuracion[0].fechaend,
                nro_documento: configuracion[0].nro_documento
            };

            socket.broadcast.emit("consultaHoras", configurationList);
        });


        socket.on("consultaListaEmpleado", (cntCosto) => {
            console.log(cntCosto);
            let configurationList = {
                socket: (socket || {}).id,
                cntCosto: cntCosto
            };
            console.log(configurationList);
            socket.broadcast.emit("consultarEJB", configurationList);
            socket.broadcast.emit("consultarEmpleados", configurationList);
        });

        socket.on("horario/empleadoEJB", (cntCosto) => {
            console.log(cntCosto);
            let configurationList = {
                socket: (socket || {}).id,
                cntCosto: cntCosto
            };

            socket.broadcast.emit("consultarEJB", configurationList);
        });

        socket.on("listaEmpleados", (response) => {
            let data = response;
            socket.to(`${(data || [])['configuration']['socket']}`).emit("reporteEmpleadoTienda", { id: data.id, data: JSON.parse((data || {}).serverData || []) });
        });

        socket.on("resEmpleados", (response) => {
            let data = response;
            let parseEJB = [];
            let parseHuellero = [];
            let dataResponse = [];
            let IDSocket = data.socket;

            if (data.id == "EJB") {
                let dataEJB = [];
                dataEJB = JSON.parse((data || {}).serverData || []);

                if (data.id == "EJB" && dataEJB.length) {
                    console.log("EJB", true);
                }

                (dataEJB || []).filter((ejb) => {

                    parseEJB.push({
                        id: "EJB",
                        codigoEJB: ((ejb || {}).CODEJB || "").trim(),
                        nombre_completo: `${(ejb || {}).APEPAT} ${(ejb || {}).APEMAT} ${(ejb || {}).NOMBRE}`,
                        nro_documento: ((ejb || {}).NUMDOC || "").trim(),
                        telefono: ((ejb || {}).TELEFO || "").trim(),
                        email: ((ejb || {}).EMAIL || "").trim(),
                        fec_nacimiento: ((ejb || {}).FECNAC || "").trim(),
                        fec_ingreso: ((ejb || {}).FECING || "").trim(),
                        status: ((ejb || {}).STATUS || "").trim(),
                        unid_servicio: ((ejb || {}).UNDSERVICIO || "").trim(),
                        code_unid_servicio: ((ejb || {}).CODUNDSERVICIO || "").trim(),
                    });

                });

            }

            if (data.id == "servGeneral") {
                let dataServGeneral = [];
                dataServGeneral = JSON.parse((data || {}).serverData || []);

                if (data.id == "servGeneral" && dataServGeneral.length) {
                    console.log("servGeneral", true);
                    console.log(dataServGeneral);
                }

                (dataServGeneral || []).filter((huellero) => {
                    parseHuellero.push({
                        id: "servGeneral",
                        nro_documento: (huellero || {}).nroDocumento,
                        dia: (huellero || {}).dia,
                        hr_ingreso: (huellero || {}).hrIn,
                        hr_salida: (huellero || {}).hrOut,
                        hr_trabajadas: (huellero || {}).hrWorking,
                        caja: (huellero || {}).caja,
                        rango_horario: '',
                        isTardanza: false
                    });
                });

            }

            socket.to(`${listClient.id}`).emit("reporteHuellero", { id: data.id, data: JSON.parse((data || {}).serverData || []) });
            socket.to(`${listClient.id}`).emit("reporteEmpleadoTienda", { id: data.id, data: parseEJB });
        });
    });
};