import { useState, useEffect } from 'react'
import ImageUpload from './ImageUpload'
import useStorage from '../hooks/useStorage'

const ModuleDefaultImageSettings = () => {
  const [defaultImageUrl, setDefaultImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const storage = useStorage()

  useEffect(() => {
    // Load default image from localStorage
    const savedUrl = localStorage.getItem('module-default-image')
    if (savedUrl) {
      setDefaultImageUrl(savedUrl)
    }
  }, [])

  const handleImageChange = (url, error) => {
    setDefaultImageUrl(url)
    setError(error)
    setSuccess('')
  }

  const handleSave = () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      if (!defaultImageUrl) {
        setError('Please select an image')
        return
      }

      // Save to localStorage
      localStorage.setItem('module-default-image', defaultImageUrl)
      setSuccess('Default module image saved successfully!')

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error saving default image:', err)
      setError('Failed to save default image')
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
      localStorage.removeItem('module-default-image')
      setDefaultImageUrl('')
      setSuccess('Default module image removed successfully!')

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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Default Module Image
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Set a default image that will be used for modules without their own cover image.
        </p>
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
          Default Module Cover Image
        </label>
        <ImageUpload
          value={defaultImageUrl}
          onChange={handleImageChange}
          error={error}
          storage={storage}
          disabled={loading}
          aspectRatio="3/2"
          uploadFunction="uploadModuleImage"
        />
      </div>

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
          {loading ? 'Saving...' : 'Save Default Image'}
        </button>
      </div>
    </div>
  )
}

export default ModuleDefaultImageSettings