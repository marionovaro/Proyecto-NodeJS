const setError = require("../../helpers/handle-error");
const { deleteImgCloudinary } = require("../../middleware/files.middleware");
const { enumPositionOk, enumPreferredFootOk } = require("../../utils/enumOk");
const Eleven = require("../models/Eleven.model");
const Player = require("../models/Player.model");
const Team = require("../models/Team.model");
const User = require("../models/User.model");

//! --------------- CREATE ----------------
const create = async (req, res, next) => {
  let catchImg = req.file?.path; //? ------- capturamos la url de la img que se sube a cloudinary. El OPTIONAL CHAINING es porque la img no es obligatoria y puede que no haya imagen en la request
  try {
    await Player.syncIndexes(); //? --------------------------- ACTUALIZAMOS INDEXES, que son aquellas claves del objeto que son únicas. Lo hacemos para asegurarnos que tenemos la última versión en caso de haber sido modificados los modelos
    const newPlayer = new Player(req.body); //? --------------------- instanciamos un nuevo jugador y le INTRODUCIMOS COMO INFO INICIAL LO QUE RECIBIMOS EN EL BODY DE LA REQUEST
    if (req.file) {
      //? -------------------- miramos si en la request hay imagen. Si la hay, la introducimos al nuevo jugador
      newPlayer.image = catchImg;
    } else {
      newPlayer.image =
        "https://s.hs-data.com/bilder/spieler/gross/619081.jpg?fallback=png";
    }
    const savePlayer = await newPlayer.save(); //? ---------------------- GUARDAMOS EL JUGADOR EN LA BASE DE DATOS (DB) O BACKEND
    //todo ----------------- INTENTO RECIPROCIDAD EN EL CREATE ----------------
    const id = savePlayer._id; //? obtenemos el id a través de _id (FORMA PARA OBTENER EL ID)
    const playersTeam = req.body?.team;
    if (playersTeam) {
      await Team.findByIdAndUpdate(
        playersTeam, //? 1r param: el id del elemento que vamos a modificar (añadirle los players)
        { $push: { players: id } }, //? ------------------------------------------- 2o param: le metemos el id del jugador que estamos creando a la propiedad player del team que hemos puesto en el body
      );
    } //todo ------------------------------------------------------------------

    if (savePlayer) {
      //? si se ha guardado correctamente (savePlayer existe)
      res
        .status(200)
        .json(await Player.findById(id).populate("team likes selected")); //? ---- podriamos poner que devuelva savePlayer pero he puesto el findbyid para popular el team
    } else {
      return res.status(404).json({
        message: "No se ha podido guardar el jugador en la DB ❌",
      });
    }
  } catch (error) {
    //? --------------------------------------------- si ha habido un error creando el jugador:
    req.file?.path ? deleteImgCloudinary(catchImg) : null; //? ---- hay que borrar la imagen, ya que ya se ha subido a cloudinary. Se ha hecho en la primera línea de esta función
    return next(
      setError(500, error.message || "Error general al crear el jugador ❌"),
    );
  }
};

//! --------------- GET by ID ----------------
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const playerById = await Player.findById(id).populate(
      "team likes selected",
    ); //? cogemos el elemento (jugador) identificandola a través del id, que es único
    if (playerById) {
      //? --------------------------- si hay un elemento con dicho id
      return res.status(200).json(playerById);
    } else {
      return res.status(404).json("no se ha encontrado el jugador ❌");
    }
  } catch (error) {
    return next(
      setError(500, error.message || "Error general al GET by ID ❌"),
    );
  }
};

//! --------------- GET ALL ----------------
const getAll = async (req, res, next) => {
  try {
    const allPlayers = await Player.find().populate("team likes selected"); //? ------------- el find() nos devuelve un array con todos los elementos de la colección del BackEnd, es decir, TODOS LOS JUGADORES
    if (allPlayers.length > 0) {
      //? --------------------------- SI HAY MOTOS:
      return res.status(200).json(allPlayers);
    } else {
      return res
        .status(404)
        .json("no se han encontrado motos en la colección (BackEnd) ❌");
    }
  } catch (error) {
    return next(setError(500, error.message || "Error general al GET ALL ❌"));
  }
};

