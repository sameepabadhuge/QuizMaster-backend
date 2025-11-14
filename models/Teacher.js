import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  subject: { type: String },
  role: { type: String, default: "teacher" },
  createdAt: { type: Date, default: Date.now },
});

const Teacher = mongoose.model("Teacher", teacherSchema);
export default Teacher;
