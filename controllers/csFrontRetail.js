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