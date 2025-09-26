import { useState, useEffect } from 'react'
import ImageUpload from './ImageUpload'
import useStorage from '../hooks/useStorage'
import { apiClient } from '../lib/api'

const CourseModuleImageManager = ({ isOpen, onClose, course }) => {
  const [modules, setModules] = useState([])
  const [selectedModules, setSelectedModules] = useState(new Set())
  const [defaultImageUrl, setDefaultImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingModules, setLoadingModules] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const storage = useStorage()

  useEffect(() => {
    if (isOpen && course) {
      fetchCourseModules()
      // Load course-specific default image from localStorage
      const savedUrl = localStorage.getItem(`course-${course.id}-default-image`)
      if (savedUrl) {
        setDefaultImageUrl(savedUrl)
      }
    }
  }, [isOpen, course])

  const fetchCourseModules = async () => {
    if (!course) return

    try {
      setLoadingModules(true)
      console.log('🔍 Fetching modules for course:', course.id)
      const response = await apiClient.getCourseModules(course.id)
      console.log('📦 Modules found:', response.data?.length || 0)

      const modulesData = response.data || []
      setModules(modulesData)

      // Auto-select modules without images
      const modulesWithoutImages = modulesData.filter(module =>
        !module.module_images ||
        module.module_images.length === 0 ||
        module.module_images.every(img => !img || img === '')
      )
      setSelectedModules(new Set(modulesWithoutImages.map(m => m.id)))
    } catch (err) {
      console.error('❌ Error fetching modules:', err)
      setError('Failed to load modules')
    } finally {
      setLoadingModules(false)
    }
  }

  const handleImageChange = (url, error) => {
    setDefaultImageUrl(url)
    setError(error)
    setSuccess('')
  }

  const toggleModuleSelection = (moduleId) => {
    setSelectedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId)
      } else {
        newSet.add(moduleId)
      }
      return newSet
    })
  }

  const selectAll = () => {
    setSelectedModules(new Set(modules.map(m => m.id)))
  }

  const selectNone = () => {
    setSelectedModules(new Set())
  }

  const selectWithoutImages = () => {
    const modulesWithoutImages = modules.filter(module =>
      !module.module_images ||
      module.module_images.length === 0 ||
      module.module_images.every(img => !img || img === '')
    )
    setSelectedModules(new Set(modulesWithoutImages.map(m => m.id)))
  }

  const handleApply = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      if (!defaultImageUrl) {
        setError('Please select an image')
        return
      }

      if (selectedModules.size === 0) {
        setError('Please select at least one module')
        return
      }

      // Save course-specific default image to localStorage
      localStorage.setItem(`course-${course.id}-default-image`, defaultImageUrl)

      // Apply to selected modules
      const moduleIds = Array.from(selectedModules)
      await apiClient.bulkUpdateModuleImages(moduleIds, defaultImageUrl)

      setSuccess(`Image applied to ${moduleIds.length} module(s)!`)

      // Refresh modules to show updated images
      await fetchCourseModules()

      // Clear selection
      setSelectedModules(new Set())

      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      console.error('Error applying image:', err)
      setError('Failed to apply image: ' + (err.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !course) return null

  const modulesWithoutImages = modules.filter(module =>
    !module.module_images ||
    module.module_images.length === 0 ||
    module.module_images.every(img => !img || img === '')
  ).length

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-xl bg-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Module Image Manager
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Course: {course.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - Image upload */}
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Image for Course Modules
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

            {modulesWithoutImages > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  📊 Found <strong>{modulesWithoutImages}</strong> module(s) without images
                </p>
              </div>
            )}
          </div>

          {/* Right column - Module selector */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Select Modules to Update ({selectedModules.size} selected)
              </label>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  All
                </button>
                <span className="text-gray-400">|</span>
                <button
                  onClick={selectNone}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  None
                </button>
                <span className="text-gray-400">|</span>
                <button
                  onClick={selectWithoutImages}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Without Images
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="max-h-80 overflow-y-auto">
                {loadingModules ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading modules...</p>
                  </div>
                ) : modules.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No modules found in this course
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {modules.map(module => {
                      const hasImage = module.module_images &&
                        module.module_images.length > 0 &&
                        module.module_images.some(img => img && img !== '')
                      const imageUrl = hasImage ? module.module_images[0] : null

                      return (
                        <label
                          key={module.id}
                          className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedModules.has(module.id)}
                            onChange={() => toggleModuleSelection(module.id)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <div className="ml-3 flex-1 flex items-center justify-between">
                            <div className="flex items-center">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {module.title}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Order: {module.order}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {imageUrl ? (
                                <>
                                  <img
                                    src={imageUrl}
                                    alt={module.title}
                                    className="w-12 h-8 object-cover rounded border border-gray-200"
                                  />
                                  <span className="text-xs text-green-600">Has image</span>
                                </>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="w-12 h-8 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                    <span className="text-xs text-gray-400">No img</span>
                                  </div>
                                  <span className="text-xs text-orange-600">No image</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={loading || !defaultImageUrl || selectedModules.size === 0}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Applying...
              </span>
            ) : (
              <>
                Apply to {selectedModules.size} Module{selectedModules.size !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CourseModuleImageManager