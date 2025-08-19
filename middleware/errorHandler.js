class mddlErrorHandler {
    error(err) {
        return {
            code: err.status || 500,
            error: {
                type: err.type || 'InternalServerError',
                message: err.message || 'Error interno del servidor'
            },
            path: err.api,
            data: err.data || [],
            timestamp: new Date().toISOString()
        };
    };
}

const mdwErrorHandler = new mddlErrorHandler;
export default mdwErrorHandler;