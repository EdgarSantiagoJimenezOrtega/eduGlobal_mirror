import { useState, useEffect } from 'react'
import { checkStorageAvailability } from '../lib/storage'

/**
 * Hook to manage storage availability state
 */
export const useStorage = () => {
  const [isAvailable, setIsAvailable] = useState(true) // Assume available by default
  const [isChecking, setIsChecking] = useState(false)
  const [warning, setWarning] = useState(null)

  useEffect(() => {
    const checkStorage = async () => {
      try {
        setIsChecking(true)
        setWarning(null)
        
        const result = await checkStorageAvailability()
        
        if (result.available) {
          setIsAvailable(true)
          setWarning(null)
        } else {
          setIsAvailable(true) // Still allow upload attempts
          setWarning('Image upload may have limited functionality. URL input is recommended.')
          console.warn('Storage check warning:', result.error)
        }
      } catch (err) {
        console.error('Storage check error:', err)
        setIsAvailable(true) // Don't block the UI
        setWarning('Could not verify image upload capability. You can still try uploading or use URL input.')
      } finally {
        setIsChecking(false)
      }
    }

    // Only check if user hasn't interacted yet
    const timer = setTimeout(checkStorage, 1000) // Small delay to not block initial render
    
    return () => clearTimeout(timer)
  }, [])

  const retry = async () => {
    setIsChecking(true)
    setWarning(null)
    
    try {
      const result = await checkStorageAvailability()
      
      if (result.available) {
        setIsAvailable(true)
        setWarning(null)
      } else {
        setIsAvailable(true)
        setWarning('Image upload may have limited functionality. URL input is recommended.')
      }
    } catch (err) {
      setIsAvailable(true)
      setWarning('Could not verify image upload capability. You can still try uploading or use URL input.')
    } finally {
      setIsChecking(false)
    }
  }

  return {
    isInitialized: isAvailable, // For backward compatibility
    isAvailable,
    isLoading: isChecking,
    error: null, // We use warning instead
    warning,
    retry
  }
}

export default useStorage