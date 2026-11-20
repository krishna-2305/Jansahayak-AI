// Frontend adapters for backend-authoritative intelligence APIs.
// This module intentionally contains no duplicate NLP or clustering logic.

import { complaintService } from './complaintService'

export async function analyzeGrievanceText(title = '', description = '', departments = []) {
  void departments
  if (`${title} ${description}`.trim().length < 13) return null

  return complaintService.analyzeComplaint({
    title,
    description,
    language: 'English',
    district: 'Bhopal',
    locality: 'Unknown',
    category: 'Other Civic Issues',
    priority: 'Medium',
  })
}

export async function findRelatedComplaints(currentComplaint) {
  if (!currentComplaint?.id) return []
  const response = await complaintService.getRelatedComplaints(currentComplaint.id)
  return (response.potential_matches || []).map((match) => ({
    id: match.complaint_id,
    reference_id: match.reference_id,
    matchScore: Math.round(match.score * 100),
    textSimilarity: match.text_similarity,
    reasons: match.matching_evidence || [],
    matchingSignals: match.matching_signals || {},
  }))
}

// Deprecated browser clustering wrapper: incidents now come from the backend.
export async function detectIncidentClusters() {
  const { incidentService } = await import('./incidentService')
  return incidentService.listIncidents()
}