//! --------------- GET by NAME ----------------
const getByName = async (req, res, next) => {
  try {
    const { name } = req.params;
    console.log(name);
    const playerByName = await Player.find({ name }).populate(
      "team likes selected",
    );
    console.log(playerByName);
    if (playerByName.length > 0) {
      return res.status(200).json(playerByName);
    } else {
      return res
        .status(404)
        .json("no se han encontrado jugadores a través de name ❌");
    }
  } catch (error) {
    return next(
      setError(500, error.message || "Error general al GET by NAME ❌"),
    );
  }
};

//! --------------- UPDATE ----------------
const update = async (req, res) => {
  await Player.syncIndexes(); //? .------------------- busca las actualizaciones, por si se ha modficado el modelo player
  let catchImg = req.file?.path; //? ------- capturamos la url de la img que se sube a cloudinary. El OPTIONAL CHAINING es porque la img no es obligatoria y puede que no haya imagen en la request
  try {
    const { id } = req.params; //? ------------------- en esta linea y la siguiente hacemos lo mismo que en getById
    const playerById = await Player.findById(id);
    if (playerById) {
      const oldImg = playerById.image; //? ------------- guardamos la imagen que había antes en el elemento

      const customBody = {
        _id: playerById._id, //? ---------- ponemos _.id porque así lo pone en insomnia
        image: req.file?.path ? catchImg : oldImg, //? -------------- si en el param hay una nueva imagen la ponemos en el lugar de la que había, si no hay una nueva, se deja la que había
        name: req.body?.name ? req.body.name : playerById.name,
        number: req.body?.number ? req.body.number : playerById.number,
        age: req.body?.age ? req.body.age : playerById.age,
        marketvalue: req.body?.marketvalue
          ? req.body.marketvalue
          : playerById.marketvalue,
        goals: req.body?.goals ? req.body.goals : playerById.goals,
        assists: req.body?.assists ? req.body.assists : playerById.assists,
        rating: req.body?.rating ? req.body.rating : playerById.rating,
        teams: playerById.teams,
        likes: playerById.likes,
        selected: playerById.selected,
      };

      //todo ---------------- ENUM (POSITION) -------------------
      if (req.body?.position) {
        //? si le mandamos la posición:
        const resultEnum = enumPositionOk(req.body?.position); //? checkea si el valor introducido coincide con el enum (enumOk en utils) y devuelve check: true/false
        customBody.position = resultEnum.check
          ? req.body?.position //? ----------------------------- si check es true, coge el valor ya que es válido
          : playerById.position; //? ---------------------------- si check es false, se queda con lo que tenía ya que el valor introducido no es el correcto del enum
      }
      //todo ---------------- ENUM (PREFERRED FOOT) -------------------
      if (req.body?.preferredfoot) {
        const resultEnum = enumPreferredFootOk(req.body?.preferredfoot);
        customBody.preferredfoot = resultEnum.check
          ? req.body?.preferredfoot
          : playerById.preferredfoot;
      }

      try {
        await Player.findByIdAndUpdate(id, customBody).populate(
          "team likes selected",
        ); //? cambiamos el body con lo que hemos puesto en customBody en el elemento que encontremos con el id
        if (req.file?.path) {
          deleteImgCloudinary(oldImg); //? -------------- eliminamos la imagen que había antes en la DB para no almacenar basura
        }
        //!           -------------------
        //!           | RUNTIME TESTING |
        //!           -------------------

        const playerByIdUpdated = await Player.findById(id); //? ---- buscamos el elemento actualizado a través del id
        const elementUpdate = Object.keys(req.body); //? ----------- buscamos los elementos de la request para saber qué se tiene que actualizar
        let test = []; //? ----------------------------------------- objeto vacío donde meter los tests. estará compuesta de las claves de los elementos y los valores seran true/false segun haya ido bien o mal

        elementUpdate.forEach((key) => {
          //? ----------------------------- recorremos las claves de lo que se quiere actualizar
          if (req.body[key] === playerByIdUpdated[key]) {
            //? ---------- si el valor de la clave en la request (el valor actualizado que hemos pedido meter) es el mismo que el que hay ahora en el elemento ---> está bien
            test.push({ [key]: true }); //? ------------------------------------ está bien hecho por lo tanto en el test con la clave comprobada ponemos true --> test aprobado hehe
          } else {
            test.push({ [key]: false }); //? ----------------------------------- algo ha fallado y por lo tanto el test está suspendido (false)
          }
        });

        if (catchImg) {
          playerByIdUpdated.image = catchImg //? ---------------- si la imagen en la request es la misma que la que hay ahora en el elemento
            ? (test = { ...test, file: true }) //? ------------- hacemos una copia de test y le decimos que en file (foto) es true, ha ido bien
            : (test = { ...test, file: false }); //? ------------ hacemos una copia de test y le decimos que en file (foto) es false, ha ido mal
        }

        let acc = 0;
        for (let clave in test) {
          //? -------------------- recorremos tests
          test[clave] == false ? acc++ : null; //? - si el valor es false es que algo ha fallado y le sumamos al contador de fallos
        }

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
            updatedPlayer: playerByIdUpdated,
          });
        }
      } catch (error) {
        return res.status(404).json({
          message: "no se ha guardado el jugador updated correctamente ❌",
          error: error.message,
        });
      }
    } else {
      return res.status(404).json("este jugador no existe ❌");
    }
  } catch (error) {
    return res.status(404).json({
      message:
        "error al actualizar datos del jugador (update) ❌ - catch general",
      error: error.message,
    });
  }
};

