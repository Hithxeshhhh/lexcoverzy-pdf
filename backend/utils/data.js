const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// Cache for email data to avoid repeated API calls
let cachedEmail = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Function to fetch admin email from external API
const fetchAdminEmail = async () => {
    try {
        // Check if we have cached data that's still valid
        if (cachedEmail && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
            console.log(' Using cached admin email:', cachedEmail);
            return cachedEmail;
        }

        const emailApiUrl = process.env.EMAIL_LEX_API;
        const bearerToken = process.env.BEARER_TOKEN;

        if (!emailApiUrl || !bearerToken) {
            console.log('  Warning: EMAIL_LEX_API or BEARER_TOKEN not configured, using fallback email');
            return "hithesh914@gmail.com"; // Fallback email
        }

        console.log('🔗 Fetching admin email from API:', emailApiUrl);

        const response = await axios.get(emailApiUrl, {
            headers: {
                'Authorization': `Bearer ${bearerToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
        });

        if (response.data && response.data.success && response.data.data && response.data.data.length > 0) {
            const adminEmail = response.data.data[0].admin_email;
            
            if (adminEmail) {
                // Cache the email
                cachedEmail = adminEmail;
                cacheTimestamp = Date.now();
                console.log(' Admin email fetched successfully:', adminEmail);
                return adminEmail;
            }
        }

        console.log('⚠️ Warning: Invalid API response format, using fallback email');
        return "hithesh914@gmail.com"; // Fallback email

    } catch (error) {
        if (error.response) {
            console.error(` Email API request failed (${error.response.status}):`, error.response.data);
        } else if (error.request) {
            console.error(' Email API request failed: No response received');
        } else {
            console.error(' Error fetching admin email:', error.message);
        }
        
        // Return cached email if available, otherwise fallback
        if (cachedEmail) {
            console.log(' Using cached email due to API error:', cachedEmail);
            return cachedEmail;
        }
        
        console.log('📧 Using fallback email due to API error');
        return "hithesh914@gmail.com"; // Fallback email
    }
};

// Function to get email (returns a promise)
const getAdminEmail = async () => {
    return await fetchAdminEmail();
};

// Sync function to get cached email (if available)
const getCachedEmail = () => {
    return cachedEmail || "hithesh914@gmail.com";
};

// Export the functions
module.exports = {
    getAdminEmail,
    getCachedEmail,
    // For backward compatibility, provide a function that returns the email
    email: async () => await fetchAdminEmail()
};