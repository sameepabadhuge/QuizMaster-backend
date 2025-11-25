import Teacher from "../models/Teacher.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


const JWT_SECRET = process.env.JWT_SECRET || "YOUR_SUPER_SECURE_SECRET_KEY";

export const registerTeacher = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, confirmPassword, subject } = req.body;

    if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingTeacher = await Teacher.findOne({ $or: [{ email }, { username }] });
    if (existingTeacher) {
      return res.status(400).json({ message: "Email or Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newTeacher = new Teacher({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      subject,
    });

    await newTeacher.save();

    res.status(201).json({ message: "Teacher registered successfully" });
  } catch (error) {
    console.error("Error during teacher registration:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const loginTeacher = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const teacher = await Teacher.findOne({ email });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const isMatch = await bcrypt.compare(password, teacher.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    const token = jwt.sign(
      { id: teacher._id, role: "teacher" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const teacherObject = teacher.toObject();
    delete teacherObject.password;

    return res.status(200).json({
      success: true,
      message: "Teacher logged in successfully",
      token,
      user: teacherObject
    });

  } catch (error) {
    console.error("Teacher Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
