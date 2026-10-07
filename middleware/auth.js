require('dotenv').config();
const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
    const token = req.cookies.jwt
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, decodedToken) => {
            if (err) {
                res.redirect('/login')
            } else {
                req.user = decodedToken
                next();
            }
        });
    } else {
        res.redirect('/login');
    }
}

function checkUser(req, res, next) {
    const token = req.cookies.jwt
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, decodedToken) => {
            if (err) {
                res.locals.user = null
                next();
            } else {
                res.locals.user = decodedToken
                next();
            }
        });
    } else {
        res.locals.user = null
        next();
    }
}

module.exports = { requireAuth, checkUser };