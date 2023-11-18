const setError = require("../../helpers/handle-error");
const Comment = require("../models/Comment.model");
const Eleven = require("../models/Eleven.model");
const Player = require("../models/Player.model");
const User = require("../models/User.model");

//! ---------------- CREATE -----------------
const create = async (req, res, next) => {
  //? para crear con id en vez de name, solo hay que cambiar el String, por ObjectId en el modelo, y aquí en vez de Player.findOne({name: body[propiedad]}) se haría con Player.findById(body[propiedad])
  try {
    await Eleven.syncIndexes(); //? --------------------------- ACTUALIZAMOS INDEXES, que son aquellas claves del objeto que son únicas. Lo hacemos para asegurarnos que tenemos la última versión en caso de haber sido modificados los modelos
    //todo ------------ VAMOS A ASEGURARNOS QUE LOS JUGADORES SELECCIONADOS ESTAN EN LA POSICION CORRECTA ----------------
    const body = req.body;
    const owner = req.user._id;
    const userElement = await User.findById(owner);
    if (userElement.yourteam.length > 0) {
      //? ---------------- si el usuario ya tiene un equipo mandar error
      return res
        .status(404)
        .json(
          `Este usuario ya tiene un 11 ideal, el id es: ${userElement.yourteam} ❌ No puede crear otro`,
        );
    }
    let elevenTeam = { name: req.body.name, owner: owner }; //? ----------------------------------------- aqui vamos a guardar los jugadores, si cumplen con la condición de las posición
    let errors = []; //? --------------------------------------------- aquí vamos a guardar los errores indicando, en qué jugador falla, si no se cumple la condición de la posición
    let player; //? -------------------------------------------------- variable que va cambiando en el recorrido en la que metemos los jugadores y los introducimos en el array elevenTeam
    for (let propiedad in body) {
      switch (
        propiedad //? ------------------------------------ la propiedad es la posición en la que los hemos puesto
      ) {
        case "goalkeeper":
          player = await Player.findById(body[propiedad]);
          player.position == "goalkeeper"
            ? (elevenTeam[propiedad] = player.id)
            : errors.push({
                error: `El jugador en la posición ${propiedad} no está colocado en una posición apta para él`,
              });
          break;
        case "rightback":
          player = await Player.findById(body[propiedad]);
          player.position == "right-back"
            ? (elevenTeam[propiedad] = player.id)
            : errors.push({
                error: `El jugador en la posición ${propiedad} no está colocado en una posición apta para él`,
              });
          break;
        case "centreback1":
        case "centreback2":
          player = await Player.findById(body[propiedad]);
          player.position == "centre-back"
            ? (elevenTeam[propiedad] = player.id)
            : errors.push({
                error: `El jugador en la posición ${propiedad} no está colocado en una posición apta para él`,
              });
          break;
        case "leftback":
          player = await Player.findById(body[propiedad]);
          player.position == "left-back"
            ? (elevenTeam[propiedad] = player.id)
            : errors.push({
                error: `El jugador en la posición ${propiedad} no está colocado en una posición apta para él`,
              });
          break;
        case "midfielder1":
        case "midfielder2":
        case "midfielder3":
          player = await Player.findById(body[propiedad]);
          player.position == "midfielder"
            ? (elevenTeam[propiedad] = player.id)
            : errors.push({
                error: `El jugador en la posición ${propiedad} no está colocado en una posición apta para él`,
              });
          break;
        case "forward1":
        case "forward2":
        case "forward3":
          player = await Player.findById(body[propiedad]);
          player.position == "forward"
            ? (elevenTeam[propiedad] = player.id)
            : errors.push({
                error: `El jugador en la posición ${propiedad} no está colocado en una posición apta para él`,
              });
          break;
        default:
          break;
      }
    }
    if (errors.length == 0) {
      //? ----------------------------------------- solamente cuando no hay ningún error:
      const newEleven = new Eleven(elevenTeam); //? ---------------------- instanciamos un nuevo 11 ideal y le INTRODUCIMOS COMO INFO INICIAL LO QUE RECIBIMOS EN EL BODY DE LA REQUEST
      const saveEleven = await newEleven.save(); //? -------------------- GUARDAMOS EL 11 IDEAL EN LA BASE DE DATOS (DB) O BACKEND
      for (let posicion in body) {
        //todo ----------- RECIPROCIDAD CON PLAYER --------------------
        if (posicion != "name") {
          //? --------------------------------- lo hacemos porque name también viene como propiedad en el body pero no es un jugador que cambiar el modelo
          player = await Player.findById(body[posicion]);
          await Player.findByIdAndUpdate(
            player.id, //? ------------- 1r param: el id del elemento que vamos a modificar (añadirle a la propiedad selected)
            { $push: { selected: saveEleven._id } }, //? ------------------- 2o param: le metemos el id del eleven que estamos creando a la propiedad selected del player que hemos puesto en el body
          );
        }
      } //todo ---------------- RECIPROCIDAD CON USER -----------------------
      await User.findByIdAndUpdate(
        owner, //? --------- este es el id que hemos encontrado con req.user._id al ppio de la función
        { $push: { yourteam: saveEleven._id } }, //? ----- le metemos el id del eleven a la propiedad yourteam dentro del modelo de USER
      );
      return res //? ---------------------------------------------------- evaluamos si existe saveEleven y por lo tanto se ha guardado bien y mostramos exito o error
        .status(saveEleven ? 200 : 404)
        .json(
          saveEleven
            ? await Eleven.findById(saveEleven._id).populate(
                "owner goalkeeper rightback centreback1 centreback2 leftback midfielder1 midfielder2 midfielder3 forward1 forward2 forward3",
              )
            : "Error en el guardado del 11 ideal ❌",
        );
    } else {
      return res.status(404).json(errors); //? --------------------------- mostramos los errores de posición que hemos almacenado en el recorrido
    }
  } catch (error) {
    //? --------------------------------------------- si ha habido un error creando el jugador:
    return next(
      setError(500, error.message || "Error general al crear tu 11 ideal ❌"),
    );
  }
};

