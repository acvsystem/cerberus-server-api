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


*********VERIFICACION DE BASES DE DATOS CON COE_DATA******

-----INIT SOLICITUD
FRONTEND: comparacion:get:bd
-----ENVIO A SERVIDOR BACKUP 
BACKEND: comparacionGetBdSBK
-----ENVIO RESPUESTA DE SERVIDOR A BACKEND
SERVIDOR: comparacion:get:sbk:response
-----ENVIO RESPUESTA A FRONTEND
BACKEND: comparacion:get:bd:response

****************** CONSULTA KARDEX *********************

-----INIT SOLICITUD
FRONTEND: kardex:get:comprobantes
-----ENVIO A FRONT RETAIL 
BACKEND: kardexGetcomprobantesFR
-----ENVIO RESPUESTA DE FRONT RETAIL A BACKEND
FRONT RETAIL: kardex:get:comprobantes:fr:response
-----ENVIO RESPUESTA A FRONTEND
BACKEND: kardex:get:comprobantes:response

****************** INSERTAR CAMPOS LIBRES KARDEX *********************

-----INIT SOLICITUD
FRONTEND: kardex:post:camposlibres
-----ENVIO A FRONT RETAIL 
BACKEND: kardexPostcamposlibresFR
-----ENVIO RESPUESTA DE FRONT RETAIL A BACKEND
FRONT RETAIL: kardex:post:camposlibres:fr:response
-----ENVIO RESPUESTA A FRONTEND
BACKEND: kardex:post:camposlibres:response


****************** INSERTAR CUO KARDEX *********************

-----INIT SOLICITUD
FRONTEND: kardex:post:cuo
-----ENVIO A FRONT RETAIL 
BACKEND: kardexPostcuoFR
-----ENVIO RESPUESTA DE FRONT RETAIL A BACKEND
FRONT RETAIL: kardex:post:cuo:fr:response
-----ENVIO RESPUESTA A FRONTEND
BACKEND: kardex:post:cuo:response


****************** CONSULTA CUO KARDEX *********************

-----INIT SOLICITUD
FRONTEND: kardex:get:cuo
-----ENVIO A FRONT RETAIL 
BACKEND: kardexGetcuoFR
-----ENVIO RESPUESTA DE FRONT RETAIL A BACKEND
FRONT RETAIL: kardex:get:cuo:fr:response
-----ENVIO RESPUESTA A FRONTEND
BACKEND: kardex:get:cuo:response

****************** CONSULTA STOCK TRASPASOS *********************

-----INIT SOLICITUD
FRONTEND: inventario:get:barcode
-----ENVIO A FRONT RETAIL 
BACKEND: inventarioGetbarcodeFR
-----ENVIO RESPUESTA DE FRONT RETAIL A BACKEND
FRONT RETAIL: inventario:get:fr:barcode:response
-----ENVIO RESPUESTA DE SERVIDOR BACKUP A BACKEND
BACKEND: inventario:get:barcode:response


****************** NOTIFICACIONES *********************

-----LISTEN NOTIFICACIONES
FRONTEND: notificaciones:get

*************/