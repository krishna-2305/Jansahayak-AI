import api from './api'

export const complaintService = {
  /**
   * Register a new citizen complaint
   * @param {Object} payload - { title, description, language, district, locality, category, priority, department_id }
   */
  async createComplaint(payload) {
    const response = await api.post('/api/complaints', payload)
    return response.data
  },

  /**
   * Fetch complaints list
   * @param {number} skip
   * @param {number} limit
   */
  async listComplaints(skip = 0, limit = 100) {
    const response = await api.get('/api/complaints', {
      params: { skip, limit },
    })
    return response.data
  },

  /**
   * Retrieve complaint by reference ID (e.g. JS-ABC12345)
   * @param {string} referenceId
   */
  async getComplaintByRef(referenceId) {
    const cleanId = referenceId.trim().toUpperCase()
    const response = await api.get(`/api/complaints/${cleanId}`)
    return response.data
  },

  /**
   * Update complaint status (Officer only)
   * @param {number} complaintId
   * @param {string} status - e.g. "Under Review", "In Progress", "Resolved", "Closed", "Rejected"
   */
  async updateComplaintStatus(complaintId, status, remarks = null) {
    const response = await api.patch(`/api/complaints/${complaintId}/status`, {
      status,
      remarks,
    })
    return response.data
  },

  /**
   * Apply officer triage to a complaint (Officer only)
   * @param {number} complaintId
   * @param {Object} payload - Triage information
   */
  async applyOfficerTriage(complaintId, payload) {
    const response = await api.patch(`/api/complaints/${complaintId}/triage`, payload)
    return response.data
  },

  /**
   * Analyze complaint using AI
   * @param {Object} payload - Analysis parameters
   */
  async analyzeComplaint(payload) {
    const response = await api.post('/api/complaints/analyze', payload)
    return response.data
  },

  /**
   * Fetch complaints related to a specific complaint (for AI suggestions)
   * @param {number} complaintId
   */
  async getRelatedComplaints(complaintId) {
    const response = await api.get(`/api/complaints/${complaintId}/related`)
    return response.data
  },

  /**
   * Retrieve AI analysis for a complaint
   * @param {string} referenceId
   */
  async getComplaintAIAnalysis(referenceId) {
    const response = await api.get(`/api/complaints/${referenceId}/ai-analysis`)
    return response.data
  },
}
