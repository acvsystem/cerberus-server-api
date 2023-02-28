const mailer = require("nodemailer");
var smtpTransport = require('nodemailer-smtp-transport');

module.exports = (email, nome, mensagem, tienda) => {

    let date = new Date();
    let day = `0${date.getDate()}`.slice(-2);
    let month = `0${date.getMonth() + 1}`.slice(-2);
    let year = date.getFullYear();

    const transport = mailer.createTransport({
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
        attachments: [
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