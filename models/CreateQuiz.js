import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true }, // index of correct option
});

const createQuizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
  lectureName: { type: String },
  subject: { type: String },
  duration: { type: Number },
  difficulty: { type: String },
  questions: [questionSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("CreateQuiz", createQuizSchema);
