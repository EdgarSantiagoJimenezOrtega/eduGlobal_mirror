import React, { useState, useEffect } from 'react'
import { apiClient } from '../lib/api'

const RecordedCourseModal = ({ isOpen, onClose, course, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_embeded_code: '',
    recorded_at: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    if (isOpen && course) {
      setFormData({
        title: course.title || '',
        description: course.description || '',
        video_embeded_code: course.video_embeded_code || '',
        recorded_at: course.recorded_at ? course.recorded_at.split('T')[0] : ''
      })
      setError('')
      setValidationErrors({})
    }
  }, [isOpen, course])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.title.trim()) {
      errors.title = 'Title is required'
    }

    if (formData.recorded_at && isNaN(Date.parse(formData.recorded_at))) {
      errors.recorded_at = 'Invalid date format'
    }

    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    setLoading(true)
    setValidationErrors({})

    try {
      await apiClient.updateRecordedCourse(course.id, formData)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error updating recorded course:', error)
      setError(error.message || 'Failed to update recorded course')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Edit Recorded Course
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg">
              {error}
            </div>
          )}

          {/* Course Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">ID:</span>
                <span className="ml-2 text-gray-900">{course?.id}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Educator:</span>
                <span className="ml-2 text-gray-900">{course?.educator_name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Classroom:</span>
                <span className="ml-2 text-gray-900">{course?.classroom_name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Category:</span>
                <span className="ml-2 text-gray-900">{course?.category_name || 'N/A'}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Field */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  validationErrors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Course title"
                required
              />
              {validationErrors.title && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
              )}
            </div>

            {/* Description Field */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Course description (optional)"
              />
            </div>

            {/* Video Embedded Code Field */}
            <div>
              <label htmlFor="video_embeded_code" className="block text-sm font-medium text-gray-700 mb-1">
                Video Embedded Code
              </label>
              <textarea
                id="video_embeded_code"
                name="video_embeded_code"
                value={formData.video_embeded_code}
                onChange={handleChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                placeholder="<iframe src=... ></iframe>"
              />
              <p className="mt-1 text-sm text-gray-500">
                HTML embed code for the video player
              </p>
            </div>

            {/* Recorded Date Field */}
            <div>
              <label htmlFor="recorded_at" className="block text-sm font-medium text-gray-700 mb-1">
                Recorded Date
              </label>
              <input
                type="date"
                id="recorded_at"
                name="recorded_at"
                value={formData.recorded_at}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  validationErrors.recorded_at ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {validationErrors.recorded_at && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.recorded_at}</p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Update Course'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RecordedCourseModal
