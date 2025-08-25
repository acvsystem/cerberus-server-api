import { Router } from 'express';
const router = Router();
import { Login, EmailList } from '../controllers/csSecurity.js';
import tokenController from '../controllers/csToken.js';
import path from 'path';
import { pathDownload } from '../const/routesDownload.js';
import CryptoJS from 'crypto-js';
import { pool } from "../conections/conexMysql.js";
import { prop as defaultResponse } from "../const/defaultResponse.js";

router.post('/login', Login);
router.get('/emailList', EmailList);
router.post('/service/cliente/list/delete', async (req, res) => {
    let body = ((req || []).body[0] || {})['cliente'] || "";
    console.log(body);
    let [data] = await pool.query(`SELECT * FROM TB_CLIENTES_CLEAR_FORNT;`)

    if (!data.length) {
        await pool.query(`INSERT INTO TB_CLIENTES_CLEAR_FORNT(LIST_CLIENTE)VALUES('${body}');`);
    } else {
        await pool.query(`UPDATE TB_CLIENTES_CLEAR_FORNT SET LIST_CLIENTE = '${body}' WHERE ID_CLIENTE_CLEAR = 1;`);
    }

    res.json(defaultResponse.success.default);
});

router.post('/add/tienda', async (req, res) => {
    let data = ((req || {}).body || [])[0];
    await pool.query(`INSERT INTO TB_PARAMETROS_TIENDA(NUM_CAJA,MAC,SERIE_TIENDA,DATABASE_INSTANCE,DATABASE_NAME,COD_TIPO_FAC,COD_TIPO_BOL,PROPERTY_STOCK,ASUNTO_EMAIL_REPORT_STOCK,NAME_EXCEL_REPORT_STOCK,RUTA_DOWNLOAD_PY,RUTA_DOWNLOAD_SUNAT)
      VALUES(${(data || {}).nro_caja},'${(data || {}).mac}','${(data || {}).serie_tienda}','${(data || {}).database_instance}','${(data || {}).database_name}','${(data || {}).cod_tipo_factura}','${(data || {}).cod_tipo_boleta}','${(data || {}).property_stock}','${(data || {}).asunto_email_stock}','${(data || {}).name_excel_stock}','${(data || {}).ruta_download_agente}','${(data || {}).ruta_download_sunat}');`)
        .then((rs) => {
            res.json(defaultResponse.success.default);
        });
});

router.get('/lista/tienda', async (req, res) => {
    let data = ((req || {}).body || [])[0];
    await pool.query(`SELECT * FROM TB_PARAMETROS_TIENDA;`)
        .then(([rs]) => {
            res.json({ data: rs });
        });
});

router.get('/lista/registro/tiendas', async (req, res) => {
    let data = ((req || {}).body || [])[0];
    await pool.query(`SELECT * FROM TB_LISTA_TIENDA WHERE ESTATUS = 'ACTIVO';`)
        .then(([requestSql]) => {
            let responseJSON = [];
            (requestSql || []).filter((store) => {
                (responseJSON || []).push({
                    serie: (store || {}).SERIE_TIENDA,
                    description: (store || {}).DESCRIPCION,
                    code_wharehouse: (store || {}).COD_ALMACEN,
                    service_unit: (store || {}).UNID_SERVICIO,
                    status: (store || {}).ESTATUS,
                    store_type: (store || {}).TIPO_TIENDA,
                    email: (store || {}).EMAIL,
                    code_store_ejb: (store || {}).COD_TIENDA_EJB,
                });
            });
            res.json(responseJSON);
        });
});

router.post('/add/registro/tiendas', async (req, res) => {
    let data = ((req || {}).body || [])[0];
    await pool.query(`INSERT INTO TB_LISTA_TIENDA (SERIE_TIENDA,DESCRIPCION,COD_ALMACEN,UNID_SERVICIO,ESTATUS,TIPO_TIENDA,EMAIL,COD_TIENDA_EJB)
        VALUES('${(data || {}).serie_tienda}','${(data || {}).nombre_tienda}','${(data || {}).cod_almacen}','${(data || {}).unid_servicio}','ACTIVO','${(data || {}).tipo_tienda}','${(data || {}).email}','${(data || {}).codigo_ejb}');`)
        .then((rs) => {
            pool.query(`INSERT INTO TB_TERMINAL_TIENDA(CODIGO_TERMINAL,DESCRIPCION,VERIFICACION,CANT_COMPROBANTES,ISONLINE)
            VALUES('${(data || {}).serie_tienda}','${(data || {}).nombre_tienda}',false,0,false)`).then(() => {
                pool.query(`INSERT INTO TB_KEY_TERMINAL(KEY_CODE,DESC_KEY_TERMINAL)
            VALUES('${(data || {}).serie_tienda}','${(data || {}).nombre_tienda}')`).then(() => {
                    res.json(defaultResponse.success.default);
                });
            });
        });
});

