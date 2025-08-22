// components/Chat/FileUpload.jsx
import React, { useCallback, useState } from 'react';
import { FaTimes, FaUpload, FaImage, FaSpinner, FaFile } from 'react-icons/fa';
import './FileUpload.scss';

const FileUpload = ({ onFileUpload, onImageUpload, onClose, isUploading = false }) => {
  const [dragOver, setDragOver] = useState(false);

  const validateFile = (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'application/zip', 'application/x-rar-compressed'
    ];

    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      alert('File type not allowed');
      return false;
    }

    return true;
  };

  const handleFileSelect = useCallback((event, type) => {
    const file = event.target.files[0];
    if (!file || isUploading) return;

    if (!validateFile(file)) return;

    if (type === 'image') {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      onImageUpload(file);
    } else {
      onFileUpload(file);
    }
    
    // Reset input
    event.target.value = '';
  }, [onFileUpload, onImageUpload, isUploading]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e, type) => {
    e.preventDefault();
    setDragOver(false);
    
    if (isUploading) return;
    
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!validateFile(file)) return;

    if (type === 'image' && !file.type.startsWith('image/')) {
      alert('Please drop a valid image file');
      return;
    }

    if (type === 'image') {
      onImageUpload(file);
    } else {
      onFileUpload(file);
    }
  }, [onFileUpload, onImageUpload, isUploading]);

  return (
    <div className="file-upload">
      <div className="upload-header">
        <h4>Upload File</h4>
        <button className="close-btn" onClick={onClose} disabled={isUploading}>
          <FaTimes />
        </button>
      </div>

      {isUploading && (
        <div className="upload-loading">
          <FaSpinner className="spinner" />
          <p>Uploading file...</p>
        </div>
      )}

      <div className="upload-options">
        <div 
          className={`upload-option ${isUploading ? 'disabled' : ''} ${dragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'file')}
        >
          <div className="upload-icon">
            <FaFile />
          </div>
          <h5>Upload File</h5>
          <p>Drag and drop a file here or click to browse</p>
          <input
            type="file"
            onChange={(e) => handleFileSelect(e, 'file')}
            accept=".pdf,.doc,.docx,.txt,.zip,.rar"
            style={{ display: 'none' }}
            id="file-input"
            disabled={isUploading}
          />
          <label htmlFor="file-input" className={`upload-btn ${isUploading ? 'disabled' : ''}`}>
            {isUploading ? 'Uploading...' : 'Choose File'}
          </label>
        </div>

        <div 
          className={`upload-option ${isUploading ? 'disabled' : ''} ${dragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'image')}
        >
          <div className="upload-icon">
            <FaImage />
          </div>
          <h5>Upload Image</h5>
          <p>Drag and drop an image here or click to browse</p>
          <input
            type="file"
            onChange={(e) => handleFileSelect(e, 'image')}
            accept="image/*"
            style={{ display: 'none' }}
            id="image-input"
            disabled={isUploading}
          />
          <label htmlFor="image-input" className={`upload-btn ${isUploading ? 'disabled' : ''}`}>
            {isUploading ? 'Uploading...' : 'Choose Image'}
          </label>
        </div>
      </div>

      <div className="upload-info">
        <p>Maximum file size: 10MB</p>
        <p>Supported formats: PDF, DOC, DOCX, TXT, ZIP, RAR, Images (JPG, PNG, GIF, WebP)</p>
        {isUploading && <p className="uploading-note">Please wait while your file is being uploaded...</p>}
      </div>
    </div>
  );
};

export default FileUpload;
