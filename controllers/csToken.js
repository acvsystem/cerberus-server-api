
import Jwt from 'jsonwebtoken';
import { prop } from '../keys.js';

class clsToken {

    createToken(usuario, nivelUser) {
        let privateKey = prop.keyCrypt;
        let option = {
            issuer: 'cerberus.server',
            audience: `${nivelUser}`
        };
        console.log("createToken", option);
        const token = Jwt.sign({ id: usuario }, `${privateKey}`, option);
        return token;
    }

    verificationToken(token) {
        let privateKey = prop.keyCrypt;
        console.log("verificationToken", `${privateKey}`);
        return Jwt.verify(`${token}`, `${privateKey}`, function (err, decoded) {
            console.log(err);
            if (err) {
                return { isValid: false, decoded: decoded };
            }

            if (Object.keys(decoded).length) {
                return { isValid: true, decoded: decoded };
            }
        });
    }

    createTokenCode(email) {
        let privateKey = prop.keyCrypt;
        const now = Date.now().valueOf() / 1000
        let option = {
            issuer: 'cerberus.server',
            exp: now
        };
        const token = Jwt.sign({ email: email }, `${privateKey}`, option, {
            expiresIn: '1m'
        });
        return token;
    }

}

const tokenController = new clsToken;
export default tokenController;