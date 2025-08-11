import { useState, useEffect } from 'react'
import { apiClient } from '../lib/api'

const LessonModal = ({ isOpen, onClose, lesson, onSuccess }) => {
  const [formData, setFormData] = useState({
    course_id: '',
    module_id: '',
    title: '',
    video_url: '',
    support_content: '',
    order: 0,
    drip_delay_minutes: 0
  })
  const [courses, setCourses] = useState([])
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(false)
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [modulesLoading, setModulesLoading] = useState(false)
  const [error, setError] = useState('')

  const isEditing = !!lesson

  useEffect(() => {
    if (isOpen) {
      fetchCourses()
    }
  }, [isOpen])

  useEffect(() => {
    if (lesson) {
      setFormData({
        course_id: lesson.course_id || '',
        module_id: lesson.module_id || '',
        title: lesson.title || '',
        video_url: lesson.video_url || '',
        support_content: lesson.support_content || '',
        order: lesson.order || 0,
        drip_delay_minutes: lesson.drip_delay_minutes || 0
      })
      // If editing and we have a module_id, we need to find the course_id and load modules
      if (lesson.module_id) {
        fetchCourseForModule(lesson.module_id)
      }
    } else {
      setFormData({
        course_id: '',
        module_id: '',
        title: '',
        video_url: '',
        support_content: '',
        order: 0,
        drip_delay_minutes: 0
      })
      setModules([])
    }
    setError('')
  }, [lesson, isOpen])

  // When course changes, fetch modules for that course
  useEffect(() => {
    if (formData.course_id) {
      fetchModules(formData.course_id)
    } else {
      setModules([])
      setFormData(prev => ({ ...prev, module_id: '' }))
    }
  }, [formData.course_id])

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

  const fetchModules = async (courseId) => {
    try {
      setModulesLoading(true)
      const response = await apiClient.getModules({ course_id: courseId, limit: 100 })
      setModules(response.data || [])
    } catch (err) {
      console.error('Error fetching modules:', err)
      setError('Failed to load modules')
    } finally {
      setModulesLoading(false)
    }
  }

  const fetchCourseForModule = async (moduleId) => {
    try {
      const module = await apiClient.getModule(moduleId)
      if (module.course_id) {
        setFormData(prev => ({ ...prev, course_id: module.course_id }))
      }
    } catch (err) {
      console.error('Error fetching module details:', err)
    }
  }

  const handleCourseChange = (courseId) => {
    setFormData(prev => ({ 
      ...prev, 
      course_id: courseId,
      module_id: '' // Reset module selection when course changes
    }))
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
      if (!formData.module_id) {
        throw new Error('Module selection is required')
      }

      const dataToSubmit = {
        module_id: parseInt(formData.module_id),
        title: formData.title.trim(),
        video_url: formData.video_url.trim() || '',
        support_content: formData.support_content.trim() || '',
        order: parseInt(formData.order) || 0,
        drip_delay_minutes: parseInt(formData.drip_delay_minutes) || 0
      }

      console.log('🚀 Frontend sending lesson data:', JSON.stringify(dataToSubmit, null, 2))

      if (isEditing) {
        await apiClient.updateLesson(lesson.id, dataToSubmit)
      } else {
        await apiClient.createLesson(dataToSubmit)
      }

      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error saving lesson:', err)
      setError(err.message || 'Failed to save lesson')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-xl bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Lesson' : 'Add New Lesson'}
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
            {/* Course Selection */}
            <div>
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
                  onChange={(e) => handleCourseChange(e.target.value)}
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

            {/* Module Selection - Dependent on Course */}
            <div>
              <label htmlFor="module_id" className="block text-sm font-medium text-gray-700 mb-1">
                Module *
              </label>
              {modulesLoading ? (
                <div className="input-field bg-gray-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent mr-2"></div>
                  <span className="text-gray-500">Loading modules...</span>
                </div>
              ) : (
                <select
                  id="module_id"
                  required
                  disabled={!formData.course_id}
                  className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={formData.module_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, module_id: e.target.value }))}
                >
                  <option value="">
                    {formData.course_id ? 'Select a module' : 'Select a course first'}
                  </option>
                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Lesson Title *
              </label>
              <input
                type="text"
                id="title"
                required
                className="input-field"
                placeholder="Enter lesson title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="video_url" className="block text-sm font-medium text-gray-700 mb-1">
                Video URL
              </label>
              <input
                type="url"
                id="video_url"
                className="input-field"
                placeholder="https://example.com/video.mp4"
                value={formData.video_url}
                onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="support_content" className="block text-sm font-medium text-gray-700 mb-1">
                Support Content
              </label>
              <textarea
                id="support_content"
                rows={4}
                className="input-field"
                placeholder="Enter HTML content or lesson notes..."
                value={formData.support_content}
                onChange={(e) => setFormData(prev => ({ ...prev, support_content: e.target.value }))}
              />
              <p className="mt-1 text-xs text-gray-500">
                HTML content is supported for rich formatting
              </p>
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
                Display order within the module
              </p>
            </div>

            <div>
              <label htmlFor="drip_delay_minutes" className="block text-sm font-medium text-gray-700 mb-1">
                Drip Delay (minutes)
              </label>
              <input
                type="number"
                id="drip_delay_minutes"
                min="0"
                className="input-field"
                placeholder="0"
                value={formData.drip_delay_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, drip_delay_minutes: e.target.value }))}
              />
              <p className="mt-1 text-xs text-gray-500">
                How long to wait before releasing this lesson (0 = immediate)
              </p>
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
              disabled={loading || coursesLoading || modulesLoading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                isEditing ? 'Update Lesson' : 'Create Lesson'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LessonModal