//! --------------- DELETE ----------------
const deletePlayer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const player = await Player.findByIdAndDelete(id); //? buscamos el jugador y lo eliminamos

    if (player) {
      //? si el jugador que queremos eliminar existe (tiene que hacerlo para poder eliminarlo)

      try {
        //? --------------------------------------- ELIMINAMOS AL JUGADOR DEL EQUIPO
        await Team.updateMany(
          //? ----- ahora estamos cambiando en el model de Team para poder quitar el jugador que ya no existe
          { players: id }, //? ---------------------- queremos cambiar lo que sea que haya que cambiar en esta propiedad del model, si se omite se dice que se cambia cualquier conincidencia en todo el modelo. es la condición
          { $pull: { players: id } }, //? -------------- estamos diciendo que quite de la propiedad players, el id indicado, es decir el del jugador que se ha eliminado. es la ejecución
        );

        try {
          //? -------------------------------------- ELIMINAMOS AL JUGADOR DEL USER
          await User.updateMany(
            //? ---- ahora estamos cambiando en el model de User para poder quitar el jugador que ya no existe
            { favPlayers: id }, //? ------------------ condición/ubicación del cambio (eliminación)
            { $pull: { favPlayers: id } }, //? ---------- ejecución
          );

          try {
            //? ---------------------------------------- ELIMINAMOS AL JUGADOR DEL ELEVEN
            await Eleven.updateMany(
              //? ---- ahora estamos cambiando en el model de Eleven para poder quitar el jugador que ya no existe
              { $pull: { id } }, //? -------------------------- ejecución
            );
          } catch (error) {
            return next(
              setError(
                500,
                error.message || "Error al eliminar jugador del 11 ideal ❌",
              ),
            );
          }
        } catch (error) {
          return next(
            setError(
              500,
              error.message || "Error al eliminar jugador del user ❌",
            ),
          );
        }
      } catch (error) {
        return next(
          setError(
            500,
            error.message || "Error al eliminar el jugador del equipo ❌",
          ),
        );
      }

      const findByIdPlayer = await Player.findById(id); //? hemos encontrado este jugador? no debería existir porque lo hemos eliminado al ppio
      return res.status(findByIdPlayer ? 404 : 200).json({
        //? si se encuentra hay un error, porque no se ha eliminado
        deleteTest: findByIdPlayer ? false : true, //? si existe, el test ha dado fallo y si no existe ha aprobado el test
      });
    } else {
      return res.status(404).json("este jugador no existe ❌"); //? si no existe el jugador antes de eliminarlo hay que dar error porque el jugador seleccionado para borrar no existia en un primer momento
    }
  } catch (error) {
    return next(
      setError(500, error.message || "Error general al eliminar jugador ❌"),
    );
  }
};

