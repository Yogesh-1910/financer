// finance-manager-backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); // Ensure path is correct
const { User } = require('../models'); // Ensure User model is correctly imported
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // File system module for deleting old files

// --- Multer Configuration for Profile Picture Uploads ---
const profilePicsStorageDir = path.join(__dirname, '..', 'uploads', 'profile-pics');

// Ensure the uploads/profile-pics directory exists
if (!fs.existsSync(profilePicsStorageDir)) {
    try {
        fs.mkdirSync(profilePicsStorageDir, { recursive: true });
        console.log(`[UserRoutes] Created profile picture directory: ${profilePicsStorageDir}`);
    } catch (err) {
        console.error(`[UserRoutes] Error creating profile picture directory: ${err}`);
        // Decide if you want to throw error and stop server, or log and continue
    }
} else {
    console.log(`[UserRoutes] Profile picture uploads directory already exists: ${profilePicsStorageDir}`);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, profilePicsStorageDir); // Save files to 'uploads/profile-pics/'
  },
  filename: function (req, file, cb) {
    // Create a unique filename: user{userId}-timestamp-originalFilename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `user${req.user.id}-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only common image types
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif' || file.mimetype === 'image/webp') {
    cb(null, true);
  } else {
    console.log('[UserRoutes] File filter rejected file:', file.originalname, file.mimetype);
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP images are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5 MB file size limit
  },
  fileFilter: fileFilter
});

// GET /api/users/me - Get current user's profile
router.get('/me', authMiddleware, async (req, res) => {
  console.log('[UserRoutes GET /me] Attempting to fetch profile for userId:', req.user.id);
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] } // Don't send password hash
    });
    if (!user) {
      console.log('[UserRoutes GET /me] User not found for ID:', req.user.id);
      return res.status(404).json({ msg: 'User not found' });
    }
    console.log('[UserRoutes GET /me] Profile fetched successfully for userId:', req.user.id);
    res.json(user);
  } catch (err) {
    console.error('[UserRoutes GET /me] Server Error:', err.message);
    res.status(500).send('Server Error');
  }
});

// PUT /api/users/me - Update current user's text profile details
router.put('/me', authMiddleware, async (req, res) => {
  const { fullName, age, occupation, phoneNumber } = req.body;
  const userId = req.user.id;
  console.log(`[UserRoutes PUT /me] Attempting to update profile for userId: ${userId} with data:`, req.body);

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      console.log('[UserRoutes PUT /me] User not found for ID:', userId);
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update fields if they are provided in the request body
    if (fullName !== undefined) user.fullName = fullName.trim();
    if (age !== undefined) user.age = (age === '' || age === null) ? null : parseInt(age);
    if (occupation !== undefined) user.occupation = occupation.trim();
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber.trim();
    // Do not update password here, that should be a separate, more secure route

    await user.save();
    console.log('[UserRoutes PUT /me] Profile text fields updated successfully for userId:', userId);
    
    const { password, ...userWithoutPassword } = user.get({ plain: true });
    res.json(userWithoutPassword);
  } catch (err) {
    console.error('[UserRoutes PUT /me] Profile Update Error:', err.name, err.message);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ msg: 'Phone number may already be in use by another account.' });
    }
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ msg: 'Validation failed', details: err.errors.map(e => e.message) });
    }
    res.status(500).json({ msg: 'Server error during profile update.', error: err.message });
  }
});

// POST /api/users/me/profile-pic - Upload/Update profile picture
router.post('/me/profile-pic', authMiddleware, (req, res, next) => {
    // Call multer middleware first
    upload.single('profilePic')(req, res, async (err) => {
        if (err) { // Handle multer errors specifically
            if (err instanceof multer.MulterError) {
                console.error("[UserRoutes POST /me/profile-pic] MulterError:", err.message);
                return res.status(400).json({ msg: `File upload error: ${err.message}. Max 5MB. Allowed types: JPG, PNG, GIF, WEBP.` });
            } else if (err) { // Handle errors from fileFilter
                console.error("[UserRoutes POST /me/profile-pic] FileFilter/Unknown Upload Error from Multer stage:", err.message);
                return res.status(400).json({ msg: err.message || "Invalid file type or other upload issue." });
            }
        }

        // If multer processing is fine, or no file was part of this specific error type handling
        console.log('[UserRoutes POST /me/profile-pic] File received by multer:', req.file);
        if (!req.file) {
            // This case might be hit if fileFilter passed but something else went wrong before req.file is set,
            // or if no file was sent with the expected field name.
            console.log('[UserRoutes POST /me/profile-pic] No file uploaded with field name "profilePic".');
            return res.status(400).json({ msg: 'No file uploaded or file type not allowed by filter.' });
        }

        try {
            const user = await User.findByPk(req.user.id);
            if (!user) {
                // Should not happen if authMiddleware works, but good check
                console.log('[UserRoutes POST /me/profile-pic] User not found for ID:', req.user.id);
                // Clean up uploaded file if user not found
                if (req.file && req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                return res.status(404).json({ msg: 'User not found.' });
            }

            // Delete old profile picture if it exists
            if (user.profilePicUrl) {
                // Construct absolute path from relative path stored in DB
                const oldPicAbsolutePath = path.join(__dirname, '..', user.profilePicUrl);
                if (fs.existsSync(oldPicAbsolutePath)) {
                    try {
                        fs.unlinkSync(oldPicAbsolutePath);
                        console.log('[UserRoutes POST /me/profile-pic] Deleted old profile pic:', oldPicAbsolutePath);
                    } catch (unlinkErr) {
                        console.error('[UserRoutes POST /me/profile-pic] Error deleting old profile pic:', unlinkErr);
                        // Log error but continue, as main goal is to save new pic
                    }
                }
            }
            
            // Path to be stored in DB should be relative to the server's static serving root for 'uploads'
            // e.g., if server serves 'uploads/' as '/uploads', then store '/profile-pics/filename.jpg'
            const relativeFilePath = `/uploads/profile-pics/${req.file.filename}`;
            user.profilePicUrl = relativeFilePath;
            await user.save();

            console.log('[UserRoutes POST /me/profile-pic] Profile pic URL saved to DB:', relativeFilePath, 'for userId:', req.user.id);
            const { password, ...userWithoutPassword } = user.get({ plain: true });
            res.json(userWithoutPassword); // Send back updated user profile

        } catch (dbError) {
            console.error('[UserRoutes POST /me/profile-pic] Database or FS error after file upload:', dbError);
            // If error occurred after file was uploaded by multer, try to delete the new file
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                try {
                    fs.unlinkSync(req.file.path);
                    console.log('[UserRoutes POST /me/profile-pic] Cleaned up uploaded file due to error:', req.file.path);
                } catch (cleanupErr) {
                    console.error('[UserRoutes POST /me/profile-pic] Error cleaning up file after DB error:', cleanupErr);
                }
            }
            res.status(500).json({ msg: 'Server error during profile picture processing.' });
        }
    });
});

module.exports = router;