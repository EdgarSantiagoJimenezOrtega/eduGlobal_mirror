import { useState, useEffect } from 'react'
import ImageUpload from './ImageUpload'
import useStorage from '../hooks/useStorage'
import { apiClient } from '../lib/api'

const CourseDefaultImageSettings = () => {
  const [defaultImageUrl, setDefaultImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [coursesWithoutImage, setCoursesWithoutImage] = useState([])
  const [applyToExisting, setApplyToExisting] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const storage = useStorage()

  useEffect(() => {
    // Load default image from localStorage
    const savedUrl = localStorage.getItem('course-default-image')
    if (savedUrl) {
      setDefaultImageUrl(savedUrl)
    }
    // Load courses without image only if expanded
    if (isExpanded) {
      fetchCoursesWithoutImage()
    }
  }, [isExpanded])

  const fetchCoursesWithoutImage = async () => {
    try {
      console.log('🔍 Fetching courses without images...')
      const response = await apiClient.getCoursesWithoutImage()
      console.log('📊 Response from server:', response)
      console.log('📦 Courses without image found:', response.data?.length || 0)
      setCoursesWithoutImage(response.data || [])
    } catch (err) {
      console.error('❌ Error fetching courses without image:', err)
    }
  }

  const handleImageChange = (url, error) => {
    setDefaultImageUrl(url)
    setError(error)
    setSuccess('')
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      if (!defaultImageUrl) {
        setError('Please select an image')
        return
      }

      // Save to localStorage (for backwards compatibility)
      localStorage.setItem('course-default-image', defaultImageUrl)

      // Apply to existing courses without image if checkbox is checked
      if (applyToExisting && coursesWithoutImage.length > 0) {
        const courseIds = coursesWithoutImage.map(course => course.id)
        await apiClient.bulkUpdateCourseImages(courseIds, defaultImageUrl)

        setSuccess(`Default image saved and applied to ${coursesWithoutImage.length} courses without images!`)

        // Refresh the list of courses without image
        await fetchCoursesWithoutImage()
      } else {
        setSuccess('Default course image saved successfully!')
      }

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      console.error('Error saving default image:', err)
      setError('Failed to save default image: ' + (err.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      // Remove from localStorage
      localStorage.removeItem('course-default-image')
      setDefaultImageUrl('')
      setSuccess('Default course image removed successfully!')

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error removing default image:', err)
      setError('Failed to remove default image')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header desplegable */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg
              className={`w-5 h-5 mr-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">
              Default Course Image Settings
            </h3>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            {defaultImageUrl && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs mr-2">
                Configured
              </span>
            )}
            <span className="text-xs">
              {isExpanded ? 'Click to collapse' : 'Click to expand'}
            </span>
          </div>
        </div>
      </div>

      {/* Contenido desplegable */}
      {isExpanded && (
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Set a default image that will be used for courses without their own cover image.
            </p>
            {coursesWithoutImage.length > 0 && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  📊 Found <strong>{coursesWithoutImage.length}</strong> courses without images that can be updated automatically.
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Course Cover Image
            </label>
            <ImageUpload
              value={defaultImageUrl}
              onChange={handleImageChange}
              error={error}
              storage={storage}
              disabled={loading}
              aspectRatio="16/9"
              uploadFunction="uploadCourseImage"
            />
          </div>

          {coursesWithoutImage.length > 0 && (
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={applyToExisting}
                  onChange={(e) => setApplyToExisting(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Apply this image to existing courses without images ({coursesWithoutImage.length} courses)
                </span>
              </label>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            {defaultImageUrl && (
              <button
                onClick={handleRemove}
                disabled={loading}
                className="btn-secondary text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Remove Default Image
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={loading || !defaultImageUrl}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  {applyToExisting && coursesWithoutImage.length > 0 ? 'Saving & Applying...' : 'Saving...'}
                </span>
              ) : (
                <>
                  {applyToExisting && coursesWithoutImage.length > 0
                    ? `Save & Apply to ${coursesWithoutImage.length} Courses`
                    : 'Save Default Image'
                  }
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CourseDefaultImageSettings