//! --------------- GET by ID ----------------
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const elevenById = await Eleven.findById(id).populate(
      "owner goalkeeper rightback centreback1 centreback2 leftback midfielder1 midfielder2 midfielder3 forward1 forward2 forward3",
    ); //? cogemos el elemento (eleven) identificandola a través del id, que es único
    return res
      .status(elevenById ? 200 : 404)
      .json(
        elevenById
          ? elevenById
          : "no se ha encontrado un 11 ideal con ese id ❌",
      );
  } catch (error) {
    return next(
      setError(
        500,
        error.message || "Error general al buscar 11 ideal a través de ID ❌",
      ),
    );
  }
};

//! --------------- GET ALL ----------------
const getAll = async (req, res, next) => {
  try {
    const allElevens = await Eleven.find().populate(
      "owner goalkeeper rightback centreback1 centreback2 leftback midfielder1 midfielder2 midfielder3 forward1 forward2 forward3",
    ); //? ------------- el find() nos devuelve un array con todos los elementos de la colección del BackEnd, es decir, TODOS LOS 11 IDEALES
    console.log(allElevens);
    return res
      .status(allElevens.length > 0 ? 200 : 404) //? ---- si hay equipos en la db (el array tiene al menos 1 elemento), 200 o 404
      .json(
        allElevens.length > 0
          ? allElevens
          : "No se han encontrado 11 ideales en la DB ❌",
      );
  } catch (error) {
    return next(
      setError(
        500,
        error.message || "Error general al buscar todos los 11 ideales ❌",
      ),
    );
  }
};

//! --------------- GET by NAME ----------------
const getByName = async (req, res, next) => {
  try {
    const { name } = req.params;
    const elevenByName = await Eleven.find({ name }).populate(
      "owner goalkeeper rightback centreback1 centreback2 leftback midfielder1 midfielder2 midfielder3 forward1 forward2 forward3",
    );
    return res
      .status(elevenByName.length > 0 ? 200 : 404) //? igual que en get all, miramos si el array con ese nombre es mayor que 0 (solo debería de haber 1) y mostramos 200 o 404
      .json(
        elevenByName.length > 0
          ? elevenByName
          : "no se ha encontrado un 11 ideal con ese nombre ❌",
      );
  } catch (error) {
    return next(
      setError(
        500,
        error.message ||
          "Error general al buscar 11 ideal a través de nombre ❌",
      ),
    );
  }
};

