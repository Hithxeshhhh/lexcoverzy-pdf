# Policy PDF Upload Frontend

A modern React frontend for uploading policy PDF documents with a beautiful UI built using Tailwind CSS.

## Features

- 🎯 **Drag & Drop Upload**: Intuitive file upload with drag and drop support
- 📄 **PDF Validation**: Automatic validation for PDF files with size limits
- 🎨 **Beautiful UI**: Modern design with gradients and smooth animations
- 📱 **Responsive**: Works perfectly on desktop and mobile devices
- ⚡ **Real-time Feedback**: Instant status updates and error handling
- 🔒 **Secure**: API key authentication for uploads

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
# Create .env file in the frontend directory
echo "VITE_UPLOAD_API=your-actual-upload-api-key" > .env
echo "VITE_API_BASE_URL=http://localhost:3000" >> .env
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

## Build for Production

```bash
npm run build
```

## Configuration

The application uses environment variables for configuration. Create a `.env` file in the frontend directory:

```bash
VITE_UPLOAD_API=your-actual-upload-api-key
VITE_API_BASE_URL=http://localhost:3000
```

**Important:** Replace `your-actual-upload-api-key` with the actual API key from your backend's `.env` file (the `X_API_KEY` value).

## Technologies Used

- **React 18** - Frontend framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **ESLint** - Code linting

## File Structure

```
frontend/
├── public/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── package.json         # Dependencies
├── tailwind.config.js   # Tailwind configuration
├── postcss.config.js    # PostCSS configuration
└── vite.config.js       # Vite configuration
``` 