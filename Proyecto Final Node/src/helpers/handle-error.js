const setError = (code, message) => {
  const error = new Error();
  error.code = code;
  error.message = message;
  return error;
};

module.exports = setError;

//? crea un error con el mensaje y codigo que yo le diga
