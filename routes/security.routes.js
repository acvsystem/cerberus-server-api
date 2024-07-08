import { Router } from 'express';
const router = Router();
import { Login, EmailList } from '../controllers/csSecurity.js';
import tokenController from '../controllers/csToken.js';
import path from 'path';
import { pathDownload } from '../const/routesDownload.js';
import CryptoJS from 'crypto-js';
import { prop } from '../keys.js';

router.post('/login', Login);
router.get('/emailList', EmailList);
router.post('/service/cliente/list/delete', async (req, res) => {
    let body = req.body;
    let [data] = await pool.query(`SELECT * FROM TB_CLIENTES_CLEAR_FORNT;`)

    if (!data.length) {
        await pool.query(`INSERT INTO TB_CLIENTES_CLEAR_FORNT(LIST_CLIENTE)VALUES(${body});`);
    } else {
        await pool.query(`UPDATE TB_CLIENTES_CLEAR_FORNT SET LIST_CLIENTE = ${body} WHERE ID_CLIENTE_CLEAR = 1;`);
    }

    res.status(200);
});

router.get('/service/cliente/list/delete', async (req, res) => {
    let [data] = await pool.query(`SELECT * FROM TB_CLIENTES_CLEAR_FORNT;`);
    let listCliente = ((data || [])[0]).split(',');
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