// todo -----------------------------------------------------
// todo -------------- EXTRA CONTROLLERS --------------------
// todo -----------------------------------------------------

//! --------------- SORT GENERAL DESCENDING----------------
const sortPlayersbyDescending = async (req, res, next) => {
  try {
    const { stat } = req.params;
    const playersArray = await Player.find().populate("team likes selected");
    switch (stat) {
      case "number":
      case "age":
      case "marketvalue":
      case "goals":
      case "assists":
      case "rating":
        playersArray.sort((a, b) => {
          return b[stat] - a[stat]; //? le decimos que ordene de manera descendiente (ascendiente sería a - b)
        });
        break;

      case "likes": //? lo hacemos diferente porque tenemos que evaluar la length del array para ver los likes
        playersArray.sort((a, b) => {
          return b[stat].length - a[stat].length; //? le decimos que ordene de manera descendiente (ascendiente sería a - b)
        });
        break;

      case "name":
        playersArray.sort((a, b) => {
          a = a[stat].toLowerCase();
          b = b[stat].toLowerCase();
          return a[stat] < b[stat] ? -1 : 1; //? le decimos que ordene ALFABÉTICAMENTE (al revés sería b - a)
        });
        break;

      default:
        return res
          .status(404)
          .json(
            "La propiedad por la que quiere ordenar no existe/está mal escrita ❌, compruebe el modelo de datos para checkear como se escribe",
          );
    }
    // let arrayResumido
    // if (stat != "likes") {
    //     arrayResumido = playersArray.map((player) => ({ //? que nos muestre solo esta información para no tener ese montón de datos, solo lo relevante
    //         name: player.name,
    //         [stat]: player[stat],
    //     }))
    // } else { //? igual que antes, lo hacemos para poder decirle que nos muestre solamente el numero de likes, no los id que no nos interesan
    //     arrayResumido = playersArray.map((player) => ({
    //         name: player.name,
    //         [stat]: player[stat].length,
    //     }))
    // }
    return res
      .status(playersArray.length > 0 ? 200 : 404)
      .json(
        playersArray.length > 0
          ? playersArray
          : "No se han encontrado jugadores en la DB/BackEnd ❌",
      );
  } catch (error) {
    return next(
      setError(
        500,
        error.message ||
          `Error general al ordenar Jugadores de forma Descendiente ❌`,
      ),
    );
  }
};

//! --------------- SORT GENERAL ASCENDING ----------------
const sortPlayersbyAscending = async (req, res, next) => {
  try {
    const { stat } = req.params;
    const playersArray = await Player.find().populate("team likes selected");
    switch (stat) {
      case "number":
      case "age":
      case "marketvalue":
      case "goals":
      case "assists":
      case "rating":
        playersArray.sort((a, b) => {
          return a[stat] - b[stat]; //? le decimos que ordene de manera ASCENDIENTE
        });
        break;

      case "name":
        playersArray.sort((a, b) => {
          a = a[stat].toLowerCase();
          b = b[stat].toLowerCase();
          return a[stat] > b[stat] ? -1 : 1; //? le decimos que ordene ALFABÉTICAMENTE INVERSO
        });
        break;

      default:
        return res
          .status(404)
          .json(
            "La propiedad por la que quiere ordenar no existe/está mal escrita ❌, compruebe el modelo de datos para checkear como se escribe",
          );
    }
    // const arrayResumido = playersArray.map((player) => ({
    //   //? que nos muestre solo esta información para no tener ese montón de datos, solo lo relevante
    //   name: player.name,
    //   [stat]: player[stat],
    // }));
    return res
      .status(playersArray.length > 0 ? 200 : 404)
      .json(
        playersArray.length > 0
          ? playersArray
          : "No se han encontrado jugadores en la DB/BackEnd ❌",
      );
  } catch (error) {
    return next(
      setError(
        500,
        error.message ||
          `Error general al ordenar Jugadores de forma Ascendiente ❌`,
      ),
    );
  }
};

