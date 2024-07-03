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