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
            await pool.query(`UPDATE TB_CONFIGURATION_EMAIL SET EMAIL = '${email}', PASSWORD = '${pass}' WHERE ID_CRD_EMAIL = 1;`);
            res.json(defaultResponse.success.default);
        }
    }

    saveSendEmail = async (req, res) => {
        let emailList = ((req || {}).body || []);

        (emailList || []).filter(async (email) => {
            let [existEmail] = await pool.query(`SELECT * FROM TB_LISTA_EMAIL_ALERTA WHERE EMAIL_ALERT = '${email.name}';`);

            if (!existEmail.length) {
                await pool.query(`INSERT INTO TB_LISTA_EMAIL_ALERTA(EMAIL_ALERT)VALUES('${email.name}');`);
            }
        });

        res.json(defaultResponse.success.default);
    }

    deleteSendEmail = async (req, res) => {
        let emailList = ((req || {}).body || []);

        (emailList || []).filter(async (email) => {
            let [existEmail] = await pool.query(`SELECT * FROM TB_LISTA_EMAIL_ALERTA WHERE EMAIL_ALERT = '${email.name}';`);
            console.log(existEmail);
            if (existEmail.length) {
                await pool.query(`DELETE FROM TB_LISTA_EMAIL_ALERTA WHERE ID_EMAIL_ALERT = ${existEmail[0].ID_EMAIL_ALERT};`);
            }
        });

        res.json(defaultResponse.success.default);
    }

    onlistConfiguration = async (req, res) => {
        let [dataServiceEmail] = await pool.query(`SELECT * FROM TB_CONFIGURACION_EMAIL;`);
        let [dataListEmail] = await pool.query(`SELECT * FROM TB_LISTA_EMAIL_ALERTA;`);
        let dataParse = {
            emailService: [{
                email: dataServiceEmail[0].EMAIL,
                key: dataServiceEmail[0].PASSWORD
            }],
            emailList: []
        };

        (dataListEmail || []).filter((data) => {
            ((dataParse || {}).emailList || []).push({ email: (data || {}).EMAIL_ALERT });
        });

        res.json(dataParse);
    }

    onListMenu = async (req, res) => {
        let data = ((req || {}).body || []);
        let [dataMenuList] = await pool.query(`SELECT ID_MENU,NOMBRE_MENU,RUTA,ICO FROM TB_MENU_SISTEMA;`);

        let response =
        {
            data: dataMenuList || [],
            status: defaultResponse.success.default
        };

        res.json(response);
    }

    onRegitrarMenu = async (req, res) => {
        let data = ((req || {}).body || []);
        await pool.query(`INSERT INTO TB_MENU_SISTEMA(NOMBRE_MENU,RUTA,ICO)VALUES('${data.menu}','${data.ruta}','${data.ico}');`);

        let response =
        {
            status: defaultResponse.success.default
        };

        res.json(response);
    }

    onDeleteMenu = async (req, res) => {
        let data = ((req || {}).body || []);
        await pool.query(`DELETE FROM TB_MENU_SISTEMA WHERE ID_MENU = ${data.id};`);

        let response =
        {
            status: defaultResponse.success.default
        };

        res.json(response);
    }

    onListPerfilUser = async (req, res) => {
        let [dataList] = await pool.query(`SELECT * FROM TB_ROL_SISTEMA;`);

        let response =
        {
            data: dataList || [],
            status: defaultResponse.success.default
        };


        res.json(response);
    }

    onListRoles = async (req, res) => {
        let [dataList] = await pool.query(`SELECT * FROM TB_ROL_SISTEMA;`);
        let rolesList = [];
        (dataList || []).filter((rol) => {
            (rolesList || []).push(
                {
                    id_rol: (rol || {}).ID_ROL || 0,
                    nom_rol: (rol || {}).NOMBRE_ROL || ""
                }
            );
        });

        let response =
        {
            data: rolesList || [],
            status: defaultResponse.success.default
        };


        res.json(response);
    }

    onListMenuUser = async (req, res) => {
        let data = ((req || {}).body || []);
        let [dataMenuList] = await pool.query(`SELECT ID_MENU,NOMBRE_MENU FROM TB_PERMISO_SISTEMA 
        INNER JOIN TB_MENU_SISTEMA ON TB_PERMISO_SISTEMA.ID_MENU_PERMISO = TB_MENU_SISTEMA.ID_MENU
        WHERE ID_ROL_PERMISO = ${data.ID_NVL_ACCESS} GROUP BY ID_MENU;`);

        let response =
        {
            data: dataMenuList || [],
            status: defaultResponse.success.default
        };


        res.json(response);
    }

    sendTestEmail = async (req, res) => {
        emailController.sendEmail('andrecanalesv@gmail.com', `CORREO DE PRUEBA METASPERU`, '', null, 'PRUEBA', null).then((response) => {
            res.json(response)
        }).catch(error => res.json(error));
    }

    sendLinkRegister = async (req, res) => {
        let data = ((req || {}).body || []);
        let ipServer = prop.ipServer;
        const token = tokenController.createToken('NEW_USER', (data || {}).nivel);

        var bodyHTML = templateHtmlController.registerAccount({ link: `http://${ipServer}/${(data || {}).path || ''}/${token}` });

        emailController.sendEmail(`${(data || {}).email || ''}`, `REGISTRO SISTEMA IT METAS PERU`, bodyHTML, null, null, 'REGISTRO SISTEMA').then((response) => {
            res.json(response)
        }).catch(error => res.json(error));

    }

    onAgenteConfigList = async (req, res) => {
        let data = ((req || {}).body || []);
        let [configuration] = await pool.query(`SELECT * FROM TB_CONFIGURATION_CONEX_AGENTE WHERE MAC='${(data || {}).mac}';`);
        console.log(configuration);
        res.json(configuration)
    }

    onDepartametosList = async (req, res) => {
        let [lista] = await pool.query(`SELECT * FROM TB_DEPARTAMENTOS_UBIGEO;`);
        res.json(lista)
    }

    onProvinciasList = async (req, res) => {
        let dataRecept = ((req || {}).query || {});
        let [lista] = await pool.query(`SELECT * FROM TB_PROVINCIAS_UBIGEO WHERE ID_DEPARTAMENTO='${(dataRecept || {}).id_departamento}';`);
        res.json(lista)
    }

    onDistritoList = async (req, res) => {
        let dataRecept = ((req || {}).query || {});
        let [lista] = await pool.query(`SELECT * FROM TB_DISTRITOS_UBIGEO WHERE ID_PROVINCIA ='${(dataRecept || {}).id_provincia}' AND ID_DEPARTAMENTO='${(dataRecept || {}).id_departamento}';`);
        res.json(lista)
    }

}

const configurationController = new clsConfiguration;
export default configurationController;