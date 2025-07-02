const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { validateApiKey, validateAdminApiKey, uploadPolicyPDF } = require('../controllers/policyUpload.controller');

const router = express.Router();

// === Multer Configuration for File Upload ===
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/coverzy/');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
            console.log(` Created upload directory: ${uploadPath}`);
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: policyId_timestamp.extension
        const policyId = req.body.policy_id ? req.body.policy_id.replace(/[^a-zA-Z0-9_-]/g, '') : 'unknown';
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        const uniqueName = `${policyId}_${timestamp}${extension}`;
        
        console.log(`📝 Generated filename: ${uniqueName}`);
        cb(null, uniqueName);
    }
});

// File filter for security
const fileFilter = (req, file, cb) => {
    console.log(`🔍 Checking file: ${file.originalname} (${file.mimetype})`);
    
    // Allow PDF and common document formats
    const allowedTypes = /pdf|doc|docx|txt/;
    const allowedMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ];
    
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimes.includes(file.mimetype);

    if (mimetype && extname) {
        console.log(`✅ File accepted: ${file.originalname}`);
        return cb(null, true);
    } else {
        console.log(`❌ File rejected: ${file.originalname} (invalid type)`);
        cb(new Error('Only PDF and document files are allowed! Supported formats: .pdf, .doc, .docx, .txt'));
    }
};

// Multer upload configuration
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1 // Only one file at a time
    }
});

// === ROUTES ===

// Main upload endpoint
router.post('/upload-policy-pdf', validateApiKey, upload.single('file'), uploadPolicyPDF);

// Get list of uploaded files
router.get('/list-pdfs', validateAdminApiKey, (req, res) => {
    try {
        const uploadsDir = path.join(__dirname, '../uploads/coverzy/');
        
        // Check if directory exists
        if (!fs.existsSync(uploadsDir)) {
            return res.json({
                success: true,
                message: "No uploads directory found",
                data: {
                    files: [],
                    count: 0,
                    total_size_mb: "0.00"
                }
            });
        }

        // Read directory contents
        const files = fs.readdirSync(uploadsDir);
        
        // Filter and process files
        const pdfFiles = files
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.pdf', '.doc', '.docx', '.txt'].includes(ext);
            })
            .map(file => {
                const filePath = path.join(uploadsDir, file);
                const stats = fs.statSync(filePath);
                
                // Extract policy ID from filename (format: policyId_timestamp.ext)
                const policyId = file.split('_')[0];
                
                return {
                    filename: file,
                    policy_id: policyId,
                    file_size: stats.size,
                    file_size_mb: (stats.size / (1024 * 1024)).toFixed(2),
                    upload_date: stats.birthtime,
                    modified_date: stats.mtime,
                    file_type: path.extname(file).toLowerCase(),
                    download_url: `/uploads/coverzy/${file}`
                };
            })
            .sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date)); // Newest first

        const totalSizeMB = pdfFiles.reduce((total, file) => total + parseFloat(file.file_size_mb), 0);

        res.json({
            success: true,
            message: "Files retrieved successfully",
            data: {
                files: pdfFiles,
                count: pdfFiles.length,
                total_size_mb: totalSizeMB.toFixed(2)
            }
        });

    } catch (error) {
        console.error('❌ Error listing files:', error);
        res.status(500).json({
            success: false,
            error: "Failed to retrieve file list",
            details: error.message
        });
    }
});

// Get specific file information
router.get('/pdf-info/:filename', validateAdminApiKey, (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../uploads/coverzy/', filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: "File not found",
                filename: filename
            });
        }

        const stats = fs.statSync(filePath);
        const policyId = filename.split('_')[0];
        
        res.json({
            success: true,
            message: "File information retrieved successfully",
            data: {
                filename: filename,
                policy_id: policyId,
                file_size: stats.size,
                file_size_mb: (stats.size / (1024 * 1024)).toFixed(2),
                upload_date: stats.birthtime,
                modified_date: stats.mtime,
                file_type: path.extname(filename).toLowerCase(),
                download_url: `/uploads/coverzy/${filename}`,
                file_exists: true
            }
        });

    } catch (error) {
        console.error('❌ Error getting file info:', error);
        res.status(500).json({
            success: false,
            error: "Failed to get file information",
            details: error.message
        });
    }
});