router.get('/configuracion/permisos/hp', async (req, res) => {
    await pool.query(`SELECT ID_CONF_HP,ID_TIENDA,SERIE_TIENDA,DESCRIPCION,IS_FREE_HORARIO,IS_FREE_PAPELETA FROM TB_CONFIGURACION_HORARIO_PAP INNER JOIN TB_LISTA_TIENDA ON TB_LISTA_TIENDA.ID_TIENDA = TB_CONFIGURACION_HORARIO_PAP.ID_TIENDA_HP;`)
        .then(([rs]) => {
            res.json(rs);
        });
});

router.post('/configuracion/permisos/hp', async (req, res) => {
    let data = ((req || {}).body || [])[0];
    await pool.query(`UPDATE TB_CONFIGURACION_HORARIO_PAP SET IS_FREE_HORARIO = ${(data || {}).isPermiso_h}, IS_FREE_PAPELETA = ${(data || {}).isPermiso_p} WHERE ID_CONF_HP = ${(data || {}).id};`)
        .then(([rs]) => {
            pool.query(`SELECT ID_CONF_HP,ID_TIENDA,SERIE_TIENDA,DESCRIPCION,IS_FREE_HORARIO,IS_FREE_PAPELETA FROM TB_CONFIGURACION_HORARIO_PAP INNER JOIN TB_LISTA_TIENDA ON TB_LISTA_TIENDA.ID_TIENDA = TB_CONFIGURACION_HORARIO_PAP.ID_TIENDA_HP;`)
                .then(([rs]) => {
                    res.json(rs);
                });
        });
});


router.get('/service/cliente/list/delete', async (req, res) => {
    let [data] = await pool.query(`SELECT * FROM TB_CLIENTES_CLEAR_FORNT;`);
    console.log(data);
    let listCliente = ((data || [])[0]['LIST_CLIENTE']).split(',');
    res.json(listCliente);
});

router.post('/create/hash/agente', (req, res) => {

    const token = req.header('Authorization') || "";
    let body = (req || {}).body || {};
    console.log(body);
    let resValidation = tokenController.verificationToken(token);

    if ((resValidation || {}).isValid) {
        let data = {
            user: "DUNAMIS",
            nivel: (body || {}).nivel
        };

        const hash = CryptoJS.AES.encrypt(JSON.stringify(data), defaultResponse.keyCryptHash).toString();

        res.json({ success: true, hash: hash });
    } else {
        return res.status(401).json('Access denied');
    }

});

router.post('/configuracion/tiempo/tolerancia', async (req, res) => {
    let data = ((req || {}).body || [])[0];
    console.log(data);
    pool.query(`SELECT * FROM TB_CONFIGURACION_TOLERANCIA_HORA WHERE REFERENCIA = '${(data || {}).referencia}';`).then(([registro]) => {

        if (!(registro || []).length) {
            pool.query(`INSERT INTO TB_CONFIGURACION_TOLERANCIA_HORA(REFERENCIA,TIEMPO_TOLERANCIA)VALUES('${(data || {}).referencia}','${(data || {}).tiempo_tolerancia}')`).then(() => {
                res.json(defaultResponse.success.default);
            });
        } else {
            pool.query(`UPDATE TB_CONFIGURACION_TOLERANCIA_HORA SET TIEMPO_TOLERANCIA = '${(data || {}).tiempo_tolerancia}' WHERE ID_TOLERANCIA = ${((registro || [])[0] || {}).ID_TOLERANCIA}`).then(() => {
                res.json(defaultResponse.success.default);
            });
        }
    });
});

router.get('/configuracion/tiempo/tolerancia', async (req, res) => {
    pool.query(`SELECT * FROM TB_CONFIGURACION_TOLERANCIA_HORA;`).then(([registro]) => {
        res.json(registro)
    });
});

router.get('/download', (req, res) => {

    let token = req.header('Authorization');
    let hash = req.header('hash');

    if (hash) {
        var bytes = CryptoJS.AES.decrypt(hash, defaultResponse.keyCryptHash);
        var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8)) || {};

        if (Object.keys(decryptedData).length) {
            token = tokenController.createToken((decryptedData || {}).user, (decryptedData || {}).nivel);
        }
    }

    let resValidation = tokenController.verificationToken(token);

    if ((resValidation || {}).isValid) {
        let file = "";

        switch (((resValidation || {}).decoded || {}).aud) {
            case "SUNAT_ICG.zip":
                file = pathDownload.path.sunat;
                break;
            case "XML_SUNAT_ICG.zip":
                file = pathDownload.path.sunatXML;
                break;
            case "VALIDACION.zip":
                file = pathDownload.path.totalizacion;
                break;
            case "DLL_NOTA_CREDITO.zip":
                file = pathDownload.path.notaCredito;
                break;
            case "PLUGIN_APP_METAS_PERU_VS":
                file = pathDownload.path.appMetasvs;
                break;
            case "PLUGIN_APP_METAS_PERU_BBW":
                file = pathDownload.path.appMetasbbw;
                break;
            case "PLUGIN_APP_METAS_PERU_VSFA":
                file = pathDownload.path.appMetasvsfa;
                break;
            case "PLUGIN_APP_METAS_PERU_ECOM":
                file = pathDownload.path.appMetasecom;
        }

        var fileLocation = path.join('./', file);

        res.download(fileLocation, file);
    } else {
        return res.status(401).json('Access denied');
    }

});

const securityRoutes = router;
export default securityRoutes