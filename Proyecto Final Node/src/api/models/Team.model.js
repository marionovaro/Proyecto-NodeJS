const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const TeamSchema = new Schema(
  {
    name: { type: String, unique: true, required: true },
    league: {
      type: String,
      required: true,
      enum: ["Premier", "LaLiga", "Serie A", "Bundesliga", "Ligue 1"],
    },
    ranking: { type: Number, required: true },
    points: { type: Number, required: true },
    overalltrophies: { type: Number, required: true },
    seasontrophies: { type: Number, required: true },
    networth: { type: Number, required: true },
    stadium: { type: String, required: false },
    image: { type: String, required: false },

    players: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
  },
);
const Team = mongoose.model("Team", TeamSchema);
module.exports = Team;
