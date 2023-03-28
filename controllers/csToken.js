
import Jwt from 'jsonwebtoken';
import { prop } from '../keys.js';

class clsToken {

    createToken(usuario, nivelUser) {
        let privateKey = prop.keyCrypt || 'fgpbr';
        let option = {
            issuer: 'cerberus.server',
            audience: `${nivelUser}`
        };
        const token = Jwt.sign({ id: usuario }, privateKey, option);
        return token;
    }

    verificationToken(token) {
        
        Jwt.verify(token, prop.keyCrypt, function (err, decoded) {
            console.log(err, decoded);
            if (err) return { isValid: false, decoded: decoded };
            return { isValid: true, decoded: decoded }
        });
    }

}

const tokenController = new clsToken;
export default tokenController;