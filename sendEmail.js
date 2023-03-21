
import nodemailer from 'nodemailer';

class clsSendEmail {
    sendEmail(email, nome, mensagem, tienda) {
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

        let mail = {
            from: "IT METASPERU <andrecanalesv@gmail.com>",
            to: email,
            cc: 'andrecanalesv@gmail.com',
            subject: `${nome}`,
            attachments: []
        }

        if (mensagem != null) {
            (mail || {}).attachments = [
                {
                    filename: `CP-${tienda}-${day}${month}${year}` + '.xlsx',
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