// Download specific file by policy ID
router.get('/download-pdf/:policy_id', validateAdminApiKey, (req, res) => {
    try {
        const { policy_id } = req.params;
        
        if (!policy_id || policy_id.trim() === '') {
            return res.status(400).json({
                success: false,
                error: "Policy ID is required",
                hint: "Provide 'policy_id' as a URL parameter"
            });
        }
        
        const policyId = policy_id.trim();
        const uploadsDir = path.join(__dirname, '../uploads/coverzy/');
        
        if (!fs.existsSync(uploadsDir)) {
            return res.status(404).json({
                success: false,
                error: "No uploads directory found",
                policy_id: policyId
            });
        }

        // Find files with matching policy ID
        const files = fs.readdirSync(uploadsDir);
        const matchingFiles = files.filter(file => {
            const filePolicyId = file.split('_')[0];
            return filePolicyId === policyId;
        });

        if (matchingFiles.length === 0) {
            return res.status(404).json({
                success: false,
                error: "No file found for this policy ID",
                policy_id: policyId
            });
        }

        // Get the most recent file (highest timestamp)
        const latestFile = matchingFiles.sort((a, b) => {
            const timestampA = parseInt(a.split('_')[1]);
            const timestampB = parseInt(b.split('_')[1]);
            return timestampB - timestampA;
        })[0];

        const filePath = path.join(uploadsDir, latestFile);
        const stats = fs.statSync(filePath);
        
        console.log(`📥 Download requested for Policy ID: ${policyId}, File: ${latestFile}`);
        
        // Set download headers
        res.setHeader('Content-Disposition', `attachment; filename="${latestFile}"`);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Cache-Control', 'no-cache');
        
        // Log download activity
        console.log(`✅ File downloaded: ${latestFile} for Policy ${policyId} (${(stats.size / 1024).toFixed(2)} KB)`);
        
        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
        fileStream.on('error', (error) => {
            console.error(`❌ Error streaming file ${latestFile}:`, error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    error: "Error downloading file",
                    details: error.message
                });
            }
        });

    } catch (error) {
        console.error('❌ Error downloading file:', error);
        res.status(500).json({
            success: false,
            error: "Failed to download file",
            details: error.message
        });
    }
});

// Delete specific file
router.delete('/delete-pdf/:filename', validateAdminApiKey, (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../uploads/coverzy/', filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: "File not found",
                filename: filename
            });
        }

        fs.unlinkSync(filePath);
        console.log(`🗑️ File deleted: ${filename}`);
        
        res.json({
            success: true,
            message: "File deleted successfully",
            filename: filename
        });

    } catch (error) {
        console.error('❌ Error deleting file:', error);
        res.status(500).json({
            success: false,
            error: "Failed to delete file",
            details: error.message
        });
    }
});

// Health check for upload service
router.get('/upload-status', validateAdminApiKey, (req, res) => {
    const uploadsDir = path.join(__dirname, '../uploads/coverzy/');
    const dirExists = fs.existsSync(uploadsDir);
    
    res.json({
        success: true,
        message: "PDF Upload service is running",
        data: {
            service_status: "active",
            timestamp: new Date().toISOString(),
            upload_directory: uploadsDir,
            directory_exists: dirExists,
            max_file_size: "10MB",
            allowed_types: [".pdf", ".doc", ".docx", ".txt"],
            api_version: "1.0.0"
        }
    });
});

// // API documentation endpoint
// router.get('/docs', validateAdminApiKey, (req, res) => {
//     res.json({
//         success: true,
//         message: "LexCoverzy PDF Upload API Documentation",
//         endpoints: {
//             "POST /api/upload-policy-pdf": {
//                 description: "Upload a PDF file and notify external API",
//                 headers: { "x-api-key": "Required - Upload API Key" },
//                 body: {
//                     "file": "PDF file (multipart/form-data)",
//                     "policy_id": "Unique policy identifier"
//                 },
//                 notes: "Automatically sends email notification and notifies external API with download URL"
//             },
//             "GET /api/list-pdfs": {
//                 description: "Get list of all uploaded files",
//                 headers: { "x-api-key": "Required - Admin API Key Value" }
//             },
//             "GET /api/pdf-info/:filename": {
//                 description: "Get information about a specific file",
//                 headers: { "x-api-key": "Required - Admin API Key Value" }
//             },
//             "POST /api/download-pdf": {
//                 description: "Download the latest PDF file for a specific policy ID",
//                 headers: { "x-api-key": "Required - Admin API Key Value" },
//                 body: {
//                     "policy_id": "Policy identifier (e.g., POL123)"
//                 },
//                 response: "Binary PDF file download"
//             },
//             "GET /api/download-pdf/:policy_id": {
//                 description: "Download PDF by policy ID (legacy GET method)",
//                 headers: { "x-api-key": "Required - Admin API Key Value" },
//                 response: "Binary PDF file download"
//             },
//             "DELETE /api/delete-pdf/:filename": {
//                 description: "Delete a specific file",
//                 headers: { "x-api-key": "Required - Admin API Key Value" }
//             },
//             "GET /api/upload-status": {
//                 description: "Check service health and configuration",
//                 headers: { "x-api-key": "Required - Admin API Key Value" }
//             },
//             "GET /api/docs": {
//                 description: "API documentation",
//                 headers: { "x-api-key": "Required - Admin API Key Value" }
//             }
//         },
//         security: {
//             "note": "Both upload and admin operations use x-api-key header with different values",
//             "upload_operations": "x-api-key: [Upload Key Value] - For PDF upload",
//             "admin_operations": "x-api-key: [Admin Key Value] - For management operations"
//         },
//         external_integration: {
//             "description": "After successful upload, the system notifies an external API",
//             "environment_variables": {
//                 "PDF_UPLOAD_LEX_API": "External API endpoint URL (required)",
//                 "PDF_UPLOAD_LEX_API_KEY": "Authorization token for external API (optional)"
//             },
//             "payload": {
//                 "policy_id": "The uploaded policy ID",
//                 "url": "Production download URL in format: https://lexcoverzy.upload.lexship.biz/api/download-pdf/{policy_id}"
//             }
//         }
//     });
// });

module.exports = router; 