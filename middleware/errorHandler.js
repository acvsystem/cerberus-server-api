class mddlErrorHandler {
    error(err) {
        return {
            status: "error",
            code: err.status || 500,
            error: {
                type: err.type || 'InternalServerError',
                message: err.message || 'Error interno del servidor'
            },
            path: err.api,
            timestamp: new Date().toISOString()
        };
    };
}

const mdwErrorHandler = new mddlErrorHandler;
export default mdwErrorHandler;