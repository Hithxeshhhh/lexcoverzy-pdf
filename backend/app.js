require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');
const pdfUploadRoutes = require('./routes/pdfUpload.routes');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', pdfUploadRoutes);

// Basic health check
app.get('/', (req, res) => {
    res.json({ 
        message: 'LexCoverzy PDF Upload Backend is running!',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            error: 'File too large. Maximum size is 10MB.'
        });
    }
    
    if (error.message && error.message.includes('Only PDF and document files are allowed')) {
        return res.status(400).json({
            error: error.message
        });
    }
    
    res.status(500).json({
        error: 'Something went wrong!',
        details: error.message
    });
});

// Start server based on environment
if (process.env.NODE_ENV === "local") {
  const server = http.createServer(app);
  server.listen(port, () => {
    console.log(`Server running on ${port}...`);
  });
} else {
  let keyPath = process.env.KEY_DEV;
  let certPath = process.env.CERT_DEV;
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
  const server = https.createServer(options, app);
  server.listen(port, () => {
    console.log(`Server running on ${port}...`);
  });
}

module.exports = app; 