//! --------------- FILTER GENERAL NUMÉRICO ----------------
const filterGeneralNum = async (req, res, next) => {
  try {
    let playersArray;
    const { filter, gt, lt } = req.params; //? en el param ponemos 1o: propiedad a filtrar, 2o: mayor que (Greater Than), 3o: menor que (Lower Than)
    switch (filter) {
      case "number":
      case "age":
      case "marketvalue":
      case "goals":
      case "assists":
      case "rating":
        playersArray = await Player.find({
          $and: [{ [filter]: { $gt: gt } }, { [filter]: { $lt: lt } }],
        }).populate("team likes selected");
        break;

      default:
        return res
          .status(404)
          .json(
            "La propiedad por la que quiere filtrar no existe/está mal escrita ❌, compruebe el modelo de datos para checkear como se escribe",
          );
    }
    // const arrayResumido = playersArray.map((team) => ({
    //   //? que nos muestre solo esta información para no tener ese montón de datos, solo la info de la propiedad en la que filtramos
    //   name: team.name,
    //   [filter]: team[filter],
    // }));
    return res
      .status(playersArray.length > 0 ? 200 : 404)
      .json(
        playersArray.length > 0
          ? playersArray
          : `No se han encontrado jugadores con ${filter} mayor que ${gt} y menor que ${lt} en la DB/BackEnd ❌`,
      );
  } catch (error) {
    return next(
      setError(500, error.message || `Error general al filtrar Jugadores ❌`),
    );
  }
};

//! --------------- FILTER POSITION / PREFERRED FOOT ----------------
const filterPlayersEnum = async (req, res, next) => {
  try {
    const { filter, value } = req.params;
    const playersArray = await Player.find({ [filter]: value }).populate(
      "team likes selected",
    ); //? buscamos qué jugadores tienen en la propiedad dada por filter, el valor que dan en el url en value
    console.log(playersArray);

    if (filter == "position") {
      //? en caso de que el filter sea POSITION
      const resultEnum = enumPositionOk(value); //? checkea si el valor introducido en param (position) coincide con el enum (enumOk en utils) y devuelve check: true/false
      if (!resultEnum.check) {
        return res
          .status(404)
          .json(
            "La posición indicada en los parémetros no existe o está mal escrita, mira el modelo para asegurarte❌",
          );
      }
    } else {
      //? en caso de que el filter sea PREFERRED FOOT
      const resultEnum = enumPreferredFootOk(value); //? checkea si el valor introducido en param (preferred foot) coincide con el enum (enumOk en utils) y devuelve check: true/false
      if (!resultEnum.check) {
        return res
          .status(404)
          .json(
            "La pierna de disparo indicada en los parémetros no existe o está mal escrita, mira el modelo para asegurarte❌",
          );
      }
    }
    // const arrayResumido = playersArray.map((player) => ({
    //   //? que nos muestre solo esta información para no tener ese montón de datos, solo lo relevante
    //   name: player.name,
    //   [filter]: player[filter],
    // }));
    return res
      .status(playersArray.length > 0 ? 200 : 404)
      .json(
        playersArray.length > 0
          ? playersArray
          : `No se han encontrado jugadores con el filtro ${filter} en ${value} en la DB/BackEnd ❌`,
      );
  } catch (error) {
    return next(
      setError(500, error.message || `Error general al filtar jugadores ❌`),
    );
  }
};

