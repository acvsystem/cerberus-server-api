const mailer = require("nodemailer");

module.exports = (email, nome, mensagem) => {
    const smtpTransport = mailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
            user: 'andrecanalesv@gmail.com',
            pass: 'nathrakh'
        },
        tls: {
            rejectUnauthorized: false
        }
    })
    
    const mail = {
        from: "IT METASPERU <andrecanalesv@gmail.com>",
        to: email,
        subject: `${nome}`
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