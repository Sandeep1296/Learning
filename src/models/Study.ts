import mongoose, { Schema, models } from "mongoose";

const FlashcardSchema = new Schema({
  front: { type: String, required: true },
  back: { type: String, required: true },
  tags: [{ type: String }],
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

const StudyNoteSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  tags: [{ type: String }],
  paper: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const PYQSchema = new Schema({
  question: { type: String, required: true },
  year: { type: Number, required: true },
  paper: { type: String, required: true },
  type: { type: String, enum: ["prelims", "mains"], required: true },
  options: [{ type: String }], // for prelims MCQ
  correctIndex: { type: Number }, // for prelims
  answer: { type: String }, // for mains
  explanation: { type: String },
  tags: [{ type: String }],
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

export const Flashcard = models.Flashcard || mongoose.model("Flashcard", FlashcardSchema);
export const StudyNote = models.StudyNote || mongoose.model("StudyNote", StudyNoteSchema);
export const PYQ = models.PYQ || mongoose.model("PYQ", PYQSchema);
