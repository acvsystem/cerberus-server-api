import { Router } from 'express';
const router = Router();
import { Login, CreateNewUser, createAccessPostulant, validationAccessPostulant, createMenuProfile } from '../controllers/csSecurity.js';
import tokenController from '../controllers/csToken.js';
import path from 'path';
import { pathDownload } from '../const/routesDownload.js';
import CryptoJS from 'crypto-js';
import { prop } from '../keys.js';

router.post('/login', Login);

router.get('/download', (req, res) => {

    let token = req.header('Authorization');
    let hash = req.header('hash');

    if (hash) {
        var bytes = CryptoJS.AES.decrypt(hash, prop.keyCryptHash);
        var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8)) || {};

        if (Object.keys(decryptedData).length) {
            token = tokenController.createToken((decryptedData || {}).user, (decryptedData || {}).nivel);
        }
    }

    let resValidation = tokenController.verificationToken(token);

    if ((resValidation || {}).isValid) {
        let file = "";

        if (((resValidation || {}).decoded || {}).aud == "AGENTE") {
            file = pathDownload.path.agente;
        }

        if (((resValidation || {}).decoded || {}).aud == "SUNAT") {
            file = pathDownload.path.pluginSunat;
        }

        if (((resValidation || {}).decoded || {}).aud == "DOCUMENTO") {
            file = pathDownload.path.pluginDocument;
        }

        var fileLocation = path.join('./', file);
        res.download(fileLocation, file);


    } else {
        return res.status(401).json('Access denied');
    }

});

const securityRoutes = router;
export default securityRoutes