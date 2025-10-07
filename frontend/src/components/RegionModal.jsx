import React, { useState, useEffect } from 'react'
import { apiClient } from '../lib/api'

const RegionModal = ({ isOpen, onClose, region, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    included_category_ids: [],
    excluded_course_ids: [],
    available_languages: [],
    preferred_ui_language: '',
    is_active: true
  })

  const [categories, setCategories] = useState([])
  const [courses, setCourses] = useState([])
  const [availableCourses, setAvailableCourses] = useState([])
  const [availableLanguages, setAvailableLanguages] = useState([])
  const [showCourseExclusion, setShowCourseExclusion] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState({})

  // Fetch categories, courses and languages when modal opens
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔍 Fetching categories and courses...')

        // Fetch all categories in batches (max 100 per request)
        let allCategories = []
        let offset = 0
        const limit = 100
        let hasMore = true

        while (hasMore) {
          const categoriesRes = await apiClient.getCategories({
            limit,
            offset,
            order_by: 'name',
            order_direction: 'asc'
          })
          allCategories = [...allCategories, ...(categoriesRes?.data || [])]
          hasMore = categoriesRes?.pagination?.has_more || false
          offset += limit
        }

        // Fetch all courses in batches (max 100 per request)
        let allCourses = []
        offset = 0
        hasMore = true

        while (hasMore) {
          const coursesRes = await apiClient.getCourses({
            limit,
            offset,
            order_by: 'title',
            order_direction: 'asc'
          })
          allCourses = [...allCourses, ...(coursesRes?.data || [])]
          hasMore = coursesRes?.pagination?.has_more || false
          offset += limit
        }

        console.log('📦 Categories fetched:', allCategories.length)
        console.log('📦 Courses fetched:', allCourses.length)

        setCategories(allCategories)
        setCourses(allCourses)

        // Extract unique languages from courses
        const languages = [...new Set(
          allCourses
            .map(course => course.language)
            .filter(lang => lang && lang.trim() !== '')
        )].sort()

        console.log('🌐 Languages extracted:', languages)
        setAvailableLanguages(languages)
      } catch (error) {
        console.error('❌ Error fetching data:', error)
        setError('Failed to load categories and courses. Please try again.')
      }
    }

    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  // Filter available courses based on included categories
  useEffect(() => {
    if (formData.included_category_ids.length > 0) {
      const filtered = courses.filter(course =>
        formData.included_category_ids.includes(course.category_id)
      )
      setAvailableCourses(filtered)
    } else {
      setAvailableCourses([])
    }
  }, [formData.included_category_ids, courses])

  // Reset form when modal opens/closes or region changes
  useEffect(() => {
    if (isOpen) {
      if (region) {
        // Edit mode
        setFormData({
          name: region.name || '',
          slug: region.slug || '',
          description: region.description || '',
          included_category_ids: region.included_category_ids || [],
          excluded_course_ids: region.excluded_course_ids || [],
          available_languages: region.available_languages || [],
          preferred_ui_language: region.preferred_ui_language || '',
          is_active: region.is_active !== undefined ? region.is_active : true
        })
        setShowCourseExclusion((region.excluded_course_ids || []).length > 0)
      } else {
        // Create mode
        setFormData({
          name: '',
          slug: '',
          description: '',
          included_category_ids: [],
          excluded_course_ids: [],
          available_languages: [],
          preferred_ui_language: '',
          is_active: true
        })
        setShowCourseExclusion(false)
      }
      setError('')
      setValidationErrors({})
    }
  }, [isOpen, region])

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
    if (name === 'name' && !region) {
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

  const handleCategoryToggle = (categoryId) => {
    setFormData(prev => {
      const newCategories = prev.included_category_ids.includes(categoryId)
        ? prev.included_category_ids.filter(id => id !== categoryId)
        : [...prev.included_category_ids, categoryId]

      return {
        ...prev,
        included_category_ids: newCategories,
        // Clear excluded courses if categories change
        excluded_course_ids: []
      }
    })
  }

  const handleSelectAllCategories = () => {
    if (formData.included_category_ids.length === categories.length) {
      // Deselect all
      setFormData(prev => ({
        ...prev,
        included_category_ids: [],
        excluded_course_ids: []
      }))
    } else {
      // Select all
      setFormData(prev => ({
        ...prev,
        included_category_ids: categories.map(cat => cat.id)
      }))
    }
  }

  const handleCourseToggle = (courseId) => {
    setFormData(prev => ({
      ...prev,
      excluded_course_ids: prev.excluded_course_ids.includes(courseId)
        ? prev.excluded_course_ids.filter(id => id !== courseId)
        : [...prev.excluded_course_ids, courseId]
    }))
  }

  const handleLanguageToggle = (language) => {
    setFormData(prev => {
      const newLanguages = prev.available_languages.includes(language)
        ? prev.available_languages.filter(lang => lang !== language)
        : [...prev.available_languages, language]

      // If preferred language is removed from available languages, clear it
      let newPreferredLanguage = prev.preferred_ui_language
      if (!newLanguages.includes(prev.preferred_ui_language)) {
        newPreferredLanguage = newLanguages.length > 0 ? newLanguages[0] : ''
      }

      return {
        ...prev,
        available_languages: newLanguages,
        preferred_ui_language: newPreferredLanguage
      }
    })
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

    if (formData.included_category_ids.length === 0) {
      errors.included_category_ids = 'At least one category must be selected'
    }

    if (formData.available_languages.length === 0) {
      errors.available_languages = 'At least one language must be selected'
    }

    if (!formData.preferred_ui_language) {
      errors.preferred_ui_language = 'Preferred UI language is required'
    } else if (!formData.available_languages.includes(formData.preferred_ui_language)) {
      errors.preferred_ui_language = 'Preferred UI language must be one of the available languages'
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
      // Clean up excluded_course_ids if checkbox is not checked
      const submitData = {
        ...formData,
        excluded_course_ids: showCourseExclusion ? formData.excluded_course_ids : []
      }

      if (region) {
        // Edit mode
        await apiClient.updateRegion(region.id, submitData)
      } else {
        // Create mode
        await apiClient.createRegion(submitData)
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving region:', error)
      if (error.message.includes('slug already exists')) {
        setValidationErrors({ slug: 'A region with this slug already exists' })
      } else if (error.message.includes('name already exists')) {
        setValidationErrors({ name: 'A region with this name already exists' })
      } else {
        setError(error.message || 'Failed to save region')
      }
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
            {region ? 'Edit Region' : 'Create New Region'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Region Name *
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
                placeholder="e.g., North America, Latin America, Spain"
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
                placeholder="region-slug"
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
                placeholder="Region description (optional)"
              />
            </div>

            {/* Categories Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Included Categories *
                </label>
                <button
                  type="button"
                  onClick={handleSelectAllCategories}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  {formData.included_category_ids.length === categories.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto bg-gray-50">
                {categories.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">No categories available</p>
                ) : (
                  <div className="space-y-2">
                    {categories.map(category => (
                      <label key={category.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={formData.included_category_ids.includes(category.id)}
                          onChange={() => handleCategoryToggle(category.id)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-900">{category.name}</span>
                        {category.color && (
                          <span
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: category.color }}
                          />
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {validationErrors.included_category_ids && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.included_category_ids}</p>
              )}
            </div>

            {/* Course Exclusion Checkbox */}
            <div className="border-t border-gray-200 pt-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCourseExclusion}
                  onChange={(e) => {
                    setShowCourseExclusion(e.target.checked)
                    if (!e.target.checked) {
                      setFormData(prev => ({ ...prev, excluded_course_ids: [] }))
                    }
                  }}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Exclude specific courses
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                By default, all courses from included categories are available. Check this to exclude specific courses.
              </p>
            </div>

            {/* Excluded Courses Selection */}
            {showCourseExclusion && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excluded Courses
                </label>
                <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto bg-gray-50">
                  {availableCourses.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">
                      Select categories first to see available courses
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {availableCourses.map(course => (
                        <label key={course.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={formData.excluded_course_ids.includes(course.id)}
                            onChange={() => handleCourseToggle(course.id)}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-900">{course.title}</span>
                          {course.language && (
                            <span className="text-xs text-gray-500">({course.language.toUpperCase()})</span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Available Languages Selection */}
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Languages *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableLanguages.length === 0 ? (
                  <p className="text-sm text-gray-500 col-span-full text-center py-2">No languages found in courses</p>
                ) : (
                  availableLanguages.map(language => (
                    <label key={language} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.available_languages.includes(language)}
                        onChange={() => handleLanguageToggle(language)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-900">{language.toUpperCase()}</span>
                    </label>
                  ))
                )}
              </div>
              {validationErrors.available_languages && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.available_languages}</p>
              )}
            </div>

            {/* Preferred UI Language */}
            <div>
              <label htmlFor="preferred_ui_language" className="block text-sm font-medium text-gray-700 mb-1">
                Preferred UI Language *
              </label>
              <select
                id="preferred_ui_language"
                name="preferred_ui_language"
                value={formData.preferred_ui_language}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  validationErrors.preferred_ui_language ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Select preferred UI language</option>
                {formData.available_languages.map(language => (
                  <option key={language} value={language}>
                    {language.toUpperCase()}
                  </option>
                ))}
              </select>
              {validationErrors.preferred_ui_language && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.preferred_ui_language}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                The platform UI will be displayed in this language by default for this region
              </p>
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
                Active (region is available for selection)
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
                {loading ? 'Saving...' : (region ? 'Update Region' : 'Create Region')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RegionModal
