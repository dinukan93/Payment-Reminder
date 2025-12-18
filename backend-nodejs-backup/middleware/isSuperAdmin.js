import jwt from 'jsonwebtoken';

// Middleware to verify user is a superadmin
const isSuperAdmin = (req, res, next) => {
  try {
    let token = null;

    // Authorization: Bearer <token>
    const auth = req.headers.authorization || req.headers.Authorization;
    if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) {
      token = auth.split(' ')[1];
    }

    // cookie: token
    if (!token && req.cookies && req.cookies.token) token = req.cookies.token;

    // query param: ?token=
    if (!token && req.query && req.query.token) token = req.query.token;

    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.SECRET_KEY || 'dev_secret');
    
    // Check if user is superadmin
    if (decoded.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Superadmin role required.' });
    }

    // attach user info from JWT
    req.user = { 
      id: decoded.id, 
      email: decoded.email, 
      name: decoded.name, 
      role: decoded.role,
      rtom: decoded.rtom || ''
    };
    next();
  } catch (error) {
    console.error('SuperAdmin middleware error', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default isSuperAdmin;
