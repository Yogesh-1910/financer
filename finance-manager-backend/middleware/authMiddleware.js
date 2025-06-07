// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      return res.status(401).json({ msg: 'Token format is "Bearer <token>", authorization denied' });
    }
    const token = tokenParts[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // This should contain { id: userId, username: userUsername }
    console.log('[AuthMiddleware] User authenticated:', req.user); // Add this log
  next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};