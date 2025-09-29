const express = require("express")
const { body, validationResult } = require("express-validator")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const { auth } = require("../middleware/auth")
const fetch = global.fetch

const router = express.Router()

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" })
}

// Helper functions for Google OAuth
function buildGoogleAuthURL() {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

async function exchangeCodeForTokens(code) {
  const params = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    grant_type: "authorization_code",
  })

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Failed to exchange code: ${err}`)
  }

  return response.json()
}

async function fetchGoogleUser(accessToken) {
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed fetching Google user: ${err}`)
  }
  return res.json()
}

function slugifyUsername(base) {
  return base
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24)
}

async function ensureUniqueUsername(base) {
  let candidate = slugifyUsername(base || "user")
  if (!candidate) candidate = "user"
  let tries = 0
  while (await User.findOne({ username: candidate })) {
    tries += 1
    const suffix = Math.random().toString(36).slice(2, 6)
    candidate = slugifyUsername(`${base}_${suffix}`)
    if (tries > 20) {
      candidate = `user_${Date.now().toString(36)}`
      break
    }
  }
  return candidate
}

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  "/register",
  [
    body("username")
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be between 3 and 30 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage("Username can only contain letters, numbers, and underscores"),
    body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { username, email, password } = req.body

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      })

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: existingUser.email === email ? "Email already registered" : "Username already taken",
        })
      }

      // Create new user
      const user = new User({
        username,
        email,
        password,
      })

      await user.save()

      // Generate token
      const token = generateToken(user._id)

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
          },
        },
      })
    } catch (error) {
      console.error("Register error:", error)
      res.status(500).json({
        success: false,
        message: "Server error during registration",
      })
    }
  },
)

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { email, password } = req.body

      // Find user by email
      const user = await User.findOne({ email }).select("+password")
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        })
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Account is deactivated",
        })
      }

      // Check password
      const isMatch = await user.comparePassword(password)
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        })
      }

      // Update last login
      user.lastLogin = new Date()
      await user.save()

      // Generate token
      const token = generateToken(user._id)

      res.json({
        success: true,
        message: "Login successful",
        data: {
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            lastLogin: user.lastLogin,
          },
        },
      })
    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({
        success: false,
        message: "Server error during login",
      })
    }
  },
)

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          username: req.user.username,
          email: req.user.email,
          role: req.user.role,
          lastLogin: req.user.lastLogin,
          createdAt: req.user.createdAt,
        },
      },
    })
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching user data",
    })
  }
})

// @route   GET /api/auth/dashboard
// @desc    Get dashboard data (protected route)
// @access  Private
router.get("/dashboard", auth, async (req, res) => {
  try {
    const Server = require("../models/Server")

    // Get user's server count and stats
    const serverCount = await Server.countDocuments({ owner: req.user._id })
    const runningServers = await Server.countDocuments({
      owner: req.user._id,
      status: "running",
    })

    res.json({
      success: true,
      message: "Dashboard data retrieved successfully",
      data: {
        user: {
          id: req.user._id,
          username: req.user.username,
          email: req.user.email,
          role: req.user.role,
          memberSince: req.user.createdAt,
        },
        stats: {
          totalServers: serverCount,
          runningServers: runningServers,
          stoppedServers: serverCount - runningServers,
        },
      },
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching dashboard data",
    })
  }
})

// @route   GET /api/auth/google
// @desc    Start Google OAuth flow
// @access  Public
router.get("/google", (req, res) => {
  try {
    const authURL = buildGoogleAuthURL()
    return res.redirect(authURL)
  } catch (error) {
    console.error("Google OAuth init error:", error)
    return res.status(500).json({ success: false, message: "Failed to start Google OAuth" })
  }
})

// @route   GET /api/auth/google/callback
// @desc    Handle Google's callback, create/find user, issue JWT, redirect to frontend
// @access  Public
router.get("/google/callback", async (req, res) => {
  const { code } = req.query
  if (!code) {
    return res.status(400).json({ success: false, message: "Missing authorization code" })
  }

  try {
    const tokenSet = await exchangeCodeForTokens(code)
    const googleUser = await fetchGoogleUser(tokenSet.access_token)

    // googleUser contains: sub (googleId), email, name, picture, etc.
    const googleId = googleUser.sub
    const email = (googleUser.email || "").toLowerCase()
    const name = googleUser.name || email.split("@")[0]

    // Try to find user by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email }] })

    if (!user) {
      // Create a new user; generate username and random password fallback
      const username = await ensureUniqueUsername(name || email.split("@")[0])
      const randomPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)

      user = new User({
        username,
        email,
        googleId,
        // password is conditionally required; when googleId present it won't be required
        // but we still set a random password to support future password login if needed
        password: randomPassword,
        isActive: true,
      })
      await user.save()
    } else {
      // Update last login and googleId if missing
      user.googleId = user.googleId || googleId
      user.lastLogin = new Date()
      await user.save()
    }

    const jwtToken = generateToken(user._id)

    // Redirect to frontend handler which will persist token & user then route to dashboard
    const clientURL = process.env.CLIENT_URL || "http://localhost:3000"
    const redirectURL = `${clientURL}/auth/google/callback?token=${encodeURIComponent(jwtToken)}`
    return res.redirect(redirectURL)
  } catch (error) {
    console.error("Google OAuth callback error:", error)
    const clientURL = process.env.CLIENT_URL || "http://localhost:3000"
    return res.redirect(`${clientURL}/login?error=google_oauth_failed`)
  }
})

module.exports = router
