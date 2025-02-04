import { createPool } from 'mysql2/promise';

export const pool = createPool({
    host: '127.0.0.1',
    user: 'dbserver',
    port: 3306,
    password: 'J4s0nd34d$$',
    database: 'BD_METASPERU_DEV',
    waitForConnections : true , 
    connectionLimit : 100 , 
    maxIdle : 100 ,  
    idleTimeout : 60000 ,
    queueLimit : 0 
});

