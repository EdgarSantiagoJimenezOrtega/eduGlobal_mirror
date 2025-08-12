import React, { useState } from 'react'
import Layout from '../components/Layout'
import CategoriesTable from '../components/CategoriesTable'
import CategoryModal from '../components/CategoryModal'

const Categories = () => {
  // Category modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleAddCategory = () => {
    setSelectedCategory(null)
    setIsModalOpen(true)
  }

  const handleEditCategory = (category) => {
    setSelectedCategory(category)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedCategory(null)
  }

  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600">Organize your courses into categories</p>
          </div>
          
          <button
            onClick={handleAddCategory}
            className="btn-primary"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Category
          </button>
        </div>

        {/* Categories Table */}
        <CategoriesTable 
          onEdit={handleEditCategory}
          refreshTrigger={refreshTrigger}
        />

        {/* Category Modal */}
        <CategoryModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          category={selectedCategory}
          onSuccess={handleSuccess}
        />
      </div>
    </Layout>
  )
}

export default Categories