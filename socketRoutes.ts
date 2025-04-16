/*MENU COMPROBANTES

*********VERIFICACION DE COMPROBANTES*******
-----INIT SOLICITUD
FRONTEND: comprobantes:get
-----ENVIO A FRONT RETAIL 
BACKEND: comprobantesGetFR
-----ENVIO RESPUESTA DE FRONT RETAIL A BACKEND
FRONT RETAIL: comprobantes:get:fr:response
-----ENVIO SOLICITUD A SERVIDOR BACKUP
BACKEND: comprobantesGetSBK
-----ENVIO RESPUESTA DE SERVIDOR BACKUP A BACKEND
SERVIDOR BACKUP: comprobantes:get:sbk:response
-----ENVIO RESPUESTA A FRONTEND
BACKEND: comprobantes:get:response


*********VERIFICACION DE TRANSACCIONES**********
-----INIT SOLICITUD
FRONTEND: transacciones:get
-----ENVIO A FRONT RETAIL 
BACKEND: transaccionesGetFR
-----ENVIO RESPUESTA DE FRONT RETAIL A BACKEND
FRONT RETAIL: transacciones:get:fr:response
-----ENVIO RESPUESTA A FRONTEND
BACKEND: transacciones:get:response


*********CONSULTA TERMINALES FRONT RETAIL**********
-----INIT SOLICITUD
FRONTEND: terminales:get:name
-----ENVIO A FRONT RETAIL 
BACKEND: terminalesGetNameFR
-----ENVIO RESPUESTA DE FRONT RETAIL A BACKEND
FRONT RETAIL: terminales:get:name:fr:response
-----ENVIO RESPUESTA A FRONTEND
BACKEND: terminales:get:name:response


*********CONSULTA CANTIDAD EN TERMINALES FRONT RETAIL******
-----INIT SOLICITUD
FRONTEND: terminales:get:cantidad
-----ENVIO A FRONT RETAIL 
BACKEND: terminalesGetcantidadFR
-----ENVIO RESPUESTA DE FRONT RETAIL A BACKEND
FRONT RETAIL: terminales:get:cantidad:fr:response
-----ENVIO RESPUESTA A FRONTEND
BACKEND: terminales:get:cantidad:response


*************TRANSFERENCIA DE COLA ENTRE FRONT RETAIL***************

-----INIT SOLICITUD
FRONTEND: transacciones:post
-----ENVIO A FRONT RETAIL 
BACKEND: transaccionesPostFR

*/