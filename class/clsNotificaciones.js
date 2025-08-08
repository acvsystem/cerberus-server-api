class mdlNotificacion {
    constructor(tipo, titulo, mensaje, isRead) {
        this.tipo = tipo;
        this.titulo = titulo;
        this.mensaje = mensaje;
        this.isRead = isRead;
    }

    toJSON() {
        return {
            tipo: this.tipo,
            titulo: this.titulo,
            mensaje: this.mensaje,
            isRead: this.isRead
        };
    }
}



const mdNotificacion = new mdlNotificacion;
export default mdNotificacion;