import { useState, useEffect } from 'react'
import { apiClient } from '../lib/api'
import ImageUpload from './ImageUpload'
import useStorage from '../hooks/useStorage'

const CourseModal = ({ isOpen, onClose, course, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    category_id: '',
    order: 0,
    cover_images: [],
    is_locked: false,
    drip_content: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [imageUploadError, setImageUploadError] = useState('')
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const storage = useStorage()

  const isEditing = !!course

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        slug: course.slug || '',
        description: course.description || '',
        category_id: course.category_id || '',
        order: course.order || 0,
        cover_images: course.cover_images || [],
        is_locked: course.is_locked || false,
        drip_content: course.drip_content || false
      })
      setCoverImageUrl(course.cover_images?.[0] || '')
    } else {
      setFormData({
        title: '',
        slug: '',
        description: '',
        category_id: '',
        order: 0,
        cover_images: [],
        is_locked: false,
        drip_content: false
      })
      setCoverImageUrl('')
    }
    setError('')
  }, [course, isOpen])

  // Fetch categories when modal opens
  useEffect(() => {
    const fetchCategories = async () => {
      if (isOpen) {
        setCategoriesLoading(true)
        try {
          const response = await apiClient.getCategories({
            is_active: true,
            order_by: 'order',
            order_direction: 'asc'
          })
          setCategories(response.data || [])
        } catch (error) {
          console.error('Error fetching categories:', error)
        } finally {
          setCategoriesLoading(false)
        }
      }
    }

    fetchCategories()
  }, [isOpen])

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleTitleChange = (e) => {
    const title = e.target.value
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }))
  }

  const handleImageChange = (url, error) => {
    setCoverImageUrl(url)
    setImageUploadError(error)
    setFormData(prev => ({
      ...prev,
      cover_images: url ? [url] : []
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
      if (!formData.slug.trim()) {
        throw new Error('Slug is required')
      }
      if (imageUploadError) {
        throw new Error('Please fix image upload error: ' + imageUploadError)
      }

      const dataToSubmit = {
        ...formData,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        order: parseInt(formData.order) || 0
      }

      console.log('🚀 Frontend sending data:', JSON.stringify(dataToSubmit, null, 2))

      if (isEditing) {
        await apiClient.updateCourse(course.id, dataToSubmit)
      } else {
        await apiClient.createCourse(dataToSubmit)
      }

      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error saving course:', err)
      setError(err.message || 'Failed to save course')
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
            {isEditing ? 'Edit Course' : 'Add New Course'}
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
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Course Title *
              </label>
              <input
                type="text"
                id="title"
                required
                className="input-field"
                placeholder="Enter course title"
                value={formData.title}
                onChange={handleTitleChange}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                Slug *
              </label>
              <input
                type="text"
                id="slug"
                required
                className="input-field"
                placeholder="course-slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              />
              <p className="mt-1 text-xs text-gray-500">
                URL-friendly version of the title (lowercase, no spaces)
              </p>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                className="input-field"
                placeholder="Enter course description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <div className="relative">
                <select
                  id="category_id"
                  className="input-field appearance-none pr-10"
                  value={formData.category_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                  disabled={categoriesLoading}
                >
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {categoriesLoading && (
                <p className="mt-1 text-xs text-gray-500">Loading categories...</p>
              )}
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
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Cover Image
              </label>
              {storage.isLoading && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm mb-2">
                  🔄 Checking image storage...
                </div>
              )}
              {storage.warning && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded-lg text-sm mb-2">
                  ⚠️ {storage.warning}
                  <button 
                    type="button" 
                    onClick={storage.retry}
                    className="ml-2 underline hover:no-underline text-xs"
                  >
                    Retry Check
                  </button>
                </div>
              )}
              <ImageUpload
                value={coverImageUrl}
                onChange={handleImageChange}
                error={imageUploadError}
                disabled={loading} // Never disable due to storage - let user try
              />
            </div>

            <div className="sm:col-span-2 space-y-3">
              <div className="flex items-center">
                <input
                  id="is_locked"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={formData.is_locked}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_locked: e.target.checked }))}
                />
                <label htmlFor="is_locked" className="ml-2 block text-sm text-gray-900">
                  Lock this course (students cannot access)
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
                  Enable drip content for this course
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
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                isEditing ? 'Update Course' : 'Create Course'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CourseModal