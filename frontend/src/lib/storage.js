import { supabase } from './supabase'

// Configuration for image uploads
export const STORAGE_CONFIG = {
  BUCKET_NAME: 'course-covers',
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  QUALITY: 0.8 // Compression quality
}

/**
 * Check if storage is available (simplified - just try a small operation)
 */
export const checkStorageAvailability = async () => {
  try {
    // Simple test to see if we can access the bucket
    // This doesn't create or verify, just checks basic access
    const { data, error } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .list('', { limit: 1 })
    
    if (error) {
      console.warn('Storage access test failed:', error.message)
      return {
        available: false,
        error: error.message
      }
    }
    
    console.log('✅ Storage access confirmed')
    return {
      available: true,
      error: null
    }
  } catch (error) {
    console.error('Storage availability check error:', error)
    return {
      available: false,
      error: error.message || 'Storage check failed'
    }
  }
}

/**
 * Compress image file if needed
 */
const compressImage = (file) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate new dimensions (max 1200px width)
      const maxWidth = 1200
      const scale = Math.min(1, maxWidth / img.width)
      
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      canvas.toBlob(
        (blob) => resolve(blob || file),
        file.type,
        STORAGE_CONFIG.QUALITY
      )
    }
    
    img.onerror = () => resolve(file)
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Validate image file
 */
export const validateImageFile = (file) => {
  const errors = []
  
  // Check file type
  if (!STORAGE_CONFIG.ALLOWED_TYPES.includes(file.type)) {
    errors.push(`File type not allowed. Accepted types: ${STORAGE_CONFIG.ALLOWED_TYPES.join(', ')}`)
  }
  
  // Check file size
  if (file.size > STORAGE_CONFIG.MAX_FILE_SIZE) {
    errors.push(`File size too large. Maximum size: ${STORAGE_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Generate unique file name
 */
const generateFileName = (originalName, subfolder = '') => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop().toLowerCase()
  const date = new Date().toISOString().slice(0, 7) // YYYY-MM format
  
  const folder = subfolder ? `${subfolder}/` : ''
  return `images/${date}/${folder}${timestamp}-${random}.${extension}`
}

/**
 * Upload image to Supabase Storage
 */
export const uploadImage = async (file, onProgress = null, subfolder = '') => {
  try {
    // Validate file
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors[0] // Return first error for better UX
      }
    }

    // Compress image if needed
    let fileToUpload = file
    if (file.size > 1024 * 1024) { // If larger than 1MB, compress
      try {
        fileToUpload = await compressImage(file)
        console.log(`📆 Image compressed: ${file.size} -> ${fileToUpload.size} bytes`)
      } catch (compressionError) {
        console.warn('Image compression failed, using original:', compressionError)
        fileToUpload = file
      }
    }

    // Generate unique file name
    const fileName = generateFileName(file.name, subfolder)
    console.log(`📁 Uploading to: ${fileName}`)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .upload(fileName, fileToUpload, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Supabase upload error:', error)
      
      // Provide user-friendly error messages
      let userMessage = 'Upload failed'
      if (error.message.includes('violates row-level security')) {
        userMessage = 'Storage access denied. Please use URL input instead.'
      } else if (error.message.includes('exceeds maximum allowed')) {
        userMessage = 'File too large. Please choose a smaller image.'
      } else if (error.message.includes('duplicate')) {
        userMessage = 'File with this name already exists. Please try again.'
      } else if (error.message.includes('bucket')) {
        userMessage = 'Storage not available. Please use URL input instead.'
      } else {
        userMessage = error.message || 'Upload failed'
      }
      
      return {
        success: false,
        error: userMessage
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .getPublicUrl(fileName)

    if (!urlData || !urlData.publicUrl) {
      return {
        success: false,
        error: 'Failed to generate public URL'
      }
    }

    console.log(`✅ Upload successful: ${urlData.publicUrl}`)

    return {
      success: true,
      url: urlData.publicUrl,
      path: fileName,
      size: fileToUpload.size
    }

  } catch (error) {
    console.error('Unexpected upload error:', error)
    return {
      success: false,
      error: 'Upload failed: ' + (error.message || 'Unknown error')
    }
  }
}

/**
 * Delete image from storage
 */
export const deleteImage = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .remove([filePath])

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Delete error:', error)
    return {
      success: false,
      error: error.message || 'Delete failed'
    }
  }
}

/**
 * Create preview URL for file
 */
export const createPreviewUrl = (file) => {
  return URL.createObjectURL(file)
}

/**
 * Validate URL image
 */
export const validateImageUrl = async (url) => {
  return new Promise((resolve) => {
    if (!url || !url.trim()) {
      resolve({ isValid: false, error: 'URL is required' })
      return
    }

    const img = new Image()
    const timeout = setTimeout(() => {
      resolve({ isValid: false, error: 'URL timeout - image took too long to load' })
    }, 10000) // 10 second timeout

    img.onload = () => {
      clearTimeout(timeout)
      resolve({ 
        isValid: true, 
        width: img.width, 
        height: img.height 
      })
    }

    img.onerror = () => {
      clearTimeout(timeout)
      resolve({ isValid: false, error: 'Invalid image URL or image failed to load' })
    }

    img.src = url
  })
}

/**
 * Upload course cover image
 */
export const uploadCourseImage = async (file, onProgress = null) => {
  return uploadImage(file, onProgress, 'courses')
}

/**
 * Upload module cover image  
 */
export const uploadModuleImage = async (file, onProgress = null) => {
  return uploadImage(file, onProgress, 'modules')
}