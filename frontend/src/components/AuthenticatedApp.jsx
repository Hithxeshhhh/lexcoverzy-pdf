import lexshipLogo from "../../assets/lexship.png";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

function AuthenticatedApp() {
  const [policyId, setPolicyId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const { user, logout, authenticatedFetch, apiUrl } = useAuth();

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

      const response = await authenticatedFetch(`${apiUrl}/api/upload-policy-pdf`, {
        method: "POST",
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

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with User Info and Logout */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-4 p-2">
            <img 
              src={lexshipLogo} 
              alt="Lexship Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Policy Document Upload</h1>
          
          {/* User Info Bar */}
          <div className="inline-flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 px-6 py-3 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">Welcome, {user?.username}</p>
                <p className="text-xs text-gray-500">Admin Access</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
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
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-base font-medium text-gray-900">Choose a PDF file</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Drag and drop or click to browse
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status Message */}
            {uploadStatus && (
              <div className={`p-4 rounded-xl ${
                uploadStatus.includes("✅") || uploadStatus.includes("success")
                  ? "bg-green-50 border border-green-200"
                  : uploadStatus.includes("Error") || uploadStatus.includes("failed")
                  ? "bg-red-50 border border-red-200"
                  : "bg-blue-50 border border-blue-200"
              }`}>
                <p className={`text-sm font-medium ${
                  uploadStatus.includes("✅") || uploadStatus.includes("success")
                    ? "text-green-700"
                    : uploadStatus.includes("Error") || uploadStatus.includes("failed")
                    ? "text-red-700"
                    : "text-blue-700"
                }`}>
                  {uploadStatus}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isUploading || !policyId || !selectedFile}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl disabled:shadow-md transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Upload PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthenticatedApp; 