//! --------------- UPDATE ----------------
const update = async (req, res, next) => {
  await Eleven.syncIndexes(); //? .------------------- busca las actualizaciones, por si se ha modficado el modelo player
  try {
    const { id } = req.params; //? ------------------- en esta linea y la siguiente hacemos lo mismo que en getById
    const elevenById = await Eleven.findById(id);
    const body = req.body;
    const checkPosition = async (clave, posicion) => {
      //? ----- funcion que usamos para checkear que el nuevo jugador está en la posición correcta
      const player = await Player.findById(body[clave]);
      if (player.position == posicion) {
        console.log("true");
        return true;
      } else {
        return false;
      }
    };
    if (elevenById) {
      const customBody = {
        _id: elevenById._id, //? ---------- ponemos _.id porque así lo pone en insomnia
        name: body?.name ? body.name : elevenById.name,
        goalkeeper:
          body?.goalkeeper && checkPosition("goalkeeper", "goalkeeper")
            ? body.goalkeeper
            : elevenById.goalkeeper,
        rightback:
          body?.rightback && checkPosition("rightback", "right-back")
            ? body.rightback
            : elevenById.rightback,
        centreback1:
          body?.centreback1 && checkPosition("centreback1", "centre-back")
            ? body.centreback1
            : elevenById.centreback1,
        centreback2:
          body?.centreback2 && checkPosition("centreback2", "centre-back")
            ? body.centreback2
            : elevenById.centreback2,
        leftback:
          body?.leftback && checkPosition("leftback", "left-back")
            ? body.leftback
            : elevenById.leftback,
        midfielder1:
          body?.midfielder1 && checkPosition("midfielder1", "midfielder")
            ? body.midfielder1
            : elevenById.midfielder1,
        midfielder2:
          body?.midfielder2 && checkPosition("midfielder2", "midfielder")
            ? body.midfielder2
            : elevenById.midfielder2,
        midfielder3:
          body?.midfielder3 && checkPosition("midfielder3", "midfielder")
            ? body.midfielder3
            : elevenById.midfielder3,
        forward1:
          body?.forward1 && checkPosition("forward1", "forward")
            ? body.forward1
            : elevenById.forward1,
        forward2:
          body?.forward2 && checkPosition("forward2", "forward")
            ? body.forward2
            : elevenById.forward2,
        forward3:
          body?.forward3 && checkPosition("forward3", "forward")
            ? body.forward3
            : elevenById.forward3,
        likes: elevenById.likes,
        comments: elevenById.comments,
      };
      for (let position in body) {
        //? estamos sacando el selected del jugador que estamos quitando, porque deja de ser selected
        if (position != "name") {
          const elementPlayer = await Player.findById(body[position]); //? hago findone y no find porque así solo me da uno y puedo hacer elementPlayer._id, sino tendría q hacer elementPlayer[0]._id
          await Player.findByIdAndUpdate(elementPlayer._id, {
            $pull: { selected: id },
          });
          // console.log(elementPlayer.id + "HOLLLAAAAAAA")
        }
      }
      for (let position in body) {
        if (position != "name") {
          const elementPlayer = await Player.findById(body[position]); //? hago findone y no find porque así solo me da uno y puedo hacer elementPlayer._id, sino tendría q hacer elementPlayer[0]._id
          await Player.findByIdAndUpdate(elementPlayer.id, {
            $push: { selected: id },
          });
          console.log(elementPlayer.id + "HOLLiiiiiiiii");
        }
      }
      try {
        await Eleven.findByIdAndUpdate(id, customBody); //? cambiamos el body con lo que hemos puesto en customBody en el elemento que encontremos con el id
        //!           -------------------
        //!           | RUNTIME TESTING |
        //!           -------------------

        const elevenByIdUpdated = await Eleven.findById(id); //? -------- buscamos el elemento actualizado a través del id
        const elementUpdate = Object.keys(req.body); //? ----------- buscamos los elementos de la request para saber qué se tiene que actualizar
        let test = []; //? ----------------------------------------- objeto vacío donde meter los tests. estará compuesta de las claves de los elementos y los valores seran true/false segun haya ido bien o mal
        let acc = 0;

        elementUpdate.forEach((key) => {
          //? ----------------------------- recorremos las claves de lo que se quiere actualizar
          console.log(elevenByIdUpdated[key]);
          console.log(body[key]);
          if (req.body[key] == elevenByIdUpdated[key]) {
            //? ------------ si el valor de la clave en la request (el valor actualizado que hemos pedido meter) es el mismo que el que hay ahora en el elemento ---> está bien
            test.push({ [key]: true }); //? ------------------------------------ está bien hecho por lo tanto en el test con la clave comprobada ponemos true --> test aprobado hehe
          } else {
            test.push({ [key]: false }); //? ----------------------------------- algo ha fallado y por lo tanto el test está suspendido (false)
            acc++; //? ------------------------------------------------ por cada fallo que tenemos sumamos uno para el siguiente paso: informar de errores
          }
        });

        if (acc > 0) {
          //? --------------------- si acc 1 o más, es que ha habido uno o más errores, y por lo tanto hay que notificarlo
          return res.status(404).json({
            dataTest: test, //? ------------ por aquí podremos examinar los errores viendo en qué claves se han producido
            update: false,
          });
        } else {
          return res.status(200).json({
            dataTest: test,
            update: true,
            updatedEleven: elevenByIdUpdated,
          });
        }
      } catch (error) {
        return next(
          setError(500, error.message || "Error al guardar tu 11 ideal ❌"),
        );
      }
    } else {
      return res.status(404).json("este equipo no existe ❌");
    }
  } catch (error) {
    return next(
      setError(
        500,
        error.message || "Error al actualizar los datos de tu 11 ideal ❌",
      ),
    );
  }
};

