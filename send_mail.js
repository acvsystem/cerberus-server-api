const mailer = require("nodemailer");
var smtpTransport = require('nodemailer-smtp-transport');

module.exports = (email, nome, mensagem) => {
    const transport = mailer.createTransport(smtpTransport({
        service: 'gmail',
        auth: {
            user: 'andrecanalesv@gmail.com',
            pass: 'nathrakh'
        }
    }))
    
    const mail = {
        from: "IT METASPERU <andrecanalesv@gmail.com>",
        to: email,
        subject: `${nome}`
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