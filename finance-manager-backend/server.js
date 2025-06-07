// finance-manager-backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./models');

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

db.sequelize.sync()
  .then(() => console.log("Database synced successfully."))
  .catch((err) => console.error("Failed to sync database: " + err.message));

app.get('/', (req, res) => res.json({ message: 'Finance Manager API is ALIVE!' }));

// API Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes'); // For profile
const budgetRoutes = require('./routes/budgetRoutes');
const loanRoutes = require('./routes/loanRoutes');
const emiRoutes = require('./routes/emiRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/emis', emiRoutes);

// Global Error Handler (basic)
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR HANDLER:", err.stack);
  res.status(err.status || 500).json({
    error: { message: err.message || 'Something went wrong!' }
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}.`);
  console.log(`Frontend expected at: ${corsOptions.origin}`);
});