//! ---------------- DELETE -----------------
const deleteEleven = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eleven = await Eleven.findByIdAndDelete(id); //? buscamos el equipo y lo eliminamos

    if (eleven) {
      //? si el equipo que queremos eliminar existe (tiene que hacerlo para poder eliminarlo)

      try {
        //? --------------------------------------------- ELIMINAMOS AL ELEVEN, DEL JUGADOR
        await Player.updateMany(
          //? --------- ahora estamos cambiando en el model de Player para poder quitar el equipo que ya no existe
          { selected: id }, //? --------------------------- queremos cambiar lo que sea que haya que cambiar en esta propiedad del model, si se omite se dice que se cambia cualquier conincidencia en todo el modelo. es la condición
          { $pull: { selected: id } }, //? ------------------- estamos diciendo que quite de la propiedad selected, el id indicado, es decir el del equipo que se ha eliminado. es la ejecución
        );

        try {
          //? -------------------------------------- ELIMINAMOS AL YOURTEAM DEL USER
          await User.updateMany(
            //? ---- ahora estamos cambiando en el model de User para poder quitar el equipo que ya no existe
            { yourteam: id }, //? -------------------- condición/ubicación del cambio (eliminación)
            { $pull: { yourteam: id } }, //? ------------ ejecución
          );

          try {
            //? ---------------------------------------- ELIMINAMOS AL FAVELEVEN DEL USER
            await User.updateMany(
              //? ------ ahora estamos cambiando en el model de User para poder quitar el equipo que ya no existe
              { favElevens: id }, //? -------------------- condición/ubicación del cambio (eliminación)
              { $pull: { favElevens: id } }, //? ------------ ejecución
            );

            try {
              //? -------------------------------------- ELIMINAMOS LOS COMMENTS DEL ELEVEN - repetimos lo que hacemos en el delteComment, porque lo estamos eliminando
              const arrayComments = await Comment.find({ location: id });
              let errors = [];
              arrayComments.forEach(async (comment) => {
                //? --------------------------- hacemos forEach para recorrer el array de comentarios que hemos encontrado en el eleven a borrar
                await Comment.findByIdAndDelete(comment); //? ----- cogemos el id de cada comentario con param comment y lo borramos
                try {
                  //? ----------------------------------------- ELIMINAMOS AL FAVCOMMENT DEL USER
                  await User.updateMany(
                    //? ------- ahora estamos cambiando en el model de User para poder quitar el favcomment que ya no existe
                    { favComments: id }, //? -------------------- condición/ubicación del cambio (eliminación)
                    { $pull: { favComments: id } }, //? ------------ ejecución
                  );
                } catch (error) {
                  return next(
                    setError(
                      500,
                      error.message ||
                        "Error al eliminar el comentario del user - DELETE ELEVEN❌",
                    ),
                  );
                }
                const checkCommentExist = await Comment.findById(comment); //? --------- miramos si el comment aun existe (no debería)
                checkCommentExist ? errors.push(comment) : null; //? ------------------- si existe pusheamos el id(comment) al array de errores
              });
              if (errors.length > 0) {
                //? ----------------------------------------------- si el array tiene 1 o mas errores, lo mostramos, si no es así, seguimos con el código
                return res.status(404).json(errors);
              }
            } catch (error) {
              return next(
                setError(
                  500,
                  error.message ||
                    "Error al eliminar los comments del eleven ❌",
                ),
              );
            }
          } catch (error) {
            return next(
              setError(
                500,
                error.message || "Error al eliminar el eleven del user ❌",
              ),
            );
          }
        } catch (error) {
          return next(
            setError(
              500,
              error.message || "Error al eliminar el eleven del user ❌",
            ),
          );
        }
      } catch (error) {
        return next(
          setError(
            500,
            error.message || "Error al eliminar el eleven del jugador ❌",
          ),
        );
      }

      const findByIdEleven = await Eleven.findById(id); //? hemos encontrado este equipo? no debería existir porque lo hemos eliminado al ppio
      return res.status(findByIdEleven ? 404 : 200).json({
        //? si se encuentra hay un error, porque no se ha eliminado
        deleteTest: findByIdEleven ? false : true, //? si existe, el test ha dado fallo y si no existe ha aprobado el test
      });
    } else {
      return res.status(404).json("este 11 ideal no existe ❌"); //? si no existe el jugador antes de eliminarlo hay que dar error porque el jugador seleccionado para borrar no existia en un primer momento
    }
  } catch (error) {
    return next(
      setError(
        500,
        error.message || "Error general al eliminar tu 11 ideal ❌",
      ),
    );
  }
};

module.exports = {
  create,
  getById,
  getAll,
  getByName,
  update,
  deleteEleven,
};
