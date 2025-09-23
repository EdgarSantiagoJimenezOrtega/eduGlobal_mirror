import React, { useState, useRef, useEffect } from 'react'
import { uploadImage, uploadCourseImage, uploadModuleImage, validateImageFile, createPreviewUrl, validateImageUrl } from '../lib/storage'

const ImageUpload = ({ value, onChange, error, disabled = false, uploadFunction = 'uploadImage' }) => {
  const [uploadMode, setUploadMode] = useState('url') // 'url' or 'file'
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [urlValidating, setUrlValidating] = useState(false)
  const [urlError, setUrlError] = useState('')
  
  const fileInputRef = useRef(null)
  const dragRef = useRef(null)

  useEffect(() => {
    if (value) {
      setPreviewUrl(value)
      setUrlInput(value)
    } else {
      setPreviewUrl('')
      setUrlInput('')
    }
  }, [value])

  // Handle file selection
  const handleFileSelect = async (file) => {
    if (!file) return

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      onChange('', validation.errors[0])
      return
    }

    // Show preview immediately
    const preview = createPreviewUrl(file)
    setPreviewUrl(preview)

    // Upload file
    try {
      setUploading(true)
      setUploadProgress(0)

      // Simulate progress (since Supabase doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      // Get the appropriate upload function
      const uploadFunctionMap = {
        uploadImage,
        uploadCourseImage,
        uploadModuleImage
      }
      const uploadFunc = uploadFunctionMap[uploadFunction] || uploadImage
      
      const result = await uploadFunc(file)
      
      clearInterval(progressInterval)
      setUploadProgress(100)

      if (result.success) {
        onChange(result.url, '')
        setTimeout(() => setUploadProgress(0), 1000)
      } else {
        console.warn('Upload failed, user can still use URL input:', result.error)
        onChange('', `Upload failed: ${result.error}. You can use the URL input instead.`)
        setPreviewUrl('')
        
        // Auto-switch to URL mode if upload fails
        setTimeout(() => {
          setUploadMode('url')
        }, 3000)
      }
    } catch (err) {
      onChange('', 'Upload failed: ' + err.message)
      setPreviewUrl('')
    } finally {
      setUploading(false)
    }
  }

  // Handle URL input
  const handleUrlChange = async (url) => {
    setUrlInput(url)
    setUrlError('')
    
    if (!url.trim()) {
      onChange('', '')
      setPreviewUrl('')
      return
    }

    setUrlValidating(true)
    
    try {
      const validation = await validateImageUrl(url)
      
      if (validation.isValid) {
        onChange(url, '')
        setPreviewUrl(url)
      } else {
        setUrlError(validation.error)
        onChange('', validation.error)
        setPreviewUrl('')
      }
    } catch (err) {
      setUrlError('Failed to validate URL')
      onChange('', 'Failed to validate URL')
      setPreviewUrl('')
    } finally {
      setUrlValidating(false)
    }
  }

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!dragRef.current?.contains(e.relatedTarget)) {
      setDragActive(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (imageFile) {
      setUploadMode('file')
      handleFileSelect(imageFile)
    }
  }

  // File input change
  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const clearImage = () => {
    onChange('', '')
    setPreviewUrl('')
    setUrlInput('')
    setUrlError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => setUploadMode('url')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
            uploadMode === 'url'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="mr-1">🔗</span>
          Enter URL
        </button>
        <button
          type="button"
          onClick={() => setUploadMode('file')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
            uploadMode === 'file'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="mr-1">📁</span>
          Upload File
        </button>
      </div>

      {/* URL Input Mode */}
      {uploadMode === 'url' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image URL
          </label>
          <div className="relative">
            <input
              type="url"
              className="input-field pr-10"
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => handleUrlChange(e.target.value)}
              disabled={disabled || urlValidating}
            />
            {urlValidating && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent"></div>
              </div>
            )}
          </div>
          {urlError && (
            <p className="mt-1 text-sm text-red-600">{urlError}</p>
          )}
        </div>
      )}

      {/* File Upload Mode */}
      {uploadMode === 'file' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Image
          </label>
          
          {/* Drag & Drop Area */}
          <div
            ref={dragRef}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => !disabled && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileInputChange}
              disabled={disabled}
            />

            {uploading ? (
              <div className="space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mx-auto"></div>
                <div className="text-sm text-gray-600">Uploading...</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">{uploadProgress}%</div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-4xl">📁</div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-primary-600">Click to upload</span> or drag and drop
                </div>
                <div className="text-xs text-gray-500">
                  PNG, JPG, WebP up to 5MB
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Preview */}
      {previewUrl && !uploading && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Preview
          </label>
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-48 rounded-lg border border-gray-200 shadow-sm"
              onError={() => {
                setPreviewUrl('')
                onChange('', 'Failed to load image')
              }}
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500">
        {uploadMode === 'url' 
          ? 'Enter a direct link to an image file (JPG, PNG, WebP). This method always works as a fallback.'
          : disabled 
            ? 'File upload is temporarily disabled. Please use the URL input option.'
            : 'Upload an image file or drag and drop it here. Files will be stored securely and optimized automatically.'
        }
      </div>

      {/* Additional help for upload issues */}
      {error && error.includes('Upload failed') && (
        <div className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2">
          💡 <strong>Tip:</strong> If file upload isn't working, you can switch to "Enter URL" mode and paste a direct link to your image instead.
        </div>
      )}
    </div>
  )
}

export default ImageUpload