import { pool } from '../conections/conexMysql.js';
import emailController from '../sendEmail.js';
import templateHtmlController from '../template/csTemplatesHtml.js';
import { prop } from '../keys.js';
import tokenController from './csToken.js';
import { prop as defaultResponse } from '../const/defaultResponse.js';

class clsConfiguration {

    saveServiceEmail = async (req, res) => {
        let email = ((req || {}).body || {}).usuario || "";
        let pass = ((req || {}).body || {}).password || "";

        // let [data] = await pool.query(`SELECT * FROM TB_CONFIGURATION_EMAIL WHERE USER_NAME = '${email}'`);

        /*
              if (email.length && pass.length && !data.length) {
                  await pool.query(`INSERT INTO TB_CONFIGURATION_EMAIL(USER_NAME,PASSWORD)VALUES('${email}','${pass}');`);
              }
      */
        if (email.length && pass.length) {
            await pool.query(`UPDATE TB_CONFIGURATION_EMAIL SET USER_NAME = '${email}', PASSWORD = '${pass}' WHERE ID_CONFIGURATION = 1;`);
            res.json(defaultResponse.success.default);
        }
    }

    saveSendEmail = async (req, res) => {
        let emailList = ((req || {}).body || []);

        (emailList || []).filter(async (email) => {
            let [existEmail] = await pool.query(`SELECT * FROM TB_EMAIL_TO WHERE EMAIL = '${email.name}';`);

            if (!existEmail.length) {
                await pool.query(`INSERT INTO TB_EMAIL_TO(EMAIL,FK_CONFIGURATION)VALUES('${email.name}',1);`);
            }
        });

        res.json(defaultResponse.success.default);
    }

    deleteSendEmail = async (req, res) => {
        let emailList = ((req || {}).body || []);

        (emailList || []).filter(async (email) => {
            let [existEmail] = await pool.query(`SELECT * FROM TB_EMAIL_TO WHERE EMAIL = '${email.name}';`);
            console.log(existEmail);
            if (existEmail.length) {
                await pool.query(`DELETE FROM TB_EMAIL_TO WHERE ID_EMAIL_TO = ${existEmail[0].ID_EMAIL_TO};`);
            }
        });

        res.json(defaultResponse.success.default);
    }

    onlistConfiguration = async (req, res) => {
        let [dataServiceEmail] = await pool.query(`SELECT * FROM TB_CONFIGURATION_EMAIL;`);
        let [dataListEmail] = await pool.query(`SELECT * FROM TB_EMAIL_TO WHERE FK_CONFIGURATION = '${dataServiceEmail[0].ID_CONFIGURATION}';`);
        let dataParse = {
            emailService: [{
                email: dataServiceEmail[0].USER_NAME,
                key: dataServiceEmail[0].PASSWORD
            }],
            emailList: []
        };

        (dataListEmail || []).filter((data) => {
            ((dataParse || {}).emailList || []).push({ email: (data || {}).EMAIL });
        });

        res.json(dataParse);
    }

    sendTestEmail = async (req, res) => {
        emailController.sendEmail(null, `CORREO DE PRUEBA METASPERU`, '', '', null, 'PRUEBA').then((response) => {
            res.json(response)
        }).catch(error => res.json(error));
    }

    sendLinkRegister = async (req, res) => {
        let data = ((req || {}).body || []);
        let ipServer = prop.ipServer;
        const token = tokenController.createToken('NEW_USER', 'REGISTER_USER');

        var bodyHTML = templateHtmlController.registerAccount({ link: `http://${ipServer}/${(data || {}).path || ''}/${token}` });

        emailController.sendEmail(`${(data || {}).email || ''}`, `REGISTRO SISTEMA IT METAS PERU`, bodyHTML, '', null, 'REGISTRO SISTEMA').then((response) => {
            res.json(response)
        }).catch(error => res.json(error));

    }

}

const configurationController = new clsConfiguration;
export default configurationController;