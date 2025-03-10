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
    await pool.query(`SELECT * FROM TB_LISTA_TIENDA;`)
        .then(([rs]) => {
            res.json({ data: rs });
        });
});

router.post('/add/registro/tiendas', async (req, res) => {
    let data = ((req || {}).body || [])[0];
    await pool.query(`INSERT INTO TB_LISTA_TIENDA (SERIE_TIENDA,DESCRIPCION)VALUES('${(data || {}).serie_tienda}','${(data || {}).nombre_tienda}');`)
        .then((rs) => {
            res.json(defaultResponse.success.default);
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
            res.json(rs);
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

        const hash = CryptoJS.AES.encrypt(JSON.stringify(data), prop.keyCryptHash).toString();

        res.json({ success: true, hash: hash });
    } else {
        return res.status(401).json('Access denied');
    }

});

router.get('/download', (req, res) => {

    /*  let token = req.header('Authorization');
      let hash = req.header('hash');
  
      if (hash) {
          var bytes = CryptoJS.AES.decrypt(hash, prop.keyCryptHash);
          var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8)) || {};
  
          if (Object.keys(decryptedData).length) {
              token = tokenController.createToken((decryptedData || {}).user, (decryptedData || {}).nivel);
          }
      }
  
      let resValidation = tokenController.verificationToken(token);
  */
    //  if ((resValidation || {}).isValid) {
    let file = "";

    //  if (((resValidation || {}).decoded || {}).aud == "AGENTE") {
    file = pathDownload.path.agente;
    //  }

    /*  if (((resValidation || {}).decoded || {}).aud == "SUNAT") {
          file = pathDownload.path.pluginSunat;
      }

      if (((resValidation || {}).decoded || {}).aud == "DOCUMENTO") {
          file = pathDownload.path.pluginDocument;
      }
*/
    var fileLocation = path.join('./', file);
    res.download(fileLocation, file);


    /*  } else {
          return res.status(401).json('Access denied');
      }*/

});

const securityRoutes = router;
export default securityRoutes