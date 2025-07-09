require('dotenv').config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const pool = require('./db');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Fix for path-to-regexp issue
const { pathToRegexp } = require('path-to-regexp');

// Enhanced CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:5500', 
  'http://localhost:5500'
];

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
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  exposedHeaders: ["Authorization"]
}));

// Pre-flight requests
app.options('*', cors());

// Body parser middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

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

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Helper Functions
const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '24h' }
  );
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token" });
    req.user = user;
    next();
  });
};

// Database Helper Functions
const parseSkills = (skills) => {
  try {
    if (Array.isArray(skills)) return skills;
    if (typeof skills === 'string') return JSON.parse(skills);
    return [];
  } catch (e) {
    console.error("Skills parsing error:", e);
    return [];
  }
};

const formatDate = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString).toISOString().split('T')[0];
};

// Serve static files from public directory
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));


// API Endpoints

// Health Check
app.get("/api/health", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    res.status(200).json({ 
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected"
    });
  } catch (error) {
    res.status(500).json({ 
      status: "unhealthy",
      error: "Database connection failed"
    });
  }
});

// User Registration
app.post("/api/register", async (req, res) => {
  const { email, password, name, phone } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  let connection;
  try {
    connection = await pool.getConnection();

    // Check if user exists
    const [existing] = await connection.query(
      "SELECT id FROM users WHERE email = ?", 
      [email]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await connection.query(
      `INSERT INTO users 
       (email, password, name, phone, otp, otp_expiry, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [email, hashedPassword, name || email.split('@')[0], phone, otp, otpExpiry, false]
    );

    // Send OTP email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Verification OTP',
      text: `Your OTP is: ${otp}`
    });

    res.status(201).json({ 
      message: "OTP sent to email",
      userId: result.insertId
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      message: "Registration failed",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) await connection.release();
  }
});

// OTP Verification
app.post("/api/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [users] = await connection.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];

    if (user.is_verified) {
      return res.status(400).json({ message: "User already verified" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date(user.otp_expiry) < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // Mark as verified
    await connection.query(
      "UPDATE users SET is_verified = true, otp = NULL WHERE id = ?",
      [user.id]
    );

    // Generate token
    const token = generateToken(user);

    res.status(200).json({ 
      message: "Account verified",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ 
      message: "OTP verification failed",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) await connection.release();
  }
});

// User Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [users] = await connection.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = users[0];

    if (!user.is_verified) {
      return res.status(403).json({ message: "Account not verified" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email.split('@')[0])}&background=random`
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      message: "Login failed",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) await connection.release();
  }
});

// User Profile
app.get("/api/user", authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(
      "SELECT id, email, name, phone, avatar FROM users WHERE id = ?",
      [req.user.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];
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

// Update Profile Info (name, phone, etc.)
app.put("/api/user", authenticateToken, async (req, res) => {
  const { name, phone } = req.body;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.query(
      "UPDATE users SET name = ?, phone = ? WHERE id = ?",
      [name, phone, req.user.userId]
    );

    res.status(200).json({ 
      message: "Profile updated successfully",
      name,
      phone
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  } finally {
    if (connection) await connection.release();
  }
});


// Update Avatar (POST method for file upload)
app.post("/api/user/avatar", authenticateToken, upload.single('avatar'), async (req, res) => {
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

// Get user profile (extended info)
app.get("/api/user/profile", authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Get basic user info
    const [userRows] = await connection.query(
      "SELECT id, email, name, phone, avatar FROM users WHERE id = ?",
      [req.user.userId]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get profile info
    const [profileRows] = await connection.query(
      "SELECT * FROM user_profiles WHERE user_id = ?",
      [req.user.userId]
    );

    const user = userRows[0];
    const profile = profileRows[0] || {};

    res.status(200).json({
      ...user,
      ...profile,
      avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email.split('@')[0])}&background=random`
    });
  } catch (error) {
    console.error("User profile error:", error);
    res.status(500).json({ message: "Failed to fetch user profile" });
  } finally {
    if (connection) await connection.release();
  }
});


// Update user profile (partial updates supported)
app.put("/api/user/profile", authenticateToken, async (req, res) => {
  const allowedFields = [
    'bio', 'dob', 'gender', 'address',
    'facebook', 'instagram', 'linkedin', 'telegram',
    'snapchat', 'github', 'portfolio'
  ];
  
  // Filter only allowed fields that exist in the request
  const updateData = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  // If no valid fields to update
  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ message: "No valid fields provided for update" });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // Check if profile exists
    const [existing] = await connection.query(
      "SELECT id FROM user_profiles WHERE user_id = ?",
      [req.user.userId]
    );

    if (existing.length > 0) {
      // Build the SET clause dynamically
      const setClause = Object.keys(updateData)
        .map(field => `${field} = ?`)
        .join(', ');
      
      // Create values array in the correct order
      const values = [...Object.values(updateData), req.user.userId];

      // Update only the provided fields
      await connection.query(
        `UPDATE user_profiles SET
          ${setClause},
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?`,
        values
      );
    } else {
      // Create new profile with only the provided fields
      const fields = ['user_id', ...Object.keys(updateData)];
      const placeholders = fields.map(() => '?').join(', ');
      const values = [req.user.userId, ...Object.values(updateData)];

      await connection.query(
        `INSERT INTO user_profiles (${fields.join(', ')}) 
        VALUES (${placeholders})`,
        values
      );
    }

    res.status(200).json({ 
      message: "Profile updated successfully",
      updatedFields: Object.keys(updateData)
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  } finally {
    if (connection) await connection.release();
  }
});

// Update Background Image
app.post("/api/user/background", authenticateToken, upload.single('background'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const backgroundPath = '/uploads/' + req.file.filename;
  
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Check if profile exists
    const [existing] = await connection.query(
      "SELECT id FROM user_profiles WHERE user_id = ?",
      [req.user.userId]
    );

    if (existing.length > 0) {
      await connection.query(
        "UPDATE user_profiles SET background_image = ? WHERE user_id = ?",
        [backgroundPath, req.user.userId]
      );
    } else {
      await connection.query(
        "INSERT INTO user_profiles (user_id, background_image) VALUES (?, ?)",
        [req.user.userId, backgroundPath]
      );
    }
    
    res.status(200).json({ 
      message: "Background updated successfully",
      background: backgroundPath
    });
  } catch (error) {
    console.error("Background update error:", error);
    res.status(500).json({ message: "Failed to update background" });
  } finally {
    if (connection) await connection.release();
  }
});

// Get other user's profile
app.get("/api/user/:id/profile", authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Get basic user info
    const [userRows] = await connection.query(
      "SELECT id, email, name, phone, avatar FROM users WHERE id = ?",
      [req.params.id]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get profile info
    const [profileRows] = await connection.query(
      "SELECT * FROM user_profiles WHERE user_id = ?",
      [req.params.id]
    );

    const user = userRows[0];
    const profile = profileRows[0] || {};

    // Don't return sensitive info for other users
    res.status(200).json({
      id: user.id,
      name: user.name,
      avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email.split('@')[0])}&background=random`,
      bio: profile.bio,
      background_image: profile.background_image
    });
  } catch (error) {
    console.error("User profile error:", error);
    res.status(500).json({ message: "Failed to fetch user profile" });
  } finally {
    if (connection) await connection.release();
  }
});

// Update Bio (PUT method)
app.put("/api/user/bio", authenticateToken, async (req, res) => {
  console.log("Bio update request body:", req.body);
  const { bio } = req.body;

  if (typeof bio !== 'string') {
    return res.status(400).json({ message: "Bio must be a string" });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    
    // Check if profile exists
    const [existing] = await connection.query(
      "SELECT id FROM user_profiles WHERE user_id = ?",
      [req.user.userId]
    );

    if (existing.length > 0) {
      await connection.query(
        "UPDATE user_profiles SET bio = ? WHERE user_id = ?",
        [bio, req.user.userId]
      );
    } else {
      await connection.query(
        "INSERT INTO user_profiles (user_id, bio) VALUES (?, ?)",
        [req.user.userId, bio]
      );
    }

    res.status(200).json({ 
      message: "Bio updated successfully",
      bio
    });
  } catch (error) {
    console.error("Bio update error:", error);
    res.status(500).json({ message: "Failed to update bio" });
  } finally {
    if (connection) await connection.release();
  }
});

// Get user profile by email
app.get("/api/user/by-email/:email", authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Get basic user info
    const [userRows] = await connection.query(
      "SELECT id, email, name, phone, avatar FROM users WHERE email = ?",
      [req.params.email]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get profile info
    const [profileRows] = await connection.query(
      "SELECT * FROM user_profiles WHERE user_id = ?",
      [userRows[0].id]
    );

    const user = userRows[0];
    const profile = profileRows[0] || {};

    // Don't return sensitive info for other users
    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email.split('@')[0])}&background=random`,
      bio: profile.bio,
      dob: profile.dob,
      gender: profile.gender,
      facebook: profile.facebook,
      instagram: profile.instagram,
      linkedin: profile.linkedin,
      telegram: profile.telegram,
      snapchat: profile.snapchat,
      github: profile.github,
      portfolio: profile.portfolio,
      background_image: profile.background_image
    });
  } catch (error) {
    console.error("User profile by email error:", error);
    res.status(500).json({ message: "Failed to fetch user profile" });
  } finally {
    if (connection) await connection.release();
  }
});

// Get user's friends
// In your server.js
app.get("/api/user/friends/count", authenticateToken, async (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    
    const [result] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM friends 
      WHERE (user_id = ? OR friend_id = ?) 
      AND status = 'accepted'
    `, [userId, userId]);
    
    res.status(200).json({ count: result[0].count });
  } catch (error) {
    console.error("Friend count error:", error);
    res.status(500).json({ message: "Failed to get friend count" });
  } finally {
    if (connection) await connection.release();
  }
});

