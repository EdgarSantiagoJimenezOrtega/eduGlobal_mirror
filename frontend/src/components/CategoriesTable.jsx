import React, { useState, useEffect } from 'react'
import { apiClient } from '../lib/api'

const CategoriesTable = ({ onEdit, refreshTrigger }) => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const itemsPerPage = 10

  const fetchCategories = async () => {
    setLoading(true)
    setError('')
    
    try {
      const offset = (currentPage - 1) * itemsPerPage
      const response = await apiClient.getCategories({
        limit: itemsPerPage,
        offset,
        order_by: 'order',
        order_direction: 'asc'
      })

      setCategories(response.data || [])
      setTotalCount(response.pagination?.total || 0)
    } catch (error) {
      console.error('Error fetching categories:', error)
      setError('Failed to load categories')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [currentPage, refreshTrigger])

  const handleEdit = (category) => {
    onEdit(category)
  }

  const handleDelete = (category) => {
    setCategoryToDelete(category)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async (force = false) => {
    if (!categoryToDelete) return

    setDeleteLoading(true)
    try {
      await apiClient.deleteCategory(categoryToDelete.id, force)
      setDeleteModalOpen(false)
      setCategoryToDelete(null)
      fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      if (error.message.includes('associated courses')) {
        setError(`Cannot delete category "${categoryToDelete.name}". It has associated courses. Use force delete to proceed.`)
      } else {
        setError(error.message || 'Failed to delete category')
      }
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  if (loading && categories.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Loading categories...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <div className="flex">
            <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="card">
        {/* Header with Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Categories</h2>
              <p className="text-gray-600 text-sm">Manage course categories</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <svg 
                  className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filteredCategories.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating your first category.'}
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded mr-3 border border-gray-200" 
                          style={{ backgroundColor: category.color }}
                        />
                        <div>
                          <div className="flex items-center">
                            {category.icon && (
                              <span className="mr-2 text-lg">{category.icon}</span>
                            )}
                            <div className="text-sm font-medium text-gray-900">
                              {category.name}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            /{category.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {category.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        category.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="text-primary-600 hover:text-primary-900 p-1"
                          title="Edit category"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete category"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)} to{' '}
                {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} categories
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {[...Array(Math.min(5, totalPages))].map((_, index) => {
                  const page = index + Math.max(1, currentPage - 2)
                  if (page > totalPages) return null
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      disabled={loading}
                      className={`px-3 py-1 text-sm border rounded disabled:cursor-not-allowed ${
                        page === currentPage
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && categoryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Delete Category
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the category "{categoryToDelete.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setDeleteModalOpen(false)
                    setCategoryToDelete(null)
                    setError('')
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmDelete(false)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => confirmDelete(true)}
                  className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors disabled:opacity-50"
                  disabled={deleteLoading}
                  title="Force delete (removes category from associated courses)"
                >
                  {deleteLoading ? 'Force Deleting...' : 'Force Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoriesTable