const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const PlayerSchema = new Schema(
  {
    name: { type: String, unique: true, required: true },
    position: {
      type: String,
      required: true,
      enum: [
        "goalkeeper",
        "centre-back",
        "right-back",
        "left-back",
        "midfielder",
        "forward",
      ],
    },
    number: { type: Number, required: true },
    age: { type: Number, required: true },
    marketvalue: { type: Number, required: true },
    goals: { type: Number, required: true },
    assists: { type: Number, required: true },
    rating: { type: Number, required: true },
    preferredfoot: {
      type: String,
      required: true,
      enum: ["right", "left"],
    },
    image: { type: String, required: false },

    team: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    selected: [{ type: mongoose.Schema.Types.ObjectId, ref: "Eleven" }],
  },
  {
    timestamps: true,
  },
);
const Player = mongoose.model("Player", PlayerSchema);
module.exports = Player;
