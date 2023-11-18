//! REQUERIMOS DOTENV Y MONGOOSE
const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");

// ! NOS TRAEMOS MONGO URI DEL DOTENV
const MONGO_URI = process.env.MONGO_URI;

//! -------- CREAMOS FUNCION QUE CONECTA LA DB CON LA MONGO DB

const connect = async () => {
  try {
    const db = await mongoose.connect(MONGO_URI, {
      /// es para hacer que la URL de MONGO se parsee
      useNewUrlParser: true,
      // convertir los caracteres especiales
      useUnifiedTopology: true,
    });

    const { host, name } = db.connection;

    console.log(
      `conectada la DB 👌 con el HOST:${host} con el nombre: ${name}`,
    );
  } catch (error) {
    console.log("tenemos un error en la conexión a la DB", error);
  }
};

console.log(MONGO_URI);
module.exports = { connect };
