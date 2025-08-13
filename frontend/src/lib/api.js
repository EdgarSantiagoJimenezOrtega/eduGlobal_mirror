const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

console.log('🔧 API Base URL:', API_BASE_URL)
console.log('🔧 VITE_API_URL env var:', import.meta.env.VITE_API_URL)

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    if (config.body && typeof config.body !== 'string') {
      config.body = JSON.stringify(config.body)
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      // Handle 204 No Content responses (typical for DELETE operations)
      if (response.status === 204) {
        return null // No content to parse
      }

      // Get response text to check if there's any content
      let responseText
      try {
        responseText = await response.text()
      } catch (textError) {
        console.error('Failed to read response text:', textError)
        return null
      }
      
      // If no text content, return null (empty response)
      if (!responseText || responseText.trim() === '') {
        return null
      }

      // Try to parse as JSON
      try {
        return JSON.parse(responseText)
      } catch (parseError) {
        // If JSON parsing fails, check if it's expected to be JSON
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          console.error('Expected JSON but got invalid JSON:', responseText)
          console.error('Parse error:', parseError)
          throw new Error('Invalid JSON response from server')
        }
        // For non-JSON content types, return the text as-is
        console.warn('Non-JSON response received:', responseText)
        return responseText
      }
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Courses endpoints
  async getCourses(params = {}) {
    const searchParams = new URLSearchParams()
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        searchParams.append(key, params[key])
      }
    })
    
    const queryString = searchParams.toString()
    return this.request(`/courses${queryString ? `?${queryString}` : ''}`)
  }

  async getCourse(id) {
    return this.request(`/courses/${id}`)
  }

  async createCourse(courseData) {
    return this.request('/courses', {
      method: 'POST',
      body: courseData,
    })
  }

  async updateCourse(id, courseData) {
    return this.request(`/courses/${id}`, {
      method: 'PUT',
      body: courseData,
    })
  }

  async deleteCourse(id, cascade = false) {
    const queryParams = cascade ? '?cascade=true' : ''
    return this.request(`/courses/${id}${queryParams}`, {
      method: 'DELETE',
    })
  }

  async getModuleCount(courseId) {
    const response = await this.request(`/courses/${courseId}/modules?limit=1`)
    return response.pagination?.total || 0
  }

  // Modules endpoints
  async getModules(params = {}) {
    const searchParams = new URLSearchParams()
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        searchParams.append(key, params[key])
      }
    })
    
    const queryString = searchParams.toString()
    return this.request(`/modules${queryString ? `?${queryString}` : ''}`)
  }

  async getModule(id) {
    return this.request(`/modules/${id}`)
  }

  async createModule(moduleData) {
    return this.request('/modules', {
      method: 'POST',
      body: moduleData,
    })
  }

  async updateModule(id, moduleData) {
    return this.request(`/modules/${id}`, {
      method: 'PUT',
      body: moduleData,
    })
  }

  async deleteModule(id, cascade = false) {
    const queryParams = cascade ? '?cascade=true' : ''
    return this.request(`/modules/${id}${queryParams}`, {
      method: 'DELETE',
    })
  }

  // Lessons endpoints
  async getLessons(params = {}) {
    const searchParams = new URLSearchParams()
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        searchParams.append(key, params[key])
      }
    })
    
    const queryString = searchParams.toString()
    return this.request(`/lessons${queryString ? `?${queryString}` : ''}`)
  }

  async getLesson(id) {
    return this.request(`/lessons/${id}`)
  }

  async createLesson(lessonData) {
    return this.request('/lessons', {
      method: 'POST',
      body: lessonData,
    })
  }

  async updateLesson(id, lessonData) {
    return this.request(`/lessons/${id}`, {
      method: 'PUT',
      body: lessonData,
    })
  }

  async deleteLesson(id) {
    return this.request(`/lessons/${id}`, {
      method: 'DELETE',
    })
  }

  // Categories endpoints
  async getCategories(params = {}) {
    const searchParams = new URLSearchParams()
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        searchParams.append(key, params[key])
      }
    })
    
    const queryString = searchParams.toString()
    return this.request(`/categories${queryString ? `?${queryString}` : ''}`)
  }

  async getCategory(id) {
    return this.request(`/categories/${id}`)
  }

  async createCategory(categoryData) {
    return this.request('/categories', {
      method: 'POST',
      body: categoryData,
    })
  }

  async updateCategory(id, categoryData) {
    return this.request(`/categories/${id}`, {
      method: 'PUT',
      body: categoryData,
    })
  }

  async deleteCategory(id, force = false) {
    const queryParams = force ? '?force=true' : ''
    return this.request(`/categories/${id}${queryParams}`, {
      method: 'DELETE',
    })
  }

  // Dashboard statistics endpoints
  async getDashboardStats() {
    try {
      const [coursesResponse, lessonsResponse, userProgressResponse] = await Promise.all([
        this.getCourses({ limit: 1 }),
        this.getLessons({ limit: 1 }),
        this.request('/user_progress?limit=1')
      ])

      const totalCourses = coursesResponse?.pagination?.total || 0
      const totalLessons = lessonsResponse?.pagination?.total || 0
      const activeStudents = 0 // Not connected yet
      
      // Calculate completion rate from user_progress
      let completionRate = 0
      if (totalLessons > 0) {
        const completedLessonsResponse = await this.request('/user_progress?is_completed=true&limit=1')
        const completedLessons = completedLessonsResponse?.pagination?.total || 0
        completionRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
      }

      return {
        totalCourses,
        activeStudents,
        completionRate: `${completionRate}%`,
        totalLessons,
        completedLessons: totalLessons > 0 ? Math.round((completionRate / 100) * totalLessons) : 0
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
      return {
        totalCourses: 0,
        activeStudents: 0,
        completionRate: '0%',
        totalLessons: 0,
        completedLessons: 0
      }
    }
  }
}

export const apiClient = new ApiClient()