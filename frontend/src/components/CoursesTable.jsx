import React, { useState, useEffect } from 'react'
import { apiClient } from '../lib/api'
import DeleteCourseModal from './DeleteCourseModal'
import ModuleModal from './ModuleModal'
import DeleteModuleModal from './DeleteModuleModal'
import LessonModal from './LessonModal'
import DeleteLessonModal from './DeleteLessonModal'
import CourseModuleImageManager from './CourseModuleImageManager'

const CoursesTable = ({ onEdit, refreshTrigger }) => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [categories, setCategories] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState(null)
  
  // Module modal states
  const [moduleModalOpen, setModuleModalOpen] = useState(false)
  const [moduleToEdit, setModuleToEdit] = useState(null)
  const [deleteModuleModalOpen, setDeleteModuleModalOpen] = useState(false)
  const [moduleToDelete, setModuleToDelete] = useState(null)
  
  // Lesson modal states
  const [lessonModalOpen, setLessonModalOpen] = useState(false)
  const [lessonToEdit, setLessonToEdit] = useState(null)
  const [deleteLessonModalOpen, setDeleteLessonModalOpen] = useState(false)
  const [lessonToDelete, setLessonToDelete] = useState(null)

  // Course Module Image Manager states
  const [courseImageManagerOpen, setCourseImageManagerOpen] = useState(false)
  const [courseForImageManager, setCourseForImageManager] = useState(null)
  
  // Expandable table state with session persistence
  const [expandedCourses, setExpandedCourses] = useState(() => {
    try {
      const saved = localStorage.getItem('eduweb-expanded-courses')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })
  const [expandedModules, setExpandedModules] = useState(() => {
    try {
      const saved = localStorage.getItem('eduweb-expanded-modules')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })
  const [courseModules, setCourseModules] = useState({})
  const [moduleLessons, setModuleLessons] = useState({})
  const [loadingModules, setLoadingModules] = useState(new Set())
  const [loadingLessons, setLoadingLessons] = useState(new Set())
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const fetchCourses = async () => {
    try {
      setLoading(true)
      setError('')

      const params = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
        order_by: 'order',
        order_direction: 'asc'
      }

      // Add search filter if present
      if (searchTerm) {
        params.search = searchTerm
      }

      // Add category filter if selected
      if (selectedCategoryId) {
        params.category_id = selectedCategoryId
      }

      const response = await apiClient.getCourses(params)
      setCourses(response.data || [])
      setTotalCount(response.pagination?.total || 0)
    } catch (err) {
      console.error('Error fetching courses:', err)
      setError('Failed to load courses. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.getCategories({
          is_active: true,
          order_by: 'order',
          order_direction: 'asc'
        })
        setCategories(response.data || [])
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    fetchCategories()
  }, [])

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1)
      } else {
        fetchCourses()
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    fetchCourses()
  }, [currentPage, refreshTrigger, selectedCategoryId, itemsPerPage])

  // Reset to page 1 when category filter or itemsPerPage changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [selectedCategoryId, itemsPerPage])

  // Persist expanded states to localStorage
  useEffect(() => {
    localStorage.setItem('eduweb-expanded-courses', JSON.stringify([...expandedCourses]))
  }, [expandedCourses])

  useEffect(() => {
    localStorage.setItem('eduweb-expanded-modules', JSON.stringify([...expandedModules]))
  }, [expandedModules])

  // Restore expanded data on mount
  useEffect(() => {
    if (courses.length > 0) {
      // Restore modules for expanded courses
      expandedCourses.forEach(courseId => {
        if (!courseModules[courseId]) {
          loadModulesForCourse(courseId)
        }
      })
      
      // Restore lessons for expanded modules
      expandedModules.forEach(moduleId => {
        if (!moduleLessons[moduleId]) {
          loadLessonsForModule(moduleId)
        }
      })
    }
  }, [courses])

  const handleDelete = (course) => {
    setCourseToDelete(course)
    setDeleteModalOpen(true)
  }

  const handleDeleteSuccess = () => {
    fetchCourses() // Refresh the table
  }

  const handleDeleteModalClose = () => {
    setDeleteModalOpen(false)
    setCourseToDelete(null)
  }

  // Module handlers
  const handleEditModule = async (module) => {
    // Fetch fresh module data to ensure we have the latest module_images
    try {
      const freshModule = await apiClient.getModule(module.id)
      setModuleToEdit(freshModule)
      // Add a small delay to ensure state is set before opening modal
      setTimeout(() => {
        setModuleModalOpen(true)
      }, 0)
    } catch (error) {
      console.error('Error fetching module details:', error)
      // Fallback to using the existing module data
      setModuleToEdit(module)
      setModuleModalOpen(true)
    }
  }

  const handleDeleteModule = (module) => {
    setModuleToDelete(module)
    setDeleteModuleModalOpen(true)
  }

  const handleModuleModalClose = () => {
    setModuleModalOpen(false)
    setModuleToEdit(null)
  }

  const handleDeleteModuleModalClose = () => {
    setDeleteModuleModalOpen(false)
    setModuleToDelete(null)
  }

  // Lesson handlers
  const handleEditLesson = (lesson, moduleInfo = null) => {
    // Add module and course info to lesson for better editing experience
    const enhancedLesson = {
      ...lesson,
      course_id: moduleInfo?.course_id || lesson.course_id,
      module_course_title: moduleInfo?.course_title
    }
    setLessonToEdit(enhancedLesson)
    setLessonModalOpen(true)
  }

  const handleDeleteLesson = (lesson) => {
    setLessonToDelete(lesson)
    setDeleteLessonModalOpen(true)
  }

  const handleLessonModalClose = () => {
    setLessonModalOpen(false)
    setLessonToEdit(null)
  }

  const handleDeleteLessonModalClose = () => {
    setDeleteLessonModalOpen(false)
    setLessonToDelete(null)
  }

  // Success handlers that maintain hierarchy state
  const handleModuleSuccess = async () => {
    // Refresh the courses data
    await fetchCourses()
    
    // Reload modules for expanded courses to reflect changes
    const expandedCourseIds = Array.from(expandedCourses)
    for (const courseId of expandedCourseIds) {
      await loadModulesForCourse(courseId)
    }
  }

  const handleLessonSuccess = async () => {
    // Refresh the courses data
    await fetchCourses()

    // Reload modules for expanded courses
    const expandedCourseIds = Array.from(expandedCourses)
    for (const courseId of expandedCourseIds) {
      await loadModulesForCourse(courseId)
    }

    // Reload lessons for expanded modules
    const expandedModuleIds = Array.from(expandedModules)
    for (const moduleId of expandedModuleIds) {
      await loadLessonsForModule(moduleId)
    }
  }

  // Course Module Image Manager handlers
  const openImageManager = (course) => {
    setCourseForImageManager(course)
    setCourseImageManagerOpen(true)
  }

  const handleImageManagerClose = () => {
    setCourseImageManagerOpen(false)
    setCourseForImageManager(null)
    // Refresh courses to show updated modules
    setRefreshKey(prev => prev + 1)
  }

  // Expandable functionality
  const toggleCourse = async (courseId) => {
    const newExpandedCourses = new Set(expandedCourses)
    
    if (expandedCourses.has(courseId)) {
      newExpandedCourses.delete(courseId)
      // Also collapse all modules for this course
      const courseModuleIds = courseModules[courseId]?.map(m => m.id) || []
      const newExpandedModules = new Set(expandedModules)
      courseModuleIds.forEach(moduleId => newExpandedModules.delete(moduleId))
      setExpandedModules(newExpandedModules)
    } else {
      newExpandedCourses.add(courseId)
      // Load modules if not already loaded
      if (!courseModules[courseId]) {
        await loadModulesForCourse(courseId)
      }
    }
    
    setExpandedCourses(newExpandedCourses)
  }

  const toggleModule = async (moduleId) => {
    const newExpandedModules = new Set(expandedModules)
    
    if (expandedModules.has(moduleId)) {
      newExpandedModules.delete(moduleId)
    } else {
      newExpandedModules.add(moduleId)
      // Load lessons if not already loaded
      if (!moduleLessons[moduleId]) {
        await loadLessonsForModule(moduleId)
      }
    }
    
    setExpandedModules(newExpandedModules)
  }

  const loadModulesForCourse = async (courseId) => {
    if (loadingModules.has(courseId)) return
    
    setLoadingModules(prev => new Set(prev).add(courseId))
    
    try {
      const response = await apiClient.getModules({ 
        course_id: courseId,
        limit: 100, // Load all modules for a course
        order_by: 'order',
        order_direction: 'asc'
      })
      
      setCourseModules(prev => ({
        ...prev,
        [courseId]: response.data || []
      }))
    } catch (err) {
      console.error('Error loading modules for course:', courseId, err)
    } finally {
      setLoadingModules(prev => {
        const newSet = new Set(prev)
        newSet.delete(courseId)
        return newSet
      })
    }
  }

  const loadLessonsForModule = async (moduleId) => {
    if (loadingLessons.has(moduleId)) return
    
    setLoadingLessons(prev => new Set(prev).add(moduleId))
    
    try {
      const response = await apiClient.getLessons({ 
        module_id: moduleId,
        limit: 100, // Load all lessons for a module
        order_by: 'order',
        order_direction: 'asc'
      })
      
      setModuleLessons(prev => ({
        ...prev,
        [moduleId]: response.data || []
      }))
    } catch (err) {
      console.error('Error loading lessons for module:', moduleId, err)
    } finally {
      setLoadingLessons(prev => {
        const newSet = new Set(prev)
        newSet.delete(moduleId)
        return newSet
      })
    }
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Courses, Modules & Lessons</h2>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => {
              setExpandedCourses(new Set())
              setExpandedModules(new Set())
              localStorage.removeItem('eduweb-expanded-courses')
              localStorage.removeItem('eduweb-expanded-modules')
            }}
            className="btn-outline text-xs px-2 py-1 whitespace-nowrap"
            title="Collapse all rows"
          >
            Collapse All
          </button>
          <div className="flex items-center space-x-3 flex-1 sm:flex-initial">
            <div className="relative">
              <input
                type="text"
                placeholder="Search courses..."
                className="input-field pl-10 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="relative">
              <select
                className="input-field appearance-none pr-10 w-40"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
              >
                <option value="">All Categories</option>
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
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
            <span>📚 Course</span>
            <span>📖 Module</span>
            <span>📝 Lesson</span>
            <span>• Click arrows to expand/collapse hierarchy</span>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header w-8"></th>
                <th className="table-header">Title</th>
                <th className="table-header">Type</th>
                <th className="table-header">Order</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr>
                  <td colSpan="6" className="table-cell text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
                      <span className="ml-2 text-gray-500">Loading courses...</span>
                    </div>
                  </td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan="8" className="table-cell text-center py-8 text-gray-500">
                    {searchTerm ? 'No courses found matching your search.' : 'No courses found. Create your first course!'}
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <React.Fragment key={course.id}>
                    {/* Course Row */}
                    <tr className="hover:bg-gray-50 border-b border-gray-200">
                      <td className="table-cell w-8">
                        <button
                          onClick={() => toggleCourse(course.id)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors duration-150"
                        >
                          <svg 
                            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                              expandedCourses.has(course.id) ? 'rotate-90' : ''
                            }`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">📚</span>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <div className="text-sm font-medium text-gray-900">
                                {course.title}
                              </div>
                              {course.categories && (
                                <div className="flex items-center">
                                  <div 
                                    className="w-3 h-3 rounded-full mr-1" 
                                    style={{ backgroundColor: course.categories.color }}
                                  />
                                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                    {course.categories.name}
                                  </span>
                                </div>
                              )}
                            </div>
                            {course.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs mt-1">
                                {course.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Course
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="text-sm text-gray-900">
                          {course.order}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          course.is_locked
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {course.is_locked ? 'Locked' : 'Active'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onEdit(course)}
                            className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleDelete(course)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Modules for this course */}
                    {expandedCourses.has(course.id) && (
                      <>
                        {/* Add Module Button Row */}
                        <tr className="bg-blue-50 border-b border-blue-200">
                          <td colSpan="6" className="px-6 py-3">
                            <div className="flex items-center justify-between pl-6">
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-700 mr-3">📖 Modules for "{course.title}"</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openImageManager(course)}
                                  className="inline-flex items-center px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-full transition-colors duration-150"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  🖼️ Manage Images
                                </button>
                                <button
                                  onClick={() => {
                                    setModuleToEdit({ course_id: course.id, course_title: course.title })
                                    setModuleModalOpen(true)
                                  }}
                                  className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors duration-150"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                  Add Module
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                        
                        {loadingModules.has(course.id) ? (
                          <tr>
                            <td colSpan="6" className="bg-gray-50 border-b border-gray-200">
                              <div className="flex items-center py-4 pl-12">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent"></div>
                                <span className="ml-2 text-sm text-gray-500">Loading modules for {course.title}...</span>
                              </div>
                            </td>
                          </tr>
                        ) : courseModules[course.id]?.length > 0 ? (
                          courseModules[course.id].map((module) => (
                            <React.Fragment key={`module-${module.id}`}>
                              {/* Module Row */}
                              <tr className="bg-gray-50 hover:bg-gray-100 border-b border-gray-100">
                                <td className="table-cell pl-12">
                                  <button
                                    onClick={() => toggleModule(module.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault()
                                        toggleModule(module.id)
                                      }
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    aria-expanded={expandedModules.has(module.id)}
                                    aria-label={`${expandedModules.has(module.id) ? 'Collapse' : 'Expand'} lessons for ${module.title}`}
                                  >
                                    <svg 
                                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                                        expandedModules.has(module.id) ? 'rotate-90' : ''
                                      }`}
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                </td>
                                <td className="table-cell">
                                  <div className="flex items-center">
                                    <span className="text-lg mr-2">📖</span>
                                    {module.module_images?.[0] && (
                                      <div className="w-12 h-8 rounded overflow-hidden mr-3 flex-shrink-0">
                                        <img
                                          src={module.module_images[0]}
                                          alt={`${module.title} cover`}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.target.style.display = 'none'
                                          }}
                                        />
                                      </div>
                                    )}
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {module.title}
                                      </div>
                                      {module.description && (
                                        <div className="text-sm text-gray-500 truncate max-w-xs">
                                          {module.description}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="table-cell">
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                    Module
                                  </span>
                                </td>
                                <td className="table-cell">
                                  <span className="text-sm text-gray-900">
                                    {module.order}
                                  </span>
                                </td>
                                <td className="table-cell">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    module.is_locked
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {module.is_locked ? 'Locked' : 'Active'}
                                  </span>
                                </td>
                                <td className="table-cell">
                                  <div className="flex items-center space-x-2">
                                    <button 
                                      onClick={() => handleEditModule(module)}
                                      className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                                    >
                                      Edit
                                    </button>
                                    <span className="text-gray-300">|</span>
                                    <button 
                                      onClick={() => handleDeleteModule(module)}
                                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              
                              {/* Lessons for this module */}
                              {expandedModules.has(module.id) && (
                                <>
                                  {/* Add Lesson Button Row */}
                                  <tr className="bg-purple-50 border-b border-purple-200">
                                    <td colSpan="6" className="px-6 py-2">
                                      <div className="flex items-center justify-between pl-14">
                                        <div className="flex items-center">
                                          <span className="text-sm font-medium text-gray-700 mr-3">📝 Lessons for "{module.title}"</span>
                                        </div>
                                        <button
                                          onClick={() => {
                                            setLessonToEdit({ 
                                              module_id: module.id, 
                                              module_title: module.title,
                                              course_id: course.id,
                                              course_title: course.title
                                            })
                                            setLessonModalOpen(true)
                                          }}
                                          className="inline-flex items-center px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-full transition-colors duration-150"
                                        >
                                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                          </svg>
                                          Add Lesson
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                  
                                  {loadingLessons.has(module.id) ? (
                                    <tr>
                                      <td colSpan="6" className="bg-blue-50 border-b border-gray-100">
                                        <div className="flex items-center py-4 pl-20">
                                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent"></div>
                                          <span className="ml-2 text-sm text-gray-500">Loading lessons for {module.title}...</span>
                                        </div>
                                      </td>
                                    </tr>
                                  ) : moduleLessons[module.id]?.length > 0 ? (
                                    moduleLessons[module.id].map((lesson) => (
                                      <tr key={`lesson-${lesson.id}`} className="bg-blue-50 hover:bg-blue-100 border-b border-gray-100">
                                        <td className="table-cell pl-20">
                                          {/* No expand button for lessons */}
                                        </td>
                                        <td className="table-cell">
                                          <div className="flex items-center">
                                            <span className="text-lg mr-2">📝</span>
                                            <div className="text-sm font-medium text-gray-900">
                                              {lesson.title}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="table-cell">
                                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                            Lesson
                                          </span>
                                        </td>
                                        <td className="table-cell">
                                          <span className="text-sm text-gray-900">
                                            {lesson.order}
                                          </span>
                                        </td>
                                        <td className="table-cell">
                                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                            Active
                                          </span>
                                        </td>
                                        <td className="table-cell">
                                          <div className="flex items-center space-x-2">
                                            <button 
                                              onClick={() => handleEditLesson(lesson, { 
                                                course_id: course.id,
                                                course_title: course.title 
                                              })}
                                              className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                                            >
                                              Edit
                                            </button>
                                            <span className="text-gray-300">|</span>
                                            <button 
                                              onClick={() => handleDeleteLesson(lesson)}
                                              className="text-red-600 hover:text-red-900 text-sm font-medium"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan="6" className="bg-blue-50 border-b border-gray-100">
                                        <div className="text-center py-4 pl-20 text-sm text-gray-500">
                                          No lessons found for this module
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </>
                              )}
                            </React.Fragment>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="bg-gray-50 border-b border-gray-200">
                              <div className="text-center py-4 pl-12 text-sm text-gray-500">
                                No modules found for this course
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}</span>{' '}
                to{' '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span>{' '}
                of{' '}
                <span className="font-medium">{totalCount}</span>{' '}
                results
              </p>
              <div className="flex items-center gap-2">
                <label htmlFor="items-per-page" className="text-sm text-gray-700">
                  Show:
                </label>
                <select
                  id="items-per-page"
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="input-field py-1 pr-8 text-sm"
                >
                  <option value={10}>10</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
              </div>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      page === currentPage
                        ? 'z-10 bg-primary-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Delete Course Modal */}
      <DeleteCourseModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteModalClose}
        course={courseToDelete}
        onSuccess={handleDeleteSuccess}
      />

      {/* Module Modals */}
      <ModuleModal
        isOpen={moduleModalOpen}
        onClose={handleModuleModalClose}
        module={moduleToEdit}
        onSuccess={handleModuleSuccess}
      />
      <DeleteModuleModal
        isOpen={deleteModuleModalOpen}
        onClose={handleDeleteModuleModalClose}
        module={moduleToDelete}
        onSuccess={handleModuleSuccess}
      />

      {/* Lesson Modals */}
      <LessonModal
        isOpen={lessonModalOpen}
        onClose={handleLessonModalClose}
        lesson={lessonToEdit}
        onSuccess={handleLessonSuccess}
      />
      <DeleteLessonModal
        isOpen={deleteLessonModalOpen}
        onClose={handleDeleteLessonModalClose}
        lesson={lessonToDelete}
        onSuccess={handleLessonSuccess}
      />

      {/* Course Module Image Manager */}
      <CourseModuleImageManager
        isOpen={courseImageManagerOpen}
        onClose={handleImageManagerClose}
        course={courseForImageManager}
      />
    </div>
  )
}

export default CoursesTable