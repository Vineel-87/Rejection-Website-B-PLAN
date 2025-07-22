require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pool = require('./db');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();

// Configuration
const PORT = process.env.SERVER2_PORT || 5002;
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:5500', 
  'http://localhost:5500'
];

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    fs.mkdir(uploadDir, { recursive: true }, (err) => {
      if (err) {
        console.error("Error creating upload directory:", err);
        return cb(err);
      }
      cb(null, uploadDir);
    });
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user?.userId + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public directory
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token" });
    req.user = user;
    next();
  });
};

// Health check
app.get('/api/v2/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    res.json({ status: 'healthy', server: 'server2' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: 'DB connection failed' });
  }
});

// Get user profile with avatar
app.get('/api/v2/user/profile', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Get user info with avatar
    const [userRows] = await connection.query(
      "SELECT id, email, name, phone, avatar FROM users WHERE id = ?",
      [req.user.userId]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userRows[0];
    
    res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email.split('@')[0])}&background=random`
    });
  } catch (error) {
    console.error("User profile error:", error);
    res.status(500).json({ message: "Failed to fetch user profile" });
  } finally {
    if (connection) await connection.release();
  }
});

// Update user avatar
app.post('/api/v2/user/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const avatarPath = '/uploads/' + req.file.filename;
  
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.query(
      "UPDATE users SET avatar = ? WHERE id = ?",
      [avatarPath, req.user.userId]
    );
    
    res.status(200).json({ 
      message: "Avatar updated successfully",
      avatar: avatarPath
    });
  } catch (error) {
    console.error("Avatar update error:", error);
    res.status(500).json({ message: "Failed to update avatar" });
  } finally {
    if (connection) await connection.release();
  }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    message: "Endpoint not found",
    availableEndpoints: [
      "GET /api/v2/health",
      "GET /api/v2/user/profile",
      "POST /api/v2/user/avatar"
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server2 running on http://localhost:${PORT}`);
});