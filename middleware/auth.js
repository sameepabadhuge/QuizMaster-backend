// middleware/auth.js
import jwt from "jsonwebtoken";

export const verifyStudent = (req, res, next) => {
  const authHeader = req.headers.authorization; // Bearer <token>
  if (!authHeader) return res.status(401).json({ success: false, message: "Not authorized" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.student = decoded; // store decoded student info
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};
