// backend/controllers/auth.controller.js
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js"; // Add teacher model if needed
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "YOUR_SUPER_SECURE_SECRET_KEY";

/**
 * LOGIN CONTROLLER
 * Supports login for both students and teachers
 */
export const login = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    // 1. Validate input
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and role are required.",
      });
    }

    // 2. Find user in the correct collection
    let user;
    const normalizedRole = role.toLowerCase();
    
    if (normalizedRole === "student") {
      user = await Student.findOne({ email });
    } else if (normalizedRole === "teacher") {
      user = await Teacher.findOne({ email });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be 'student' or 'teacher'.",
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // 4. Generate JWT
    const payload = {
      id: user._id,
      role: normalizedRole,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    // 5. Convert user document to plain object and remove password
    const userObject = user.toObject();
    delete userObject.password;

    res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      user: userObject,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login process.",
    });
  }
};

/**
 * CHECK LOGIN STATUS CONTROLLER
 * Verifies if the user is logged in based on the provided token.
 */
export const checkLoginStatus = (req, res) => {
  const token = req.cookies?.token; // Assuming token is stored in cookies

  if (!token) {
    return res.status(200).json({ isLoggedIn: false });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.status(200).json({ isLoggedIn: true, role: decoded.role });
  } catch (error) {
    res.status(200).json({ isLoggedIn: false });
  }
};
