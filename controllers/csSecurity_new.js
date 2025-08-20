

import { pool } from '../conections/conexMysql.js';

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

}

const securityController = new clsSecurity;
export default securityController;