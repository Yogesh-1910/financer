// finance-manager-backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path'); // Ensure path module is required
const db = require('./models');

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Serve Static Files (Profile Pictures) ---
// This makes files in the 'uploads' directory accessible via a URL path
// e.g., http://localhost:5001/uploads/profile-pics/filename.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log(`Serving static files for /uploads from: ${path.join(__dirname, 'uploads')}`);

db.sequelize.sync()
  .then(() => console.log("Database synced successfully."))
  .catch((err) => console.error("Failed to sync database: " + err.message));

app.get('/', (req, res) => res.json({ message: 'Finance Manager API is ready!' }));

// API Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes'); // Mounted here
const budgetRoutes = require('./routes/budgetRoutes');
const loanRoutes = require('./routes/loanRoutes');
const emiRoutes = require('./routes/emiRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // Handles /api/users/me and /api/users/me/profile-pic
app.use('/api/budget', budgetRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/emis', emiRoutes);

app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR HANDLER (server.js):", err.name, err.message, err.stack);
  res.status(err.status || 500).json({
    error: { message: err.message || 'An unexpected server error occurred.' }
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}.`);
  console.log(`Frontend expected at: ${corsOptions.origin}`);
});