const bcrypt = require("bcrypt"); //? encriptamos información
const validator = require("validator"); //? validamos información
const mongoose = require("mongoose"); //? hacemos modelo

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      validate: [validator.isEmail, "Email not valid"],
    },
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      validate: [validator.isStrongPassword], //minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1
    },
    gender: {
      type: String,
      enum: ["hombre", "mujer", "otros"],
      required: true,
    },
    rol: {
      type: String,
      enum: ["admin", "user", "superadmin"],
      default: "user",
    },
    confirmationCode: {
      type: Number,
      required: true,
    },
    check: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
    },

    favPlayers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
    favTeams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }],
    favElevens: [{ type: mongoose.Schema.Types.ObjectId, ref: "Eleven" }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    favComments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    followed: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    yourteam: [{ type: mongoose.Schema.Types.ObjectId, ref: "Eleven" }],
  },
  {
    timestamps: true,
  },
);

UserSchema.pre("save", async function (next) {
  try {
    this.password = await bcrypt.hash(this.password, 10); //? estamos encriptando la contraseña por temas de seguridad, la hasheamos 10 veces
    next();
  } catch (error) {
    next("Error hashing password ❌"); //? como es un fallo importante se pasa al log (next)
  }
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
