import { pool } from '../conections/conexMysql.js';
import srvToolFunction from '../services/toolFunctions.js';
import tokenController from "./csToken.js";
import mdwErrorHandler from '../middleware/errorHandler.js';

class clsSecurity {

  allSessionLogin = (req, res) => {
    pool.query(`SELECT * FROM TB_SESSION_LOGIN;`).then(([requestSQL]) => {
      let responseJSON = [];

      (requestSQL || []).filter((sql) => {
        responseJSON.push({
          email: (sql || {}).EMAIL,
          ip: (sql || {}).IP,
          divice: (sql || {}).DIVICE,
          authorized: (sql || {}).AUTORIZADO
        });
      });

      res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/security/session/login/all', data: responseJSON }));
    }).catch((err) => {
      res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'Error', message: err, api: '/security/session/login/all', data: [] }));
    });
  }

  allSessionAuth = (req, res) => {
    pool.query(`SELECT * FROM TB_AUTH_SESSION;`).then(([requestSQL]) => {
      let responseJSON = [];

      (requestSQL || []).filter((sql) => {
        responseJSON.push({
          id: (sql || {}).ID_AUTH_SESSION,
          email: (sql || {}).EMAIL,
          code: (sql || {}).CODIGO,
          hash: (sql || {}).HASH
        });
      });

      res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/security/session/auth/all', data: responseJSON }));
    }).catch((err) => {
      res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'Error', message: err, api: '/security/session/auth/all', data: [] }));
    });
  }

  allUser = (req, res) => {
    pool.query(`SELECT * FROM TB_LOGIN;`).then(([requestSQL]) => {
      let responseJSON = [];

      (requestSQL || []).filter((sql) => {
        responseJSON.push({
          user: (sql || {}).USUARIO,
          password: (sql || {}).PASSWORD,
          default_page: (sql || {}).DEFAULT_PAGE,
          email: (sql || {}).EMAIL,
          level: (sql || {}).NIVEL
        });
      });

      res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/security/users/all', data: responseJSON }));
    }).catch((err) => {
      res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'Error', message: err, api: '/security/users/all', data: [] }));
    });
  }

  delAuthorization = (req, res) => {
    let id_session = ((req || {}).query || {}).id_session;
    pool.query(`DELETE FROM TB_AUTH_SESSION WHERE ID_AUTH_SESSION='${id_session}';`).then(() => {
      pool.query(`SELECT * FROM TB_AUTH_SESSION;`).then(([requestSQL]) => {
        let responseJSON = [];

        (requestSQL || []).filter((sql) => {
          responseJSON.push({
            id: (sql || {}).ID_AUTH_SESSION,
            email: (sql || {}).EMAIL,
            code: (sql || {}).CODIGO,
            hash: (sql || {}).HASH
          });
        });

        res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/security/users/all', data: responseJSON }));
      }).catch((err) => {
        res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'Error session list', message: err, api: '/security/session/auth', data: [] }));
      });
    }).catch((err) => {
      res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'Error Delete', message: err, api: '/security/session/auth', data: [] }));
    });
  }

  inUser = (req, res) => {
    let username = ((req || []).body || {}).username;
    let password = ((req || []).body || {}).password;
    let default_page = ((req || []).body || {}).default_page;
    let email = ((req || []).body || {}).email;
    let level = ((req || []).body || {}).level;

    pool.query(`SELECT * FROM TB_LOGIN WHERE USUARIO = '${username}';`).then(([resquesSQL]) => {
      if (!(resquesSQL || []).length) {
        pool.query(`INSERT INTO TB_LOGIN(USUARIO,PASSWORD,DEFAULT_PAGE,EMAIL,NIVEL)VALUES('${username}','${password}','${default_page}','${email}','${level}');`).then(() => {
          res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/security/user', data: [] }));
        });
      } else {
        res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'Error', message: err, api: '/security/user', data: [] }));
      }
    });
  }

  updUser = (req, res) => {
    let id_user = ((req || []).body || {}).id_user;
    let username = ((req || []).body || {}).username;
    let password = ((req || []).body || {}).password;
    let default_page = ((req || []).body || {}).default_page;
    let email = ((req || []).body || {}).email;
    let level = ((req || []).body || {}).level;

    pool.query(`UPDATE TB_LOGIN SET USUARIO = '${username}',PASSWORD = '${password}',DEFAULT_PAGE = '${default_page}',EMAIL = '${email}',NIVEL = '${level}' WHERE ID_LOGIN = ${id_user};`).then(() => {
      res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/security/user', data: [] }));
    });
  }

  login = async (req, res) => {
    try {
      let username = (((req || {}).body || {}).username || "").replace(/[^a-zA-Z-0-9 ]/g, "");;
      let password = ((req || {}).body || {}).password;

      let dataUser = await srvToolFunction.verifyUser(username, password);

      let level_user = ((dataUser || [])[0] || {}).USUARIO;
      let id_user = ((dataUser || [])[0] || {}).ID_LOGIN;

      if ((dataUser || []).length > 0) {

        const token = await tokenController.createToken(id_user, username, level_user);
        const allUserStore = await srvToolFunction.userStore();

        let selectedUser = (allUserStore || []).find((uStore) => (uStore || {}).USUARIO == username);

        let parseResponse = [{
          auth: { token: token },
          page: { default: ((dataUser || [])[0] || {}).DEFAULT_PAGE },
          profile: {
            name: username,
            codigo: (selectedUser || []).SERIE_TIENDA || "",
            nameTienda: (selectedUser || []).DESCRIPCION || "",
            email: ((dataUser || [])[0] || {}).EMAIL,
            nivel: ((dataUser || [])[0] || {}).NIVEL
          },
          menu: dataUser || []
        }];

        res.header("Authorization", token).json(parseResponse);
      } else {
        res.status(401).json(mdwErrorHandler.error({ status: 401, type: 'Error', message: 'Error de autenticacion', api: '/security/login', data: [] }));
      }
    } catch (err) {
      res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'Error', message: err, api: '/security/login', data: [] }));
    }
  }

  allInventoryEmail = async (req, res) => {
    try {
      const allEmail = await srvToolFunction.inventaryEmail();
      let arEmail = [];

      (allEmail || []).filter((uEmail) => {
        (arEmail || []).push({ email: uEmail.EMAIL });
      });

      res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/security/inventaryEmail', data: arEmail }));
    } catch (error) {
      res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'Error', message: err, api: '/security/inventaryEmail', data: [] }));
    }
  };

  allParameterStore = async (req, res) => {
    try {
      const allParameterStore = await srvToolFunction.allParameterStore();
      let arParameter = [];

      (allParameterStore || []).filter((parameter) => {
        (arParameter || []).push({
          box_number: parameter.NUM_CAJA,
          mac: parameter.MAC,
          serie_store: parameter.SERIE_TIENDA,
          database_instance: parameter.DATABASE_INSTANCE,
          database_name: parameter.DATABASE_NAME,
          code_type_bill: parameter.COD_TIPO_FAC,
          code_type_ticket: parameter.COD_TIPO_BOL,
          property_stock: parameter.PROPERTY_STOCK,
          subject_email_report_stock: parameter.ASUNTO_EMAIL_REPORT_STOCK,
          name_excel_report_sotck: parameter.NAME_EXCEL_REPORT_STOCK,
          route_download_py: parameter.RUTA_DOWNLOAD_PY,
          route_download_sunat: parameter.RUTA_DOWNLOAD_SUNAT,
          route_download_validation: parameter.RUTA_DOWNLOAD_VALIDACION,
          is_main_server: parameter.IS_PRINCIPAL_SERVER,
          ip: parameter.IP,
          online: parameter.ONLINE,
          unit_service: parameter.UNID_SERVICIO
        });
      });

      res.status(200).json(mdwErrorHandler.error({ status: 200, type: 'OK', message: 'OK', api: '/security/inventaryEmail', data: arParameter }));
    } catch (error) {
      res.status(400).json(mdwErrorHandler.error({ status: 400, type: 'Error', message: err, api: '/security/inventaryEmail', data: [] }));
    }
  }

  genHashPlugin = (req, res) => {
    const token = req.header('Authorization') || "";
    let body = (req || {}).body || {};
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
  }

  downloadFile = (req, res) => {
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
  }


  createAccessPostulant = async (req, res) => {
    const auth_token = req.header("Authorization") || "";
    const payload = tokenController.verificationToken(auth_token);
    let tokenDecode = payload;

    if ((tokenDecode || {}).isValid) {
      let privateKey = prop.keyCrypt;

      let option = {
        expiresIn: "10800s",
        issuer: "cerberus.server",
        audience: `${((tokenDecode || {}).decoded || {}).aud}`,
      };

      const token = Jwt.sign({ id: (option || {}).audience },
        `${privateKey}`,
        option
      );
      let urlAccess = "";
      var options = {
        method: "POST",
        url: `https://urlbae.com/api/url/add`,
        headers: {
          Authorization: "Bearer b0e4b5f92b7334796e0af3ed4fabd3cd",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: `http://159.65.226.239:5000/postulante/${token}`,
        }),
      };

      request(options, function (error, response) {
        if (error) throw new Error(error);
        console.log("createAccessPostulant", (((response || {}).body || {})));
        urlAccess = JSON.parse(((response || {}).body || '{}'))["shorturl"] || `http://159.65.226.239:5000/postulante/${token}`;
        res.json(urlAccess);
      });


    } else {
      res.status(401).send(defaultResponse.error.default);
    }
  };

  validationAccessPostulant = async (req, res) => {
    const auth_token = ((req || {}).body || {}).token || "";
    const payload = tokenController.verificationToken(auth_token);
    const tokenDecode = payload;
    if ((tokenDecode || {}).isValid) {
      res.header("Authorization", auth_token).json(prop.success.default);
    } else {
      res.status(401).send(defaultResponse.error.default);
    }
  };

}

const securityController = new clsSecurity;
export default securityController;