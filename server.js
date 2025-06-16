const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const userRoutes = require('./routes/userRoutes');
const notesRoutes = require('./routes/notes');

// Routes
app.use('/api/users', userRoutes);
app.use('/api/notes', notesRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to the Note App API');
});

// Error handling middleware (after routes)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Connect to DB and start server
const startServer = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
};

startServer();
