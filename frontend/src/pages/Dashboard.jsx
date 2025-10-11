import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import CoursesTable from '../components/CoursesTable'
import CourseModal from '../components/CourseModal'
import ModuleModal from '../components/ModuleModal'
import LessonModal from '../components/LessonModal'
import CourseDefaultImageSettings from '../components/CourseDefaultImageSettings'
import ModuleDefaultImageSettings from '../components/ModuleDefaultImageSettings'
import { apiClient } from '../lib/api'

const Dashboard = () => {
  // Course modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  
  // Module modal states
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false)
  const [selectedModule, setSelectedModule] = useState(null)
  
  // Lesson modal states
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState(null)
  
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Dashboard statistics state
  const [dashboardStats, setDashboardStats] = useState({
    totalCourses: 0,
    activeStudents: 0
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState('')

  const handleAddCourse = () => {
    setSelectedCourse(null)
    setIsModalOpen(true)
  }

  const handleEditCourse = (course) => {
    setSelectedCourse(course)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedCourse(null)
  }

  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
    fetchDashboardStats()
  }

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true)
      setStatsError('')
      const stats = await apiClient.getDashboardStats()
      setDashboardStats(stats)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      setStatsError('Failed to load dashboard statistics')
    } finally {
      setStatsLoading(false)
    }
  }

  // Load dashboard stats on component mount and when refreshTrigger changes
  useEffect(() => {
    fetchDashboardStats()
  }, [refreshTrigger])

  // Module handlers
  const handleAddModule = () => {
    setSelectedModule(null)
    setIsModuleModalOpen(true)
  }

  const handleEditModule = (module) => {
    setSelectedModule(module)
    setIsModuleModalOpen(true)
  }

  const handleModuleModalClose = () => {
    setIsModuleModalOpen(false)
    setSelectedModule(null)
  }

  // Lesson handlers
  const handleAddLesson = () => {
    setSelectedLesson(null)
    setIsLessonModalOpen(true)
  }

  const handleEditLesson = (lesson) => {
    setSelectedLesson(lesson)
    setIsLessonModalOpen(true)
  }

  const handleLessonModalClose = () => {
    setIsLessonModalOpen(false)
    setSelectedLesson(null)
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Manage your educational content</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleAddCourse}
              className="btn-primary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Course
            </button>
            
            <button
              onClick={handleAddModule}
              className="btn-secondary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Add Module
            </button>
            
            <button
              onClick={handleAddLesson}
              className="btn-outline"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Add Lesson
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Courses Widget */}
          <div className="card-gradient">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-white">Total Courses</h3>
                {statsLoading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-white bg-opacity-20 rounded w-16"></div>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-white">{dashboardStats.totalCourses}</p>
                )}
              </div>
            </div>
          </div>

          {/* Active Students Widget */}
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-secondary-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Active Students</h3>
                {statsLoading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                ) : (
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats.activeStudents}</p>
                    <p className="text-xs text-gray-500 mt-1">Students module not connected yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Course Default Image Settings */}
        <CourseDefaultImageSettings />

        {/* Module Default Image Settings */}
        <ModuleDefaultImageSettings />

        {/* Error message */}
        {statsError && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <div className="flex">
              <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{statsError}</span>
            </div>
          </div>
        )}

        {/* Courses Table */}
        <CoursesTable 
          onEdit={handleEditCourse}
          refreshTrigger={refreshTrigger}
        />

        {/* Modals */}
        <CourseModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          course={selectedCourse}
          onSuccess={handleSuccess}
        />
        
        <ModuleModal
          isOpen={isModuleModalOpen}
          onClose={handleModuleModalClose}
          module={selectedModule}
          onSuccess={handleSuccess}
        />
        
        <LessonModal
          isOpen={isLessonModalOpen}
          onClose={handleLessonModalClose}
          lesson={selectedLesson}
          onSuccess={handleSuccess}
        />
      </div>
    </Layout>
  )
}

export default Dashboard