import { useState, useEffect } from 'react'
import { apiClient } from '../lib/api'

const ModuleModal = ({ isOpen, onClose, module, onSuccess }) => {
  const [formData, setFormData] = useState({
    course_id: '',
    title: '',
    description: '',
    order: 0,
    is_locked: false,
    drip_content: false
  })
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [error, setError] = useState('')

  const isEditing = !!module

  useEffect(() => {
    if (isOpen) {
      fetchCourses()
    }
  }, [isOpen])

  useEffect(() => {
    if (module) {
      setFormData({
        course_id: module.course_id || '',
        title: module.title || '',
        description: module.description || '',
        order: module.order || 0,
        is_locked: module.is_locked || false,
        drip_content: module.drip_content || false
      })
    } else {
      setFormData({
        course_id: '',
        title: '',
        description: '',
        order: 0,
        is_locked: false,
        drip_content: false
      })
    }
    setError('')
  }, [module, isOpen])

  const fetchCourses = async () => {
    try {
      setCoursesLoading(true)
      const response = await apiClient.getCourses({ limit: 100 })
      setCourses(response.data || [])
    } catch (err) {
      console.error('Error fetching courses:', err)
      setError('Failed to load courses')
    } finally {
      setCoursesLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setError('')

      // Basic validation
      if (!formData.title.trim()) {
        throw new Error('Title is required')
      }
      if (!formData.course_id) {
        throw new Error('Course selection is required')
      }

      const dataToSubmit = {
        ...formData,
        course_id: parseInt(formData.course_id),
        order: parseInt(formData.order) || 0
      }

      console.log('🚀 Frontend sending module data:', JSON.stringify(dataToSubmit, null, 2))

      if (isEditing) {
        await apiClient.updateModule(module.id, dataToSubmit)
      } else {
        await apiClient.createModule(dataToSubmit)
      }

      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error saving module:', err)
      setError(err.message || 'Failed to save module')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-xl bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Module' : 'Add New Module'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="course_id" className="block text-sm font-medium text-gray-700 mb-1">
                Course *
              </label>
              {coursesLoading ? (
                <div className="input-field bg-gray-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent mr-2"></div>
                  <span className="text-gray-500">Loading courses...</span>
                </div>
              ) : (
                <select
                  id="course_id"
                  required
                  className="input-field"
                  value={formData.course_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, course_id: e.target.value }))}
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Module Title *
              </label>
              <input
                type="text"
                id="title"
                required
                className="input-field"
                placeholder="Enter module title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                className="input-field"
                placeholder="Enter module description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div>
              <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-1">
                Order
              </label>
              <input
                type="number"
                id="order"
                className="input-field"
                placeholder="0"
                value={formData.order}
                onChange={(e) => setFormData(prev => ({ ...prev, order: e.target.value }))}
              />
              <p className="mt-1 text-xs text-gray-500">
                Display order within the course
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  id="is_locked"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={formData.is_locked}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_locked: e.target.checked }))}
                />
                <label htmlFor="is_locked" className="ml-2 block text-sm text-gray-900">
                  Lock this module (students cannot access)
                </label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <input
                  type="checkbox"
                  id="drip_content"
                  checked={formData.drip_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, drip_content: e.target.checked }))}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="drip_content" className="text-sm font-medium text-gray-900">
                  🔒 Drip Content
                </label>
                <div className="text-xs text-gray-600">
                  Enable drip content for this module
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || coursesLoading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                isEditing ? 'Update Module' : 'Create Module'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModuleModal