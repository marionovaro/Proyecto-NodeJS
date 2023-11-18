let testEmailSend = false; //? se inicializa en false porque aún no se ha enviado el email

//! 1. ----------- FUNCIÓN SET
const setSendEmail = (dataBoolean) => {
  //? el param es un booleano para saber si se ha enviado
  testEmailSend = dataBoolean;
};

const getSendEmail = () => {
  return testEmailSend;
};

module.exports = {
  getSendEmail,
  setSendEmail,
};
