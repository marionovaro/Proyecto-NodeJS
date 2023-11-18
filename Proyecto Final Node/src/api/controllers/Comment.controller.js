const setError = require("../../helpers/handle-error");
const Comment = require("../models/Comment.model");
const Eleven = require("../models/Eleven.model");
const User = require("../models/User.model");

//! ---------------- CREATE -----------------
const create = async (req, res, next) => {
  try {
    await Comment.syncIndexes();
    const { location } = req.params;
    const creator = req.user._id;
    const body = req.body;
    const customBody = {
      //? creamos un customBody para añadirle el creador que nos lo da el token y la location que nos la da la url. a parte del contenido que lo damos en el body
      creator: creator,
      location: location,
      comment: body.comment,
    };
    const newComment = new Comment(customBody);
    const saveComment = await newComment.save();
    await Eleven.findByIdAndUpdate(
      location, //? ----- hacemos que sea recíproco, y que se cree el comentario en el eleven
      { $push: { comments: saveComment._id } },
    );
    await User.findByIdAndUpdate(
      creator, //? ----- hacemos que sea recíproco, y que se cree el comentario en el eleven
      { $push: { comments: saveComment._id } },
    );
    return res
      .status(saveComment ? 200 : 404)
      .json(saveComment ? saveComment : "Error en el guardado del comentario");
  } catch (error) {
    return next(
      setError(500, error.message || "Error general al crear tu comentario ❌"),
    );
  }
};

//! --------------- GET by ID ----------------
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const commentById = await Comment.findById(id).populate(
      "creator location likes",
    ); //? cogemos el elemento (eleven) identificandola a través del id, que es único
    return res
      .status(commentById ? 200 : 404)
      .json(
        commentById
          ? commentById
          : "no se ha encontrado un comentario con ese id ❌",
      );
  } catch (error) {
    return next(
      setError(
        500,
        error.message || "Error general al buscar comentario a través de ID ❌",
      ),
    );
  }
};

//! --------------- GET ALL ----------------
const getAll = async (req, res, next) => {
  try {
    const { location } = req.params;
    const elevenById = await Eleven.findById(location);
    const allComments = await Comment.find({ location: location }).populate(
      "creator location likes",
    ); //? ------------- el find() nos devuelve un array con todos los elementos de la colección del BackEnd, es decir, Ttodos los comments que tengan location en el id que hemos puesto
    if (elevenById) {
      return res
        .status(allComments.length > 0 ? 200 : 404) //? ---- si hay equipos en la db (el array tiene al menos 1 elemento), 200 o 404
        .json(
          allComments.length > 0
            ? allComments
            : `No se han encontrado comentarios en ${elevenById.name} en la DB ❌`,
        );
    } else {
      return res
        .status(404)
        .json(`El eleven porporcionado en la url no existe ❌`);
    }
  } catch (error) {
    return next(
      setError(
        500,
        error.message ||
          `Error general al buscar todos los comentarios del 11 ideal indicado ❌`,
      ),
    );
  }
};

//! ---------------- DELETE -----------------
const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findByIdAndDelete(id); //? buscamos el equipo y lo eliminamos

    if (comment) {
      //? si el equipo que queremos eliminar existe (tiene que hacerlo para poder eliminarlo)

      try {
        //? --------------------------------------------- ELIMINAMOS AL COMMENT, DEL ELEVEN
        await Eleven.updateMany(
          //? --------- ahora estamos cambiando en el model de Eleven para poder quitar el equipo que ya no existe
          { comments: id }, //? --------------------------- queremos cambiar lo que sea que haya que cambiar en esta propiedad del model, si se omite se dice que se cambia cualquier conincidencia en todo el modelo. es la condición
          { $pull: { comments: id } }, //? ------------------- estamos diciendo que quite de la propiedad comments, el id indicado, es decir el del equipo que se ha eliminado. es la ejecución
        );

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
              error.message || "Error al eliminar el comentario del user ❌",
            ),
          );
        }
      } catch (error) {
        return next(
          setError(
            500,
            error.message || "Error al eliminar el comentario del eleven ❌",
          ),
        );
      }

      const findByIdComment = await Comment.findById(id); //? hemos encontrado este equipo? no debería existir porque lo hemos eliminado al ppio
      return res.status(findByIdComment ? 404 : 200).json({
        //? si se encuentra hay un error, porque no se ha eliminado
        deleteTest: findByIdComment ? false : true, //? si existe, el test ha dado fallo y si no existe ha aprobado el test
      });
    } else {
      return res.status(404).json("este comentario no existe ❌"); //? si no existe el jugador antes de eliminarlo hay que dar error porque el jugador seleccionado para borrar no existia en un primer momento
    }
  } catch (error) {
    return next(
      setError(
        500,
        error.message || "Error general al eliminar tu comentario ❌",
      ),
    );
  }
};

module.exports = {
  create,
  getById,
  getAll,
  deleteComment,
};
