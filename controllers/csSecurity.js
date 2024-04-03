import { pool } from "../conections/conexMysql.js";
import { prop as defaultResponse } from "../const/defaultResponse.js";
import { prop } from "../keys.js";
import tokenController from "./csToken.js";
import Jwt from "jsonwebtoken";
import request from "request";

export const Login = async (req, res) => {
  let objLogin = req.body;
  let usuario = objLogin["usuario"].replace(/[^a-zA-Z-0-9 ]/g, "");
  let password = objLogin["password"];
  const [dataUser] =
    await pool.query(`SELECT USUARIO,EMAIL,ID_ROL,NOMBRE_ROL,ACTIVO FROM TB_USUARIO INNER JOIN TB_ROL_SISTEMA ON TB_USUARIO.ID_ROL_USUARIO = TB_ROL_SISTEMA.ID_ROL
                      WHERE USUARIO = '${usuario}' AND PASSWORD = '${password}'`);

  let nivelUser = ((dataUser || [])[0] || {}).ID_ROL;
  console.log(dataUser);
  if (dataUser.length > 0) {
    const [menu] = await pool.query(`SELECT ID_MENU,NOMBRE_MENU,RUTA,ICO FROM TB_PERMISO_SISTEMA INNER JOIN TB_ROL_SISTEMA ON TB_PERMISO_SISTEMA.ID_ROL_PERMISO = TB_ROL_SISTEMA.ID_ROL INNER JOIN TB_MENU_SISTEMA ON TB_PERMISO_SISTEMA.ID_MENU_PERMISO = TB_MENU_SISTEMA.ID_MENU
                                             WHERE TB_PERMISO_SISTEMA.ID_ROL_PERMISO = ${nivelUser};`);

    const [submenu] = await pool.query(`SELECT ID_MENU_SUBMENU,NOMBRE_SUBMENU FROM TB_SUBMENU_SISTEMA;`);

    let arMenu = [];

    console.log(menu);
    console.log(submenu);

    menu.filter((menu) => {
      let submenuList = [];
      submenu.filter((submenu) => {
        if ((menu || {}).ID_MENU == (submenu || {}).ID_MENU_SUBMENU) {
          submenuList.push(submenu);
        }
      });

      arMenu.push(
        {
          nombre_menu: menu.NOMBRE_MENU,
          ruta: menu.RUTA,
          ico: menu.ICO,
          submenu: submenuList
        }
      );
    });

    console.log(arMenu);

    const token = tokenController.createToken(usuario, nivelUser);

    let parseResponse = {
      auth: { token: token },
      profile: {
        name: ((dataUser || [])[0] || {}).USUARIO,
        nivel: ((dataUser || [])[0] || {}).NOMBRE_ROL,
      },
      menu: menu,
    };

    res.header("Authorization", token).json(parseResponse);
  } else {
    res.json(defaultResponse.error.login);
  }
};

export const createMenuProfile = async (req, res) => {
  let request = req.body;
  let idProfile = (request || {}).idProfile;
  let noOptionList = [];
  let menuUser = [];

  noOptionList = (request || {}).noOption || [];
  menuUser = (request || {}).menu || [];

  await pool.query(
    `DELETE FROM TB_MENU_SISTEMA WHERE FK_ID_NVL_ACCESS = ${idProfile};`
  );

  if (menuUser.length) {
    await menuUser.filter(async (op) => {
      await pool.query(
        `INSERT INTO TB_MENU_SISTEMA(FK_ID_MENU_DESC,FK_ID_NVL_ACCESS)VALUES(${op},${idProfile});`
      );
    });
  }

  console.log(request);
  res.json(defaultResponse.success.default);
};

export const CreateNewUser = async (req, res) => {
  let newRegister = (req || {}).body || {};
  let headers = (req || {}).headers;
  let validToken = tokenController.verificationToken(
    (headers || {}).authorization
  );

  let [nivel] = await pool.query(
    `SELECT * FROM TB_NIVEL_ACCESS WHERE NM_NIVEL='${((validToken || {}).decoded || {}).aud
    }'`
  );

  await pool.query(`INSERT INTO TB_LOGIN(DESC_USUARIO,PASSWORD,FK_ID_NVL_ACCESS)
            VALUES('${newRegister.usuario}','${newRegister.password}',${((nivel || [])[0] || {}).ID_NVL_ACCESS
    })`);

  const [id_new_user] = await pool.query(
    `SELECT ID_LOGIN FROM TB_LOGIN WHERE DESC_USUARIO = '${newRegister.usuario}' AND PASSWORD = '${newRegister.password}'`
  );

  if (id_new_user.length) {
    await pool.query(`INSERT INTO TB_PROFILE_USER(NOMBRE,FK_ID_LOGIN)
        VALUES('${newRegister.nombreProfile} ${newRegister.apellidoProfile}',${id_new_user[0].ID_LOGIN})`);

    res.json(defaultResponse.success.default);
  } else {
    res.json(defaultResponse.error.default);
  }
};

export const createAccessPostulant = async (req, res) => {
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

export const validationAccessPostulant = async (req, res) => {
  const auth_token = ((req || {}).body || {}).token || "";
  const payload = tokenController.verificationToken(auth_token);
  const tokenDecode = payload;
  if ((tokenDecode || {}).isValid) {
    res.header("Authorization", auth_token).json(prop.success.default);
  } else {
    res.status(401).send(defaultResponse.error.default);
  }
};
