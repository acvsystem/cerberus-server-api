
import Jwt from 'jsonwebtoken';
import { prop } from '../keys.js';
import mdwErrorHandler from '../middleware/errorHandler.js';

class clsToken {

    createToken(id, usuario, nivelUser) {
        let privateKey = prop.keyCrypt;
        let option = {
            issuer: 'cerberus.server',
            audience: `${nivelUser}`
        };
        console.log("createToken", option);
        const token = Jwt.sign({ id: id, usuario: usuario }, `${privateKey}`, option);
        return token;
    }

    /*  verificationToken(token) {
          const authHeader = req.headers['authorization'];
          const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
          const privateKey = prop.keyCrypt;
  
          return Jwt.verify(`${token}`, `${privateKey}`, function (err, decoded) {
              console.log(err);
              if (err) {
                  return { isValid: false, decoded: decoded };
              }
  
              if (Object.keys(decoded).length) {
                  return { isValid: true, decoded: decoded };
              }
          });
      }*/

    verifyToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
        const privateKey = prop.keyCrypt;

        if (!token) {
            return res.status(401).json(mdwErrorHandler.error({ status: 401, type: 'OK', message: 'Token no proporcionado', api: '' }));
        }

        try {
            const decoded = Jwt.verify(`${token}`, `${privateKey}`);
            req.user = decoded; // opcional: guardar datos del token en req
            next();
        } catch (err) {
            return res.status(403).json(mdwErrorHandler.error({ status: 403, type: 'OK', message: 'Token inválido o expirado', api: '' }));
        }
    }

    socketVerifyToken(authorization) {
        const authHeader = authorization;
        const token = authHeader;
        const privateKey = prop.keyCrypt;

        if (!token) {
            return { isValid: false };
        }

        try {
            const decoded = Jwt.verify(`${token}`, `${privateKey}`);
            req.user = decoded; // opcional: guardar datos del token en req
            return { isValid: true, decoded: decoded };
        } catch (err) {
            return { isValid: false };
        }
    }


    createTokenCode(email) {
        let privateKey = prop.keyCrypt;
        const now = Date.now().valueOf() / 1000
        let option = {
            issuer: 'cerberus.server',
            expiresIn: '5m'
        };
        const token = Jwt.sign({ email: email }, `${privateKey}`, option);
        return token;
    }

}

const tokenController = new clsToken;
export default tokenController;