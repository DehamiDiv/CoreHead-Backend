require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allow cross-origin requests (e.g., from Frontend)
app.use(express.json()); // Parse incoming JSON data

// Basic Route (For Testing)
app.get('/', (req, res) => {
  res.send('Corehead Backend Server is Running!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
