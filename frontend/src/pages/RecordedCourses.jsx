import React, { useState } from 'react'
import RecordedCoursesTable from '../components/RecordedCoursesTable'
import RecordedCourseModal from '../components/RecordedCourseModal'

const RecordedCourses = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleEdit = (course) => {
    setSelectedCourse(course)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCourse(null)
  }

  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recorded Courses</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage courses from the external recording system
          </p>
        </div>
      </div>

      <RecordedCoursesTable
        onEdit={handleEdit}
        refreshTrigger={refreshTrigger}
      />

      <RecordedCourseModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        course={selectedCourse}
        onSuccess={handleSuccess}
      />
    </div>
  )
}

export default RecordedCourses