//! --------------- GET LIKE GENDER DIVISION ----------------
const genderSeparation = async (req, res, next) => {
  try {
    const { userId } = req.params; //? cogemos id del jugador al que vamos a examinar
    const player = await Player.findById(userId).populate(
      "team likes selected",
    );
    let men = 0;
    let woman = 0; //! ahora lo que tengo que hacer es recorrer el array y en cada user del likes examinar si es hombre sumar a hombre y si es mujer, sumar a mujer
    let otros = 0;
    const arrayLikes = player.likes;
    console.log(arrayLikes);
    try {
      for (let id of arrayLikes) {
        const user = await User.findById(id);
        if (user.gender == "hombre") {
          men++;
        } else if (user.gender == "mujer") {
          woman++;
        } else {
          otros++;
        }
      }
    } catch (error) {
      return res.status(404).json({
        message: "Error al examinar los generos de los usuarios ❌ (bucle)",
        error: error.message,
      });
    }
    return res
      .status(arrayLikes.length > 0 ? 200 : 404)
      .json(
        arrayLikes.length > 0
          ? { hombres: men, mujeres: woman, otros: otros }
          : `No se han encontrado likes para el jugador ${player.name} en la DB/BackEnd ❌`,
      );
  } catch (error) {
    return next(
      setError(
        500,
        error.message || `Error general al buscar likes por género ❌`,
      ),
    );
  }
};

// todo -----------------------------------------------------
// todo ----------- CONTROLLERS DESCARTADOS -----------------
// todo -----------------------------------------------------
//! --------------- SORT BY RATING -----------------
const sortPlayersbyRating = async (req, res, next) => {
  try {
    const playersArray = await Player.find();
    playersArray.sort((a, b) => {
      return b.rating - a.rating;
    });
    const arrayResumido = playersArray.map((player) => ({
      name: player.name,
      networth: player.rating,
      team: player.team,
    }));
    return res
      .status(arrayResumido.length > 0 ? 200 : 404)
      .json(
        arrayResumido.length > 0
          ? arrayResumido
          : "No se han encontrado jugadores en la DB/BackEnd ❌",
      );
  } catch (error) {
    return next(
      setError(
        500,
        error.message || "Error general al ordenar Jugadores por Rating ❌",
      ),
    );
  }
};

//! --------------- FILTER 90+ PLAYERS -----------------
const filter90Players = async (req, res, next) => {
  try {
    const bestPlayers = await Player.find({ rating: { $gt: 90 } }).populate(
      "team",
    ); //? me devuelve en array los jugadores con un rating mayor que 90 || el populate hace que la propiedad team me de toda la info del team
    const arrayResumido = bestPlayers.map((player) => ({
      //? recorro el array de jugadores para que me de la info de cada jugador que yo quiera
      name: player.name,
      rating: player.rating,
      team: player.team.map((propiedad) => ({ name: propiedad.name })),
      id: player._id,
    }));
    return res
      .status(arrayResumido.length > 0 ? 200 : 404)
      .json(
        arrayResumido.length > 0
          ? arrayResumido
          : "No se han encontrado jugadores con rating mayor a 90 en la DB/BackEnd ❌",
      );
  } catch (error) {
    return next(
      setError(
        500,
        error.message ||
          "Error general al Filtrar Jugadores con 90 o + de Rating ❌",
      ),
    );
  }
};

module.exports = {
  //! MAIN
  create,
  getById,
  getAll,
  getByName,
  update,
  deletePlayer,

  //! EXTRA
  sortPlayersbyDescending,
  sortPlayersbyAscending,
  filterGeneralNum,
  filterPlayersEnum,
  genderSeparation,

  //! DESCARTADOS
  sortPlayersbyRating,
  filter90Players,
};
