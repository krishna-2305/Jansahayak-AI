import api from './api'

export const departmentService = {
  /**
   * Fetch all registered government departments
   */
  async getDepartments() {
    const response = await api.get('/api/departments')
    return response.data
  },
}
