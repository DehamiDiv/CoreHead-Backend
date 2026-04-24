require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import our custom Authentication routes
const authRoutes = require('./routes/authRoutes');
const templateRoutes = require('./routes/templateRoutes');
const previewRoutes = require('./routes/previewRoutes');
const postRoutes = require('./routes/postRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allow cross-origin requests (e.g., from Frontend)
app.use(express.json({ limit: '50mb' })); // Parse incoming JSON data with increased limit for base64 images
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Basic Route (For Testing)
app.get('/', (req, res) => {
  res.send('Corehead Backend Server is Running!');
});

// ==========================================
// REGISTER ALL API ROUTES HERE
// ==========================================
// This tells Express: "If any request starts with /api/auth, send it to authRoutes!"
app.use('/api/auth', authRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/preview', previewRoutes);
app.use('/api/posts', postRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


// Register binding-related API routes under the "/api" base path
const bindingRoutes = require("./routes/bindingRoutes");

app.use("/api", bindingRoutes);


// Register blog routes to handle layout and post endpoints under /api/blog
const blogRoutes = require('./routes/blogRoutes');
app.use('/api/blog', blogRoutes);

