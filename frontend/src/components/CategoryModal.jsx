import React, { useState, useEffect } from 'react'
import { apiClient } from '../lib/api'

const CategoryModal = ({ isOpen, onClose, category, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#8B5CF6',
    icon: '',
    order: 0,
    is_active: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState({})

  // Reset form when modal opens/closes or category changes
  useEffect(() => {
    if (isOpen) {
      if (category) {
        // Edit mode
        setFormData({
          name: category.name || '',
          slug: category.slug || '',
          description: category.description || '',
          color: category.color || '#8B5CF6',
          icon: category.icon || '',
          order: category.order || 0,
          is_active: category.is_active !== undefined ? category.is_active : true
        })
      } else {
        // Create mode
        setFormData({
          name: '',
          slug: '',
          description: '',
          color: '#8B5CF6',
          icon: '',
          order: 0,
          is_active: true
        })
      }
      setError('')
      setValidationErrors({})
    }
  }, [isOpen, category])

  // Auto-generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-')
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))

    // Auto-generate slug when name changes (only in create mode)
    if (name === 'name' && !category) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(value)
      }))
    }

    // Clear validation errors for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }

    if (!formData.slug.trim()) {
      errors.slug = 'Slug is required'
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens'
    }

    if (!formData.color || !/^#[0-9A-Fa-f]{6}$/.test(formData.color)) {
      errors.color = 'Valid hex color is required'
    }

    if (formData.order < 0) {
      errors.order = 'Order must be 0 or greater'
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
      if (category) {
        // Edit mode
        await apiClient.updateCategory(category.id, formData)
      } else {
        // Create mode
        await apiClient.createCategory(formData)
      }
      
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving category:', error)
      if (error.message.includes('slug already exists')) {
        setValidationErrors({ slug: 'A category with this slug already exists' })
      } else if (error.message.includes('name already exists')) {
        setValidationErrors({ name: 'A category with this name already exists' })
      } else {
        setError(error.message || 'Failed to save category')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {category ? 'Edit Category' : 'Create New Category'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  validationErrors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter category name"
                required
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>

            {/* Slug Field */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                Slug *
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  validationErrors.slug ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="category-slug"
                required
              />
              {validationErrors.slug && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.slug}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Used in URLs. Only lowercase letters, numbers, and hyphens allowed.
              </p>
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
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Category description (optional)"
              />
            </div>

            {/* Color Picker */}
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                Color *
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    validationErrors.color ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="#8B5CF6"
                />
                <div
                  className="h-10 w-16 rounded border border-gray-300"
                  style={{ backgroundColor: formData.color }}
                />
              </div>
              {validationErrors.color && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.color}</p>
              )}
            </div>

            {/* Icon Field */}
            <div>
              <label htmlFor="icon" className="block text-sm font-medium text-gray-700 mb-1">
                Icon (optional)
              </label>
              <input
                type="text"
                id="icon"
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="📚 or FontAwesome class"
              />
              <p className="mt-1 text-sm text-gray-500">
                Emoji or icon class name (e.g., fas fa-chart-line)
              </p>
            </div>

            {/* Order Field */}
            <div>
              <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                id="order"
                name="order"
                value={formData.order}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  validationErrors.order ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {validationErrors.order && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.order}</p>
              )}
            </div>

            {/* Active Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                Active (visible to users)
              </label>
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
                {loading ? 'Saving...' : (category ? 'Update Category' : 'Create Category')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CategoryModal