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

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
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

// Get teacher profile
export const getTeacherProfile = async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    const teacher = await Teacher.findById(teacherId).select("-password");
    
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    res.json({ success: true, teacher });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Update teacher profile
export const updateTeacherProfile = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { firstName, lastName, username, email, subject, phone, bio, profilePicture } = req.body;

    const teacher = await Teacher.findById(teacherId);
    
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    // Check if username or email already exists (for other users)
    if (username !== teacher.username) {
      const existingUsername = await Teacher.findOne({ username, _id: { $ne: teacherId } });
      if (existingUsername) {
        return res.status(400).json({ success: false, message: "Username already taken" });
      }
    }

    if (email !== teacher.email) {
      const existingEmail = await Teacher.findOne({ email, _id: { $ne: teacherId } });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: "Email already in use" });
      }
    }

    // Validate phone if provided
    if (phone !== undefined && phone !== null && phone !== "") {
      const phoneStr = String(phone);
      if (!/^\d{10}$/.test(phoneStr)) {
        return res.status(400).json({ success: false, message: "Phone number must be exactly 10 digits" });
      }
    }

    // Update fields
    teacher.firstName = firstName || teacher.firstName;
    teacher.lastName = lastName || teacher.lastName;
    teacher.username = username || teacher.username;
    teacher.email = email || teacher.email;
    teacher.subject = subject || teacher.subject;
    teacher.phone = phone !== undefined ? phone : teacher.phone;
    teacher.bio = bio !== undefined ? bio : teacher.bio;
    teacher.profilePicture = profilePicture !== undefined ? profilePicture : teacher.profilePicture;

    await teacher.save();

    const teacherObject = teacher.toObject();
    delete teacherObject.password;

    res.json({ success: true, message: "Profile updated successfully", teacher: teacherObject });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Change password
export const changeTeacherPassword = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const teacher = await Teacher.findById(teacherId);
    
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, teacher.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    teacher.password = hashedPassword;
    await teacher.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
