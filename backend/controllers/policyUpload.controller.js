const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const emailData = require('../utils/data');
const dotenv = require('dotenv');

dotenv.config();

// === Configuration ===
const EXPECTED_API_KEY = process.env.X_API_KEY;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const UPLOAD_DIR = path.join(__dirname, '../uploads/coverzy');
const EMAIL_RECIPIENTS = emailData.email;

// === Email Configuration ===
const createEmailTransporter = () => {
    // Debug environment variables
    console.log('Environment Check:');
    console.log('   Gmail User:', process.env.GMAIL_USER ? 'SET' : 'NOT SET');
    console.log('   Gmail App Password:', process.env.GMAIL_APP_PASSWORD ? `SET (${process.env.GMAIL_APP_PASSWORD.length} chars)` : 'NOT SET');
    
    const gmailConfig = {
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        }
    };

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.log('Warning: Gmail credentials not found in environment variables');
        console.log('   Make sure your .env file contains:');
        console.log('   GMAIL_USER=your-email@gmail.com');
        console.log('   GMAIL_APP_PASSWORD=your-16-character-app-password');
    }

    return nodemailer.createTransport(gmailConfig);
};

// === Email Sending Function ===
const sendUploadNotification = async (fileName, policyId, filePath) => {
    try {
        console.log(`Sending email notification with attachment for file: ${fileName}`);
        
        const transporter = createEmailTransporter();
        
        // Check if file exists before attaching
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️ Warning: File not found at ${filePath}, sending email without attachment`);
        }
        
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: EMAIL_RECIPIENTS,
            subject: `New Policy PDF Uploaded - ${policyId}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                        📄 Policy PDF Upload Notification
                    </h2>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>📋 Policy ID:</strong> <code>${policyId}</code></p>
                        <p><strong>📁 File Name:</strong> <code>${fileName}</code></p>
                        <p><strong>⏰ Upload Time:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    
                    <div style="background-color: #d4edda; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
                        <p style="margin: 0; color: #155724;">
                            ✅ The PDF file has been successfully uploaded to the server and is attached to this email.
                        </p>
                    </div>
                    
                    <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
                        <p style="margin: 0; color: #856404;">
                            📎 <strong>Attachment:</strong> Please find the uploaded PDF file attached to this email.
                        </p>
                    </div>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
                    
                    <p style="color: #6c757d; font-size: 12px; text-align: center;">
                        This is an automated notification from LexCoverzy PDF Upload System
                    </p>
                </div>
            `,
            attachments: [
                {
                    filename: fileName,
                    path: filePath,
                    contentType: 'application/pdf'
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully! Message ID: ${info.messageId}`);
        return true;
        
    } catch (error) {
        console.error('Failed to send email:', error.message);
        
        // Provide helpful error messages
        if (error.code === 'EAUTH') {
            console.log('Gmail Authentication Failed. Please check:');
            console.log('   1. Your Gmail credentials in .env file');
            console.log('   2. Make sure you\'re using an App Password (not regular password)');
            console.log('   3. 2-Factor Authentication is enabled on Gmail');
            console.log('   4. App Password format: "abcd efgh ijkl mnop" (with spaces)');
        }
        
        return false;
    }
};

// === API Key Validation Middleware ===
const validateApiKey = (req, res, next) => {
    const providedKey = req.headers['x-api-key'] || req.headers['X-API-Key'];
    
    if (providedKey !== EXPECTED_API_KEY) {
        return res.status(401).json({
            error: "Unauthorized. Invalid or missing upload API key."
        });
    }
    
    next();
};

// === Admin API Key Validation Middleware ===
const validateAdminApiKey = (req, res, next) => {
    const providedKey = req.headers['x-api-key'] || req.headers['X-API-Key'];
    
    if (!ADMIN_API_KEY) {
        return res.status(500).json({
            error: "Server configuration error. Admin API key not configured."
        });
    }
    
    if (providedKey !== ADMIN_API_KEY) {
        return res.status(401).json({
            error: "Unauthorized. Invalid or missing admin API key."
        });
    }
    
    next();
};

// === Main Upload Controller ===
const uploadPolicyPDF = async (req, res) => {
    try {
        console.log(`📤 Processing file upload...`);
        
        // Ensure upload directory exists
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
            console.log(`Created upload directory: ${UPLOAD_DIR}`);
        }

        // Validate inputs
        if (!req.body.policy_id || req.body.policy_id.trim() === '') {
            return res.status(400).json({
                error: "Missing policy_id parameter",
                hint: "Include 'policy_id' in your form data"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                error: "No file uploaded",
                hint: "Include a file with key 'file' in your form data"
            });
        }

        // Process upload
        const policyId = req.body.policy_id.replace(/[^a-zA-Z0-9_-]/g, '');
        const uniqueName = req.file.filename;
        const targetFile = req.file.path;

        console.log(`File saved: ${uniqueName}`);
        console.log(`Policy ID: ${policyId}`);
        console.log(`File path: ${targetFile}`);

        // Send email notification with PDF attachment
        const emailSent = await sendUploadNotification(uniqueName, policyId, targetFile);

        // Success response
        res.json({
            success: true,
            message: "File uploaded successfully",
            data: {
                file_name: uniqueName,
                policy_id: policyId,
                file_size: req.file.size,
                file_size_mb: (req.file.size / (1024 * 1024)).toFixed(2),
                upload_time: new Date().toISOString(),
                email_sent: emailSent,
                email_recipients: emailSent ? [EMAIL_RECIPIENTS] : []
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: "Failed to process upload",
            details: error.message
        });
    }
};

module.exports = {
    validateApiKey,
    validateAdminApiKey,
    uploadPolicyPDF
}; 