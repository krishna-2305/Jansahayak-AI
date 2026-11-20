import api from './api'

export const dashboardService = {
  /**
   * Fetch aggregate dashboard metrics
   */
  async getSummary() {
    const response = await api.get('/api/dashboard/summary')
    return response.data
  },

  /**
   * Ping backend health endpoint
   */
  async checkHealth() {
    const response = await api.get('/api/health')
    return response.data
  },

  /**
   * Get recurring issues
   */
  async getRecurringIssues(params = {}) {
    const response = await api.get('/api/dashboard/recurring-issues', { params })
    return response.data
  },
}
