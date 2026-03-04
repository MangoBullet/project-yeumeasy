const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const { sequelize } = require('./models');

const userRoutes = require('./routes/userRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const borrowRoutes = require('./routes/borrowRoutes');
const borrowDetailRoutes = require('./routes/borrowDetailRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  return res.json({ success: true, message: 'API is running' });
});

app.use('/api/users', userRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/borrows', borrowRoutes);
app.use('/api/borrow', borrowRoutes);
app.use('/api/borrow-details', borrowDetailRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((req, res) => {
  return res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.sync();
    app.listen(PORT, () => {
      console.log(`Backend server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start backend server:', error.message);
    process.exit(1);
  }
}

startServer();
