import { useState, useEffect } from 'react'
import { apiClient } from '../lib/api'

const DeleteModuleModal = ({ isOpen, onClose, module, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [lessonCount, setLessonCount] = useState(0)
  const [checkingLessons, setCheckingLessons] = useState(false)
  const [cascadeDelete, setCascadeDelete] = useState(false)

  useEffect(() => {
    if (isOpen && module) {
      checkLessonCount()
    }
  }, [isOpen, module])

  const checkLessonCount = async () => {
    if (!module) return
    
    try {
      setCheckingLessons(true)
      const response = await apiClient.getLessons({ 
        module_id: module.id,
        limit: 1 
      })
      setLessonCount(response.pagination?.total || 0)
      setCascadeDelete(false)
    } catch (error) {
      console.error('Error checking lesson count:', error)
      setLessonCount(0)
    } finally {
      setCheckingLessons(false)
    }
  }

  const handleDelete = async () => {
    if (!module) return

    try {
      setLoading(true)
      
      if (lessonCount > 0 && !cascadeDelete) {
        alert(`This module has ${lessonCount} lessons. Please delete the lessons first or enable cascade delete.`)
        return
      }

      await apiClient.deleteModule(module.id, cascadeDelete)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error deleting module:', error)
      alert(error.message || 'Failed to delete module')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !module) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-xl bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-red-600">
            Delete Module
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          {checkingLessons ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent mr-2"></div>
              <span className="text-gray-600">Checking dependencies...</span>
            </div>
          ) : (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h4 className="text-red-800 font-medium">
                      Are you sure you want to delete this module?
                    </h4>
                    <p className="text-red-700 text-sm mt-1">
                      <strong>"📖 {module.title}"</strong>
                    </p>
                    
                    {lessonCount > 0 && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-yellow-800 text-sm font-medium">
                          ⚠️ This module has <strong>{lessonCount}</strong> lesson{lessonCount > 1 ? 's' : ''} associated with it.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {lessonCount > 0 && (
                <div className="mb-4">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={cascadeDelete}
                      onChange={(e) => setCascadeDelete(e.target.checked)}
                      className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">
                        Delete all lessons
                      </span>
                      <p className="text-gray-500">
                        This will permanently delete the module and all its {lessonCount} lesson{lessonCount > 1 ? 's' : ''}.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              <p className="text-sm text-gray-600">
                This action cannot be undone.
              </p>
            </>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading || checkingLessons}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || checkingLessons || (lessonCount > 0 && !cascadeDelete)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Deleting...
              </span>
            ) : (
              lessonCount > 0 && cascadeDelete ? 'Delete Module & Lessons' : 'Delete Module'
            )}
          </button>
        </div>
        
        {lessonCount > 0 && !cascadeDelete && (
          <p className="text-xs text-red-600 mt-2 text-center">
            Enable cascade delete or remove lessons first
          </p>
        )}
      </div>
    </div>
  )
}

export default DeleteModuleModal