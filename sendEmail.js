
import nodemailer from 'nodemailer';


class clsSendEmail {
    async sendEmail(email, nome, html, mensagem, tienda) {
        let date = new Date();
        let day = `0${date.getDate()}`.slice(-2);
        let month = `0${date.getMonth() + 1}`.slice(-2);
        let year = date.getFullYear();
        let strSendTo = "";
        /*let [serviceData] = await pool.query(`SELECT * FROM TB_CONFIGURATION_EMAIL`);
        let [emailSendList] = await pool.query(`SELECT * FROM TB_EMAIL_TO`);

        (emailSendList || []).filter((data) => {
            strSendTo += `${data.EMAIL},`;
        });

        let emailService = serviceData[0].USER_NAME || "";
        let emailPassword = serviceData[0].PASSWORD || "";*/

        const transport = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: 'itperu.notification@gmail.com',
                pass: 'zgbiaxbnhulwlvqk'
            }
        })

        
        let mail = {
            from: "IT METASPERU <itperu.notification@gmail.com>",
            to: email,
            cc: 'andrecanalesv@gmail.com',
            subject: `${subject}`,
            html: html,
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

/*
import nodemailer from 'nodemailer';

class clsSendEmail {
    sendEmail(email, subject, html, mensagem, tienda) {
        let date = new Date();
        let day = `0${date.getDate()}`.slice(-2);
        let month = `0${date.getMonth() + 1}`.slice(-2);
        let year = date.getFullYear();

        const transport = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: 'itperu.notification@gmail.com',
                pass: 'zgbiaxbnhulwlvqk'
            }
        })

        let mail = {
            from: "IT METASPERU <itperu.notification@gmail.com>",
            to: email,
            cc: 'andrecanalesv@gmail.com',
            subject: `${subject}`,
            html: html,
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
export default emailController;*/