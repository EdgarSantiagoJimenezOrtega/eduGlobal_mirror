import React, { useState } from 'react'
import Layout from '../components/Layout'
import RegionsTable from '../components/RegionsTable'
import RegionModal from '../components/RegionModal'

const Regions = () => {
  // Region modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState(null)

  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleAddRegion = () => {
    setSelectedRegion(null)
    setIsModalOpen(true)
  }

  const handleEditRegion = (region) => {
    setSelectedRegion(region)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedRegion(null)
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
            <h1 className="text-2xl font-bold text-gray-900">Regions</h1>
            <p className="text-gray-600">Configure geographical regions and their language settings</p>
          </div>

          <button
            onClick={handleAddRegion}
            className="btn-primary"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Region
          </button>
        </div>

        {/* Regions Table */}
        <RegionsTable
          onEdit={handleEditRegion}
          refreshTrigger={refreshTrigger}
        />

        {/* Region Modal */}
        <RegionModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          region={selectedRegion}
          onSuccess={handleSuccess}
        />
      </div>
    </Layout>
  )
}

export default Regions
