import { useState } from 'react'
import { apiClient } from '../lib/api'

const DeleteLessonModal = ({ isOpen, onClose, lesson, onSuccess }) => {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!lesson) return

    try {
      setLoading(true)
      await apiClient.deleteLesson(lesson.id)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error deleting lesson:', error)
      alert(error.message || 'Failed to delete lesson')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !lesson) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-xl bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-red-600">
            Delete Lesson
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="text-red-800 font-medium">
                  Are you sure you want to delete this lesson?
                </h4>
                <p className="text-red-700 text-sm mt-1">
                  <strong>"📝 {lesson.title}"</strong>
                </p>
                {lesson.video_url && (
                  <p className="text-red-600 text-xs mt-1">
                    Video: {lesson.video_url}
                  </p>
                )}
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            This action cannot be undone. The lesson content and any associated progress will be permanently removed.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Deleting...
              </span>
            ) : (
              'Delete Lesson'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteLessonModal