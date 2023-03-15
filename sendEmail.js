
import nodemailer from 'nodemailer';

class clsSendEmail {
    sendEmail(email, nome, mensagem, nombre_documento) {
        let date = new Date();
        let day = `0${date.getDate()}`.slice(-2);
        let month = `0${date.getMonth() + 1}`.slice(-2);
        let year = date.getFullYear();

        const transport = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: 'andrecanalesv@gmail.com',
                pass: 'mrxlnchmyxpmqqlt'
            }
        })

        const mail = {
            from: "IT METASPERU <andrecanalesv@gmail.com>",
            to: email,
            subject: `${nome}`,
            html: `<p>Buenos días, adjunto los datos de una factura emitida con numero de RUC errado (Cliente Con DNI, lo cual está prohibido para el caso de factura, para esos casos existen las boletas).</p> 

            <p>Lamentablemente no han cumplido con los procesos y métodos de validación que se les han proporcionado.</p>  
            
            <p>Quedo atento de la persona responsable de emitir dicha factura.</p>  
            
            <p>Realizar la NC con anticipo y/o vale.  Si tienen alguna inquietud me dejan saber.</p>
            
            <p>Saludos.`,
            attachments: [
                {
                    filename: `${nombre_documento}` + '.xlsx',
                    content: Buffer.from(mensagem),
                    contentType: 'application/octet-stream',
                }
            ]
        }

        return new Promise((resolve, reject) => {
            transport.sendMail(mail)
                .then(response => {
                    console.log(response);
                    transport.close();
                    return resolve(response);
                })
                .catch(error => {
                    console.log(error);
                    transport.close();
                    return reject(error);
                });
        })

    }
}

const emailController = new clsSendEmail;
export default emailController;