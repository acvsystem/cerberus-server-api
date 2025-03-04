import { pool } from "../conections/conexMysql.js";
import { prop as defaultResponse } from "../const/defaultResponse.js";
import { prop } from "../keys.js";
import tokenController from "./csToken.js";
import Jwt from "jsonwebtoken";
import request from "request";

export const onStock = async (req, res) => {
  console.log(req.body);
  res.json(defaultResponse.success.default);
};

export const onAgenteConfigList = async (req, res) => {
  let data = ((req || {}).body || []);
  let [configuration] = await pool.query(`SELECT * FROM TB_PARAMENTROS_TIENDA WHERE MAC_SERVER='${(data || {}).mac}';`);
  console.log(configuration);
  res.json(configuration)
}

export const onRegistrarTienda = async (req, res) => {
  let data = ((req || {}).body || []);
  await pool.query(`INSERT INTO TB_PARAMETROS_TIENDA(NUM_CAJA,MAC,SERIE_TIENDA,DATABASE_INSTANCE,DATABASE_NAME,COD_TIPO_FAC,COD_TIPO_BOL,PROPERTY_STOCK,ASUNTO_EMAIL_REPORT_STOCK,NAME_EXCEL_REPORT_STOCK,RUTA_DOWNLOAD_PY,RUTA_DOWNLOAD_SUNAT)
    VALUES(${(data || {}).nro_caja},'${(data || {}).mac}','${(data || {}).serie_tienda}','${(data || {}).database_instance}','${(data || {}).database_name}','${(data || {}).cod_tipo_factura}','${(data || {}).cod_tipo_boleta}','${(data || {}).property_stock}','${(data || {}).asunto_email_stock}','${(data || {}).name_excel_stock}','${(data || {}).ruta_download_agente}','${(data || {}).ruta_download_sunat}');`)
    .then((rs) => {
      res.json(prop.success)
    });

}