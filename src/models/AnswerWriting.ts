import mongoose, { Schema, models } from "mongoose";

const AnswerPromptSchema = new Schema({
  question: { type: String, required: true },
  date: { type: String, required: true, unique: true }, // "YYYY-MM-DD"
  paper: { type: String, enum: ["GS1", "GS2", "GS3", "GS4", "Essay", "Optional"], default: "GS1" },
  tags: [{ type: String }],
  wordLimit: { type: Number, default: 250 },
  idealPoints: [{ type: String }], // key points admin adds for self-eval
  isPublished: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

const AnswerSubmissionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  promptId: { type: Schema.Types.ObjectId, ref: "AnswerPrompt" }, // optional — backend evals may not have a prompt
  content: { type: String, required: true },
  wordCount: { type: Number },
  selfScore: { type: Number, min: 1, max: 10 },
  selfNote: { type: String },
  timeTaken: { type: Number }, // seconds
  submittedAt: { type: Date, default: Date.now },
  // AI evaluation fields (populated by Python backend /mains/evaluate)
  ai_score: { type: Number },
  ai_max_marks: { type: Number },
  ai_percentage: { type: Number },
  ai_breakdown: { type: Schema.Types.Mixed },
  ai_strengths: [{ type: String }],
  ai_improvements: [{ type: String }],
  ai_model_points: [{ type: String }],
});

export const AnswerPrompt = models.AnswerPrompt || mongoose.model("AnswerPrompt", AnswerPromptSchema);
export const AnswerSubmission = models.AnswerSubmission || mongoose.model("AnswerSubmission", AnswerSubmissionSchema);
