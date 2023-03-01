import createPool from 'mysql2/promise';
const keys = require('../keys');

const pool =  createPool(keys.database);

exports.default = pool