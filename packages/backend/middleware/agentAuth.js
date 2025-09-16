const jwt = require('jsonwebtoken');

module.exports = async function (req, res, next) {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization header is required" });
    }
    
    // Extract and validate token
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    if (!token) {
      return res.status(401).json({ error: "Token is required" });
    }
    
    const secretKey = process.env.AGENT_SECRET;
    
    try {
      const decodeToken = jwt.verify(token, secretKey);
      console.log("Decoded token:", decodeToken);
    } catch (jwtError) {
      return res.status(403).json({ error: "Invalid or expired token", details: jwtError.message });
    }
    next();
  } catch (error) {
    console.error("Error in agentAuth middleware:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}