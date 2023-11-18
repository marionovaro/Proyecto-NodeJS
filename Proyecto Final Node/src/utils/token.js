const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

//! Recibe email y id del usuario. Esta función se utiliza en el login
const generateToken = (id, email) => {
  if (!id || !email) {
    //? si te falta el id o el email, que los necesitamos, te decimos que se tienen que poner
    throw new Error("Email or id are missing ❌");
  }
  console.log(email, id);
  return jwt.sign({ id, email }, process.env.JWT_SECRET, { expiresIn: "1d" }); //? necesita: info para generar token, palabra secreta JWT, expiración del token // ESTAMOS CREANDO EL TOKEN
};

//! Descodificamos el token para saber si sigue siendo válido
const verifyToken = (token) => {
  if (!token) throw new Error("Token is missing ❌");
  return jwt.verify(token, process.env.JWT_SECRET); //? este método nos hace la descodificación, dandonos email y id
};

module.exports = {
  generateToken,
  verifyToken,
};
