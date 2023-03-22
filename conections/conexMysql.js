import { createPool } from 'mysql2/promise';

export const pool = createPool({
    host: 'localhost',
    user: 'root',
    port: 3306,
    password: '',
    database: 'BD_METASPERU',
    waitForConnections : true , 
    connectionLimit : 100 , 
    maxIdle : 100 ,  
    idleTimeout : 60000 ,
    queueLimit : 0 
});

