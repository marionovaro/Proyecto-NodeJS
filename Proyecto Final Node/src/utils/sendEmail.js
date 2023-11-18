const dotenv = require("dotenv");
dotenv.config();
const nodemailer = require("nodemailer");
const { setSendEmail } = require("../state/state.data");

const sendEmail = async (userEmail, name, confirmationCode) => {
  setSendEmail(false); //? --------------------------- lo primero quee hacemos es resetear el estado a false porque aun no se ha enviado el correo

  const email = process.env.EMAIL; //? --------------- nos traemos las variablees de entorno para poder logarnos en gmail
  const password = process.env.PASSWORD;

  const transporter = nodemailer.createTransport({
    //? creamos el transporter: se encarga de hacer el envío del correo, es como el cartero que reparte las cartas
    service: "gmail",
    auth: {
      user: email,
      pass: password,
    },
  });

  const mailOptions = {
    //? -------------------------- seteamos las opciones del email que se envía
    from: email,
    to: userEmail,
    subject: "Confirmation code",
    text: `tu codigo es ${confirmationCode}, gracias por confiar en nosotros ${name}`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    //? ejecutamos el transporter con sendMail y hacemos el envío
    if (error) {
      console.log(error);
      setSendEmail(false); //? ---------------------------------- si se envía incorrectamente seteamos el envío como false porque no se ha hecho
    } else {
      console.log("Email send: " + info.response);
      setSendEmail(true); //? ----------------------------------- si se envía bien, lo seteamos a true
    }
  });
};

module.exports = sendEmail;