// Add friend
app.post("/api/user/friends", authenticateToken, async (req, res) => {
  const { friendEmail } = req.body;
  
  if (!friendEmail) {
    return res.status(400).json({ message: "Friend email is required" });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    
    // Get friend user
    const [friendUsers] = await connection.query(
      "SELECT id FROM users WHERE email = ?",
      [friendEmail]
    );
    
    if (friendUsers.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const friendId = friendUsers[0].id;
    
    // Check if already friends
    const [existing] = await connection.query(
      "SELECT id FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
      [req.user.userId, friendId, friendId, req.user.userId]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ message: "Friend request already exists" });
    }

    // Create friend request
    await connection.query(
      "INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?)",
      [req.user.userId, friendId, 'pending']
    );

    res.status(201).json({ message: "Friend request sent" });
  } catch (error) {
    console.error("Add friend error:", error);
    res.status(500).json({ message: "Failed to add friend" });
  } finally {
    if (connection) await connection.release();
  }
});

// Update the existing endpoint to support partial matching
app.get("/api/user/search/:term", authenticateToken, async (req, res) => {
  const searchTerm = `%${req.params.term}%`;
  
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Search by email or name
    const [users] = await connection.query(`
      SELECT 
        u.id, 
        u.email, 
        u.name, 
        u.avatar,
        up.dob
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.email LIKE ? OR u.name LIKE ?
      LIMIT 15
    `, [searchTerm, searchTerm]);
    
    res.status(200).json(users);
  } catch (error) {
    console.error("User search error:", error);
    res.status(500).json({ message: "Failed to search users" });
  } finally {
    if (connection) await connection.release();
  }
});

