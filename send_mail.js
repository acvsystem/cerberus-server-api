const mailer = require("nodemailer");

module.exports = (email, nome, mensagem) => {
    const smtpTransport = mailer.createTransport({
        host: 'smtp.zoho.com',
        port: 465,
        secure: true, //SSL/TLS
        auth: {
            user: 'skyboxdev@zohomail.com',
            pass: 'P4ssw0rd$'
        }
    })
    
    const mail = {
        from: "IT METASPERU <skyboxdev@zohomail.com>",
        to: email,
        subject: `${nome}`,
        attachments: [
            {
                filename: 'comprobantes' + '.xlsx',
                content: Buffer.from(mensagem),
                contentType: 'application/octet-stream',
            }
        ]
    }
        
    return new Promise((resolve, reject) => {
        smtpTransport.sendMail(mail)
            .then(response => {
                console.log(response);
                smtpTransport.close();
                return resolve(response);
            })
            .catch(error => {
                console.log(error);
                smtpTransport.close();
                return reject(error);
            });
    })
}