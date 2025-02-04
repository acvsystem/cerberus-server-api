export const prop = {
    ipServer: '159.65.226.239:5000', //'159.65.226.239',
    database: {
        host: '159.65.226.239',
        user: 'dbapp',
        port: 3306,
        password: 'J4s0nd34d$$',
        database: 'BD_METASPERU_DEV',
        waitForConnections: true,
        connectionLimit: 100,
        maxIdle: 100,
        idleTimeout: 60000,
        queueLimit: 0
    },
    keyCrypt: "C3rB3rvSFL@@",
    keyCryptHash: "@g3nt3MT432",
    success: {
        default: { success: true, msj: "Successful" }
    },
    error: {
        default: { success: false, msj: "Unsuccessful" },
        login: { success: false, msj: "Usuario o contraseña invalidos." }
    }

};