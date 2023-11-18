const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ElevenSchema = new Schema(
  {
    name: { type: String, unique: true, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
    goalkeeper: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
    rightback: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
    centreback1: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
    centreback2: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
    leftback: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
    midfielder1: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
    midfielder2: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
    midfielder3: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
    forward1: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
    forward2: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
    forward3: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  },
  {
    timestamps: true,
  },
);
const Eleven = mongoose.model("Eleven", ElevenSchema);
module.exports = Eleven;
