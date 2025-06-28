const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log("Received Token:", token); // ✅ Already printing

  if (!token) {
    console.log("❌ No token found");
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token is valid. Decoded payload:", decoded); // 🔍 Add this
    req.user = decoded;
    next();
  } catch (err) {
    console.log("❌ JWT Verification Error:", err.message); // 🔥 Important
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authenticate;