// Get user's friends list
app.get("/api/user/friends", authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Get accepted friends (both directions)
    const [friends] = await connection.query(`
      SELECT 
        u.id, 
        u.email, 
        u.name, 
        u.avatar,
        up.dob
      FROM friends f
      JOIN users u ON 
        (f.user_id = ? AND f.friend_id = u.id) OR 
        (f.friend_id = ? AND f.user_id = u.id)
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE f.status = 'accepted'
      ORDER BY u.name
    `, [req.user.userId, req.user.userId]);

    res.status(200).json(friends);
  } catch (error) {
    console.error("Friends list error:", error);
    res.status(500).json({ message: "Failed to fetch friends list" });
  } finally {
    if (connection) await connection.release();
  }
});

// Job Posts Endpoints
// Get all job posts
app.get("/api/job-posts", authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT 
        id, userId, username, userAvatar, jobLink, 
        datePosted, company, description, skills, 
        location, lastDate, experience, workMode, 
        status, timestamp
      FROM job_posts 
      ORDER BY timestamp DESC
      LIMIT 100
    `);

    res.status(200).json(
      rows.map(post => ({
        ...post,
        skills: parseSkills(post.skills),
        datePosted: formatDate(post.datePosted),
        lastDate: formatDate(post.lastDate)
      }))
    );
  } catch (error) {
    console.error("GET /api/job-posts error:", error);
    res.status(500).json({ 
      message: "Failed to fetch job posts",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) await connection.release();
  }
});

// Create job post
app.post("/api/job-posts", authenticateToken, async (req, res) => {
  const requiredFields = [
    'jobLink', 'company', 'description', 
    'location', 'experience', 'workMode'
  ];
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({ 
      message: "Missing required fields",
      missingFields 
    });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    
    // Get user info
    const [users] = await connection.query(
      "SELECT id, email, name FROM users WHERE id = ?",
      [req.user.userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];
    const username = user.name || user.email.split('@')[0];
    const userAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;

    // Process skills
    const skills = Array.isArray(req.body.skills) ? req.body.skills : [];
    
    // Set dates
    const datePosted = req.body.datePosted || new Date().toISOString().split('T')[0];
    const lastDate = req.body.lastDate || 
                   new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Create job post
    const [result] = await connection.query(
      `INSERT INTO job_posts 
       (userId, username, userAvatar, jobLink, datePosted, company, 
        description, skills, location, lastDate, experience, workMode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.userId,
        username,
        userAvatar,
        req.body.jobLink,
        datePosted,
        req.body.company,
        req.body.description,
        JSON.stringify(skills),
        req.body.location,
        lastDate,
        req.body.experience,
        req.body.workMode
      ]
    );

    res.status(201).json({ 
      message: "Job post created successfully",
      postId: result.insertId
    });
  } catch (error) {
    console.error("POST /api/job-posts error:", error);
    res.status(500).json({ 
      message: "Failed to create job post",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) await connection.release();
  }
});

