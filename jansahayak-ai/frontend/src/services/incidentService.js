import api from './api'

export const incidentService = {
  async listIncidents() {
    const response = await api.get('/api/incidents')
    return response.data
  },

  async createIncident(payload) {
    const response = await api.post('/api/incidents', payload)
    return response.data
  },

  async reviewRelationship(incidentId, payload) {
    const response = await api.post(`/api/incidents/${incidentId}/review`, payload)
    return response.data
  },
}
