import { createPool } from 'mysql2/promise';

export const pool = createPool({
    host: 'localhost',
    user: 'root',
    password: 'J4s0nd34d$$',
    database: 'BD_METASPERU'
});