// Delete job post
app.delete("/api/job-posts/:id", authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Verify post exists and belongs to user
    const [existing] = await connection.query(
      "SELECT id FROM job_posts WHERE id = ? AND userId = ?",
      [req.params.id, req.user.userId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: "Job post not found or unauthorized" });
    }

    // Delete post
    await connection.query(
      "DELETE FROM job_posts WHERE id = ?",
      [req.params.id]
    );

    res.status(200).json({ 
      message: "Job post deleted successfully"
    });
  } catch (error) {
    console.error(`DELETE /api/job-posts/${req.params.id} error:`, error);
    res.status(500).json({ 
      message: "Failed to delete job post",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) await connection.release();
  }
});

// In server.js - make sure this endpoint is correct
// Get friendship status between current user and target user
app.get("/api/user/friend-status/:email", authenticateToken, async (req, res) => {
  const currentUserId = req.user.userId;
  const targetEmail = req.params.email;

  let connection;
  try {
    connection = await pool.getConnection();

    // Find target user ID
    const [targetUsers] = await connection.query(
      "SELECT id FROM users WHERE email = ?",
      [targetEmail]
    );
    if (targetUsers.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const targetUserId = targetUsers[0].id;

    // If current user is viewing their own profile
    if (currentUserId === targetUserId) {
      return res.status(200).json({ status: "self" });
    }

    // Check if friendship exists
    const [friendship] = await connection.query(
      `SELECT * FROM friends 
       WHERE (user_id = ? AND friend_id = ?) 
       OR (user_id = ? AND friend_id = ?)`,
      [currentUserId, targetUserId, targetUserId, currentUserId]
    );

    if (friendship.length === 0) {
      return res.status(200).json({ status: "none" });
    }

    const relation = friendship[0];
    if (relation.status === 'accepted') {
      return res.status(200).json({ status: "friends" });
    } else if (relation.user_id === currentUserId && relation.status === 'pending') {
      return res.status(200).json({ status: "pending_sent" });
    } else if (relation.friend_id === currentUserId && relation.status === 'pending') {
      return res.status(200).json({ status: "pending_received" });
    } else {
      return res.status(200).json({ status: "none" });
    }

  } catch (error) {
    console.error("Friend status check error:", error);
    res.status(500).json({ message: "Failed to check friend status" });
  } finally {
    if (connection) await connection.release();
  }
});


// Accept friend request
app.post("/api/user/friends/accept", authenticateToken, async (req, res) => {
  const { friendEmail } = req.body;
  
  if (!friendEmail) {
    return res.status(400).json({ message: "Friend email is required" });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    
    // Get friend user
    const [friendUsers] = await connection.query(
      "SELECT id FROM users WHERE email = ?",
      [friendEmail]
    );
    
    if (friendUsers.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const friendId = friendUsers[0].id;
    
    // Update friend status to accepted
    await connection.query(
      "UPDATE friends SET status = 'accepted' WHERE user_id = ? AND friend_id = ?",
      [friendId, req.user.userId]
    );

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.error("Accept friend error:", error);
    res.status(500).json({ message: "Failed to accept friend request" });
  } finally {
    if (connection) await connection.release();
  }
});

// Decline friend request
app.post("/api/user/friends/decline", authenticateToken, async (req, res) => {
  const { friendEmail } = req.body;
  
  if (!friendEmail) {
    return res.status(400).json({ message: "Friend email is required" });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    
    // Get friend user
    const [friendUsers] = await connection.query(
      "SELECT id FROM users WHERE email = ?",
      [friendEmail]
    );
    
    if (friendUsers.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const friendId = friendUsers[0].id;
    
    // Check if there's a pending request from this user
    const [existing] = await connection.query(
      "SELECT id FROM friends WHERE user_id = ? AND friend_id = ? AND status = 'pending'",
      [friendId, req.user.userId]
    );
    
    if (existing.length === 0) {
      return res.status(400).json({ message: "No pending friend request from this user" });
    }

    // Delete the friend request
    await connection.query(
      "DELETE FROM friends WHERE user_id = ? AND friend_id = ?",
      [friendId, req.user.userId]
    );
    
    res.status(200).json({ message: "Friend request declined" });
  } catch (error) {
    console.error("Decline friend error:", error);
    res.status(500).json({ message: "Failed to decline friend request" });
  } finally {
    if (connection) await connection.release();
  }
});

// Remove friend connection
// Update the friends/remove endpoint to return the new count
app.post("/api/user/friends/remove", authenticateToken, async (req, res) => {
  const { friendEmail } = req.body;
  
  if (!friendEmail) {
    return res.status(400).json({ message: "Friend email is required" });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    
    const [friendUsers] = await connection.query(
      "SELECT id FROM users WHERE email = ?",
      [friendEmail]
    );
    
    if (friendUsers.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const friendId = friendUsers[0].id;
    
    await connection.query(
      "DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
      [req.user.userId, friendId, friendId, req.user.userId]
    );
    
    res.status(200).json({ message: "Friend removed" });
  } catch (error) {
    console.error("Remove friend error:", error);
    res.status(500).json({ message: "Failed to remove friend" });
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
      "POST /api/register",
      "POST /api/verify-otp",
      "POST /api/login",
      "GET /api/user",
      "PUT /api/user",
      "GET /api/job-posts",
      "POST /api/job-posts",
      "DELETE /api/job-posts/:id"
    ]
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${process.env.DB_NAME || 'job_tracker'}`);
  console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
});
