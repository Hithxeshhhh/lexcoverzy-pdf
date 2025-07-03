import lexshipLogo from "../assets/lexship.png";
import { useState } from "react";

function App() {
  const [policyId, setPolicyId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Dynamic URL selection based on environment
  let url = '';
  if (import.meta.env.VITE_ENV === 'prod') url = import.meta.env.VITE_API_BASE_URL_PROD;
  else if (import.meta.env.VITE_ENV === 'dev') url = import.meta.env.VITE_BACKEND_DEV;
  else url = import.meta.env.VITE_API_BASE_URL_LOCAL;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setUploadStatus("");
    } else {
      setUploadStatus("Please select a valid PDF file");
      setSelectedFile(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        setSelectedFile(file);
        setUploadStatus("");
      } else {
        setUploadStatus("Please select a valid PDF file");
        setSelectedFile(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!policyId.trim()) {
      setUploadStatus("Please enter a Policy ID");
      return;
    }
    
    if (!selectedFile) {
      setUploadStatus("Please select a PDF file");
      return;
    }

    setIsUploading(true);
    setUploadStatus("Uploading...");

    try {
      const formData = new FormData();
      formData.append("policy_id", policyId.trim());
      formData.append("file", selectedFile);
      

      const response = await fetch(`${url}/api/upload-policy-pdf`, {
        method: "POST",
        headers: {
          "x-api-key": import.meta.env.VITE_UPLOAD_API,
        },
        body: formData,
      });

      const result = await response.json();
      console.log(result);
      if (response.ok) {
        setUploadStatus("✅ File uploaded successfully!");
        setPolicyId("");
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
      } else {
        setUploadStatus(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      setUploadStatus(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadStatus("");
    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-4 p-2">
            <img 
              src={lexshipLogo} 
              alt="Lexship Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Policy Document Upload</h1>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          <div className="p-8 space-y-8">
            {/* Policy ID Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Policy ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={policyId}
                  onChange={(e) => setPolicyId(e.target.value)}
                  placeholder="Enter Policy ID"
                  className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* File Upload Area */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                PDF Document
              </label>
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  dragActive
                    ? "border-blue-500 bg-blue-50/50"
                    : selectedFile
                    ? "border-green-300 bg-green-50/50"
                    : "border-gray-300 bg-gray-50/50 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required
                />
                
                {selectedFile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-full hover:bg-red-100 transition-colors"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        Drop your PDF here or <span className="text-blue-600">browse</span>
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Supports PDF files up to 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status Message */}
            {uploadStatus && (
              <div className={`flex items-center p-4 rounded-xl ${
                uploadStatus.includes("✅") 
                  ? "bg-green-50 text-green-800 border border-green-200" 
                  : uploadStatus.includes("❌") 
                  ? "bg-red-50 text-red-800 border border-red-200" 
                  : "bg-blue-50 text-blue-800 border border-blue-200"
              }`}>
                {uploadStatus.includes("✅ File uploaded successfully!") && (
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {uploadStatus.includes("❌") && (
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {!uploadStatus.includes("✅") && !uploadStatus.includes("❌") && (
                  <svg className="w-5 h-5 mr-2 flex-shrink-0 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                <span className="font-medium">{uploadStatus}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isUploading || !policyId.trim() || !selectedFile}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 ${
                isUploading || !policyId.trim() || !selectedFile
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              }`}
            >
              {isUploading ? (
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Uploading...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Document
                </div>
              )}
            </button>
          </div>

          {/* Guidelines */}
          <div className="px-8 pb-8">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Upload Guidelines
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  PDF files only
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Max 10MB size
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 