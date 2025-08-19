//DOCUMENTACION DE API's

/* STORES */
    // stores/all - [GET]
        /* JSON RESPONSE
            serie: SERIE_TIENDA
            description: DESCRIPCION
            code_wharehouse: COD_ALMACEN
            service_unit: UNID_SERVICIO
            status: ESTATUS
            store_type: TIPO_TIENDA
            email: EMAIL
            code_store_ejb: COD_TIENDA_EJB
         */
    // stores/terminals/all - [GET]
        /* JSON RESPONSE
            code_terminal: CODIGO_TERMINAL
            description: DESCRIPCION
            verification: VERIFICACION
            voucher_quantity: CANT_COMPROBANTES
            online: ISONLINE
        */

/* CONFIGURATION */
    /// configuration/client/list/clear - [POST]{client_clear}
    /// configuration/client/list/clear - [GET]
        /* JSON RESPONSE
            client_clear: LIST_CLIENTE
        */
    /// configuration/plugin/sunat - [GET]
        /* JSON RESPONSE
            XML_ETIQUIETA_GROUP,
            XML_TIPO_FORMULARIO,
            XML_EMAIL_PRUEBA, 
            XML_ASUNTO_EMAIL_PROMO, 
            CONVERT(XML_BODY_EMAIL USING utf8) AS XML_BODY_EMAIL,
            XML_IS_HTML,
            XML_SERVICIO_EMAIL, 
            XML_SERVICIO_PASSWORD,
            XML_API_SUNAT,
            XML_TK_SUNAT,
            XML_CHECK_PROMOCION,
            APLICACION_FILE 
        */
    /// configuration/menu/all - [GET]
        /* JSON RESPONSE
            name_menu: NOMBRE_MENU
            route: RUTA
            icon: ICO
        */
    /// configuration/level/all - [GET]
        /* JSON RESPONSE
            level: NIVEL_DESCRIPCION
        */
    /// configuration/menu - [POST]{ name_menu,route}
    /// configuration/menu/search - [GET]{level}
    /// configuration/level - [POST]{level}
    /// configuration/menu/permission - [POST]{id_menu,level}
    /// configuration/menu/permission - [DELETE]{id_permission}
    /// configuration/asignation/store - [POST]{id_user,id_store,description_store}
    /// configuration/asignation/store - [DELETE]{id_asignation}
    /// configuration/asignation/store - [GET]{id_user}


/* BALLOT */  
    // ballot/type/all - [GET]
        /* JSON RESPONSE
            description: DESCRIPCION
        */
    // ballot/authorization/all - [GET]
        /* JSON RESPONSE
            accumulated_overtime: HR_EXTRA_ACOMULADO
            document_employe: TB_AUTORIZAR_HR_EXTRA
            full_name: NOMBRE_COMPLETO
            approved: APROBADO
            rejection: RECHAZADO
            date: FECHA
            code_store: CODIGO_TIENDA
            modified_by: USUARIO_MODF
            comment: COMENTARIO
        */
    // ballot/all - [GET]
        /* JSON RESPONSE
            codigo_papeleta: CODIGO_PAPELETA
            nombre_completo: NOMBRE_COMPLETO
            documento: NRO_DOCUMENTO_EMPLEADO
            id_tipo_papeleta: ID_PAP_TIPO_PAPELETA
            cargo_empleado: CARGO_EMPLEADO
            fecha_desde: FECHA_DESDE
            fecha_hasta: FECHA_HASTA
            hora_salida: HORA_SALIDA
            hora_llegada: HORA_LLEGADA
            hora_acumulado: HORA_ACUMULADA
            hora_solicitada: HORA_SOLICITADA
            codigo_tienda: CODIGO_TIENDA
            fecha_creacion: FECHA_CREACION
            horas_extras: []
        */
    // ballot/fecha - [PUT]{id_ballot,date}
        
/* SCHEDULE */ 
    // schedule/all - [GET]
        /* JSON RESPONSE
            range_days: RANGO_DIAS
            code_store: CODIGO_TIENDA
         */
    // schedule/generate - [POST][{id,cargo,date,range,code,range_date,days,days_work,days_free,arWorkers,observation}]
    // schedule/search - [GET]{range_days,code_store}
    // schedule/range - [POST]{code_store,range,id_schedule}
    // schedule/range - [PUT]{id_range,range}
    // schedule/day/work - [POST]{code_store,identity_document,full_name,id_range,id_day,id_schedule}
    // schedule/day/work - [DELETE]{id_daywork}
    // schedule/day/free - [POST]{ code_store,identity_document,full_name,id_range,id_day,id_schedule}
    // schedule/day/free - [DELETE]{id_dayfree}
    // schedule/observation - [POST]{id_day,id_schedule,code_store,full_name,observation}
    // schedule/observation - [PUT]{id,new_observation}
    // schedule/observation - [DELETE]{id_observation}
    // schedule/register - [POST][{id,cargo,date,range,code,range_date,days,days_work,days_free,arWorkers,observation}]

/* SECURITY */
    // security/session/login/all - [GET]
        /* JSON RESPONSE
            email: EMAIL
            ip: IP
            divice: DIVICE
            authorized: AUTORIZADO
        */
    // security/session/auth/all - [GET]
        /* JSON RESPONSE
            id: ID_AUTH_SESSION
            email: EMAIL
            code: CODIGO
            hash: HASH
        */
    // security/users/all - [GET]
        /* JSON RESPONSE
            user: USUARIO
            password: PASSWORD
            default_page: DEFAULT_PAGE
            email: EMAIL
            level: NIVEL
        */
    // security/session/auth - [DELETE]{id_session}
    // security/user - [POST]{ username,password,default_page,email,level}
    // security/user - [PUT]{ id_user,username,password,default_page,email,level}
/* COMPUTERS */
    // computers/all - [GET]
        /* JSON RESPONSE
            description: DESCRIPCION
            box_number: NUM_CAJA
            mac: MAC
            ip: IP
            online: ONLINE
            service_unit: UNID_SERVICIO
        */

/* TRANSFERS */
    // transfers/upload/file - [POST]{formData:Blob}

/* HUMAN RESOURCES */

