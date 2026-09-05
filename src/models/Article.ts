import mongoose, { Schema, models } from "mongoose";

const ArticleSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  source: { type: String },
  sourceUrl: { type: String },
  type: { type: String, enum: ["news", "report", "editorial"], default: "news" },
  tags: [{ type: String }], // UPSC syllabus topic slugs
  summary: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  publishedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

export const Article = models.Article || mongoose.model("Article", ArticleSchema);
