import mongoose, { Schema, models } from "mongoose";

const QuestionSchema = new Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true },
  explanation: { type: String },
  tags: [{ type: String }],
});

const QuizSchema = new Schema({
  title: { type: String, required: true },
  date: { type: String, required: true, unique: true }, // "YYYY-MM-DD"
  questions: [QuestionSchema],
  isPublished: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

const QuizAttemptSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
  answers: [{ type: Number }], // selected option index per question
  score: { type: Number },
  timeTaken: { type: Number }, // seconds
  completedAt: { type: Date, default: Date.now },
});

export const Quiz = models.Quiz || mongoose.model("Quiz", QuizSchema);
export const QuizAttempt = models.QuizAttempt || mongoose.model("QuizAttempt", QuizAttemptSchema);
