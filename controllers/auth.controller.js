// backend/controllers/auth.controller.js

import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

//  Ensure JWT_SECRET exists
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}
const JWT_SECRET = process.env.JWT_SECRET;

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

    const normalizedEmail = email.toLowerCase();
    const normalizedRole = role.toLowerCase();

    // 2. Find user
    let user;
    if (normalizedRole === "student") {
      user = await Student.findOne({ email: normalizedEmail });
    } else if (normalizedRole === "teacher") {
      user = await Teacher.findOne({ email: normalizedEmail });
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

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: "7d",
    });

    // 5. Remove password from response
    const userObject = user.toObject();
    delete userObject.password;

    // 6. Store token in HTTP-only cookie 
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only in prod
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 7. Send response (no token exposed)
    return res.status(200).json({
      success: true,
      message: "Login successful!",
      user: userObject,
    });

  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Login Error:", error);
    }

    return res.status(500).json({
      success: false,
      message: "Server error during login process.",
    });
  }
};

/**
 * CHECK LOGIN STATUS CONTROLLER
 */
export const checkLoginStatus = (req, res) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(200).json({ isLoggedIn: false });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    return res.status(200).json({
      isLoggedIn: true,
      role: decoded.role,
      userId: decoded.id,
    });

  } catch (error) {
    return res.status(200).json({ isLoggedIn: false });
  }
};

/**
 * LOGOUT CONTROLLER
 */
export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};