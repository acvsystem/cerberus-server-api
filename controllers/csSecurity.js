import { pool } from "../conections/conexMysql.js";
import { prop as defaultResponse } from "../const/defaultResponse.js";
import { prop } from "../keys.js";
import tokenController from "./csToken.js";
import Jwt from "jsonwebtoken";
import request from "request";

export const Login = async (req, res) => {
  console.log(req);
  let objLogin = req.body;
  let usuario = objLogin["usuario"].replace(/[^a-zA-Z-0-9 ]/g, "");
  let password = objLogin["password"];

  await pool.query(`SELECT ID_LOGIN,USUARIO,DEFAULT_PAGE,TB_LOGIN.NIVEL,NOMBRE_MENU,RUTA,EMAIL FROM TB_PERMISO_SISTEMA INNER JOIN TB_MENU_SISTEMA ON TB_MENU_SISTEMA.ID_MENU = TB_PERMISO_SISTEMA.ID_MENU_PS
                    INNER JOIN TB_LOGIN ON TB_LOGIN.NIVEL = TB_PERMISO_SISTEMA.NIVEL WHERE USUARIO = '${usuario}' AND PASSWORD = '${password}'`).then(([dataUser]) => {

    let nivelUser = ((dataUser || [])[0] || {}).USUARIO;
    let idUsuario = ((dataUser || [])[0] || {}).ID_LOGIN;
    if (dataUser.length > 0) {

      const token = tokenController.createToken(idUsuario, usuario, nivelUser);

      let tiendasList = [
        { code: '7A', user: 'bbwjoc', nameTienda: 'BBW JOCKEY' },
        { code: '9N', user: 'vsaqp', nameTienda: 'VS MALL AVENTURA' },
        { code: '7J', user: 'bbwaqp', nameTienda: 'BBW MALL AVENTURA' },
        { code: '7E', user: 'bbwlrb', nameTienda: 'BBW LA RAMBLA' },
        { code: '9D', user: 'vslrb', nameTienda: 'VS LA RAMBLA' },
        { code: '9B', user: 'vspn', nameTienda: 'VS PLAZA NORTE' },
        { code: '7C', user: 'bbwpsm', nameTienda: 'BBW SAN MIGUEL' },
        { code: '9C', user: 'vspsm', nameTienda: 'VS SAN MIGUEL' },
        { code: '7D', user: 'bbwrps', nameTienda: 'BBW SALAVERRY' },
        { code: '9I', user: 'vsrps', nameTienda: 'VS SALAVERRY' },
        { code: '9G', user: 'vsmds', nameTienda: 'VS MALL DEL SUR' },
        { code: '9H', user: 'vspur', nameTienda: 'VS PURUCHUCO' },
        { code: '9M', user: 'vsecom', nameTienda: 'VS ECOMMERCE' },
        { code: '7F', user: 'bbwecom', nameTienda: 'BBW ECOMMERCE' },
        { code: '9K', user: 'vsmep', nameTienda: 'VS MEGA PLAZA' },
        { code: '9L', user: 'vsmnk', nameTienda: 'VS MINKA' },
        { code: '9F', user: 'vsfajoc', nameTienda: 'VSFA JOCKEY FULL' },
        { code: '7A7', user: 'bbwasia', nameTienda: 'BBW ASIA' },
        { code: '9P', user: 'vsmptru', nameTienda: 'VS MALL PLAZA' },
        { code: '7I', user: 'bbwmptru', nameTienda: 'BBW MALL PLAZA' },
        { code: '9Q', user: 'vssa', nameTienda: 'VS MALL AVENTURA SA' }
      ];

      let selectedUser = (tiendasList || []).find((tnd) => tnd.user == (usuario || "").toLowerCase());

      let parseResponse = [{
        auth: { token: token },
        page: { default: ((dataUser || [])[0] || {}).DEFAULT_PAGE },
        profile: {
          name: ((dataUser || [])[0] || {}).USUARIO,
          codigo: (selectedUser || []).code || "",
          nameTienda: (selectedUser || []).nameTienda || "",
          email: ((dataUser || [])[0] || {}).EMAIL,
          nivel: ((dataUser || [])[0] || {}).NIVEL
        },
        menu: dataUser || []
      }];

      res.header("Authorization", token).json(parseResponse);
    } else {
      res.json(defaultResponse.error.login);
    }
  });


};

export const EmailList = async (req, res) => {

  res.json([
    { mail: "inventariogd.peru@gmail.com" },
    { mail: "josecarreno@metasperu.com" },
    { mail: "itperu@metasperu.com" },
    { mail: "johnnygermano@metasperu.com" },
    { mail: "logisticaperu@metasperu.com" },
    { mail: "carlosmoron@metasperu.com" }
  ]);
};

export const createMenuProfile = async (req, res) => {
  let request = req.body;
  let idProfile = (request || {}).idProfile;
  let noOptionList = [];
  let menuUser = [];

  noOptionList = (request || {}).noOption || [];
  menuUser = (request || {}).menu || [];

  await pool.query(`DELETE FROM TB_PERMISO_SISTEMA WHERE ID_ROL_PERMISO = ${idProfile};`);

  if (menuUser.length) {
    await menuUser.filter(async (op) => {
      await pool.query(
        `INSERT INTO TB_PERMISO_SISTEMA(ID_ROL_PERMISO,ID_MENU_PERMISO)VALUES(${idProfile},${op});`
      );
    });
  }

  console.log(request);
  res.json(defaultResponse.success.default);
};

export const CreateNewUser = async (req, res) => {
  let newRegister = (req || {}).body || {};
  let headers = (req || {}).headers;
  let validToken = await tokenController.verificationToken(
    (headers || {}).authorization
  );
  console.log(validToken);
  let [nivel] = await pool.query(
    `SELECT * FROM TB_ROL_SISTEMA WHERE NOMBRE_ROL='${((validToken || {}).decoded || {}).aud
    }'`
  );

  await pool.query(`INSERT INTO TB_USUARIO(USUARIO,PASSWORD,EMAIL,ID_ROL_USUARIO)
            VALUES('${newRegister.usuario}','${newRegister.password}','${newRegister.mail}',${((nivel || [])[0] || {}).ID_ROL
    })`);

  const [id_new_user] = await pool.query(
    `SELECT ID_LOGIN FROM TB_USUARIO WHERE USUARIO = '${newRegister.usuario}' AND PASSWORD = '${newRegister.password}'`
  );

  if (id_new_user.length) {
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

export const onRegistrarTienda = async (req, res) => {
  let data = ((req || {}).body || []);
  await pool.query(`INSERT INTO TB_PARAMETROS_TIENDA(NUM_CAJA,MAC,SERIE_TIENDA,DATABASE_INSTANCE,DATABASE_NAME,COD_TIPO_FAC,COD_TIPO_BOL,PROPERTY_STOCK,ASUNTO_EMAIL_REPORT_STOCK,NAME_EXCEL_REPORT_STOCK,RUTA_DOWNLOAD_PY,RUTA_DOWNLOAD_SUNAT)
    VALUES(${(data || {}).nro_caja},'${(data || {}).mac}','${(data || {}).serie_tienda}','${(data || {}).database_instance}','${(data || {}).database_name}','${(data || {}).cod_tipo_factura}','${(data || {}).cod_tipo_boleta}','${(data || {}).property_stock}','${(data || {}).asunto_email_stock}','${(data || {}).name_excel_stock}','${(data || {}).ruta_download_agente}','${(data || {}).ruta_download_sunat}');`)
    .then((rs) => {
      res.json(prop.success)
    });
}

