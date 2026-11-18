/**
 * JanSahayak AI Grievance Intelligence & Incident Coordination Engine
 * Provides real-time NLP classification, priority scoring, safety hazard detection,
 * and spatial/category incident clustering over live complaints.
 */

// Keyword mappings for intelligent department routing
const DEPARTMENT_KEYWORDS = {
  'Public Works': [
    'road', 'pothole', 'drainage', 'bridge', 'footpath', 'street', 'construction',
    'asphalt', 'crater', 'pavement', 'divider', 'gutter', 'culvert', 'flyover',
    'सड़क', 'गड्ढा', 'नाला', 'पुल', 'नाली', 'फुटपाथ'
  ],
  'Sanitation': [
    'garbage', 'trash', 'waste', 'dump', 'smell', 'sewer', 'overflowing',
    'cleaning', 'sweeper', 'dirt', 'carcass', 'sanitation', 'debris', 'solid waste',
    'कचरा', 'गंदगी', 'सफाई', 'सीवर', 'बदबू', 'कूड़ा'
  ],
  'Health': [
    'hospital', 'clinic', 'dengue', 'malaria', 'medicine', 'doctor', 'infection',
    'epidemic', 'food poisoning', 'contamination', 'water quality', 'disease',
    'vaccine', 'ambulance', 'swine flu',
    'अस्पताल', 'दवा', 'बीमारी', 'मलेरिया', 'डेंगू', 'स्वास्थ्य', 'दूषित पानी'
  ],
  'Transport': [
    'bus', 'transit', 'signal', 'traffic', 'auto', 'fare', 'stop', 'route',
    'reckless', 'parking', 'crossing', 'transport', 'metro', 'speed breaker',
    'बस', 'यातायात', 'ट्रैफिक', 'सिग्नल', 'परिवहन'
  ],
  'Education': [
    'school', 'college', 'teacher', 'classroom', 'mid-day meal', 'books',
    'fee', 'admission', 'library', 'blackboard', 'bench',
    'स्कूल', 'शिक्षक', 'कक्षा', 'किताब', 'शिक्षा', 'छात्र'
  ],
  'Revenue': [
    'land', 'patwari', 'registry', 'mutation', 'property', 'tax', 'certificate',
    'tehsildar', 'encroachment', 'khasra', 'khatauni', 'stamp duty',
    'जमीन', 'पटवारी', 'रजिस्ट्री', 'नामांतरण', 'राजस्व', 'प्रमाण पत्र'
  ],
}

// Critical emergency / hazard indicators
const HAZARD_PATTERNS = [
  { term: 'live wire', label: 'Electrocution Risk / High Voltage Sparking', severity: 'Critical' },
  { term: 'open manhole', label: 'Fall Hazard / Uncovered Manhole', severity: 'Critical' },
  { term: 'gas leak', label: 'Hazardous Gas Leakage', severity: 'Critical' },
  { term: 'fire', label: 'Fire Hazard / Active Burn', severity: 'Critical' },
  { term: 'collapse', label: 'Structural Wall/Bridge Collapse Risk', severity: 'Critical' },
  { term: 'contaminated', label: 'Drinking Water Contamination', severity: 'High' },
  { term: 'dengue', label: 'Vector-Borne Outbreak Risk', severity: 'High' },
  { term: 'overflowing sewer', label: 'Public Health Sanitation Hazard', severity: 'High' },
  { term: 'accident prone', label: 'High-Frequency Accident Zone', severity: 'High' },
]

/**
 * Analyzes grievance text and returns AI recommendation
 */
export function analyzeGrievanceText(title = '', description = '', departments = []) {
  const combinedText = `${title} ${description}`.toLowerCase()
  const charLength = combinedText.trim().length

  if (charLength < 5) {
    return null
  }

  // 1. Department Matching
  let bestDeptName = null
  let maxKeywordScore = 0
  const deptScores = {}

  Object.entries(DEPARTMENT_KEYWORDS).forEach(([deptName, keywords]) => {
    let score = 0
    keywords.forEach((kw) => {
      const regex = new RegExp(`\\b${kw}`, 'gi')
      const matches = combinedText.match(regex)
      if (matches) {
        score += matches.length * 15
      }
    })
    deptScores[deptName] = score
    if (score > maxKeywordScore) {
      maxKeywordScore = score
      bestDeptName = deptName
    }
  })

  // Confidence calculation (normalized 60% - 98%)
  const confidence = maxKeywordScore > 0
    ? Math.min(98, Math.max(62, 55 + maxKeywordScore * 4))
    : 45

  // Match with loaded backend departments
  let matchedDepartment = null
  if (bestDeptName && departments.length > 0) {
    matchedDepartment = departments.find(
      (d) => d.name.toLowerCase() === bestDeptName.toLowerCase()
    ) || null
  }

  // 2. Priority & Hazard Detection
  const detectedHazards = []
  let suggestedPriority = 'Medium'
  let priorityScore = 45

  HAZARD_PATTERNS.forEach(({ term, label, severity }) => {
    if (combinedText.includes(term)) {
      detectedHazards.push({ term, label, severity })
      if (severity === 'Critical') {
        suggestedPriority = 'Critical'
        priorityScore = 95
      } else if (severity === 'High' && suggestedPriority !== 'Critical') {
        suggestedPriority = 'High'
        priorityScore = 80
      }
    }
  })

  // Check additional urgency keywords
  if (suggestedPriority === 'Medium') {
    if (
      combinedText.includes('urgent') ||
      combinedText.includes('immediately') ||
      combinedText.includes('emergency') ||
      combinedText.includes('danger') ||
      combinedText.includes('severe') ||
      combinedText.includes('हंगामी') ||
      combinedText.includes('खतरा')
    ) {
      suggestedPriority = 'High'
      priorityScore = 75
    } else if (
      combinedText.includes('routine') ||
      combinedText.includes('suggestion') ||
      combinedText.includes('inquiry') ||
      combinedText.includes('सुझाव')
    ) {
      suggestedPriority = 'Low'
      priorityScore = 25
    }
  }

  // 3. Category Suggestion
  let suggestedCategory = 'Civic Infrastructure'
  if (bestDeptName === 'Public Works') suggestedCategory = 'Roads & Infrastructure'
  else if (bestDeptName === 'Sanitation') suggestedCategory = 'Waste & Sanitation'
  else if (bestDeptName === 'Health') suggestedCategory = 'Public Health & Sanitation'
  else if (bestDeptName === 'Transport') suggestedCategory = 'Public Transport & Traffic'
  else if (bestDeptName === 'Education') suggestedCategory = 'School & Education Services'
  else if (bestDeptName === 'Revenue') suggestedCategory = 'Land & Revenue Administration'

  return {
    recommendedDepartment: matchedDepartment,
    recommendedDepartmentName: bestDeptName || 'Public Works',
    confidence,
    suggestedPriority,
    priorityScore,
    suggestedCategory,
    detectedHazards,
    rationale: bestDeptName
      ? `Identified key grievance indicators related to ${bestDeptName} operations with ${confidence}% confidence score.`
      : 'General grievance detected. Routine departmental evaluation advised.',
  }
}

/**
 * Spatial & Category Clustering for Incident Coordination
 * Scans a list of real complaints to detect multi-citizen incidents in the same locality
 */
export function detectIncidentClusters(complaints = [], departments = []) {
  if (!complaints || complaints.length === 0) return []

  const deptMap = {}
  departments.forEach((d) => {
    deptMap[d.id] = d.name
  })

  // Group by normalized locality + district
  const localityGroups = {}

  complaints.forEach((c) => {
    const locKey = `${c.district.trim().toLowerCase()}_${c.locality.trim().toLowerCase()}`
    if (!localityGroups[locKey]) {
      localityGroups[locKey] = {
        district: c.district,
        locality: c.locality,
        complaints: [],
      }
    }
    localityGroups[locKey].complaints.push(c)
  })

  const clusters = []

  Object.values(localityGroups).forEach((group) => {
    if (group.complaints.length >= 2) {
      // Multiple complaints in same locality! Check category/department convergence
      const categoryCounts = {}
      let maxCategory = ''
      let maxCatCount = 0

      group.complaints.forEach((c) => {
        const cat = c.category || 'General'
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
        if (categoryCounts[cat] > maxCatCount) {
          maxCatCount = categoryCounts[cat]
          maxCategory = cat
        }
      })

      // Determine severity based on priorities
      const hasCritical = group.complaints.some((c) => c.priority === 'Critical')
      const hasHigh = group.complaints.some((c) => c.priority === 'High')
      const severity = hasCritical ? 'Critical' : hasHigh || group.complaints.length >= 3 ? 'High' : 'Medium'

      // Determine primary department
      const firstDeptId = group.complaints.find((c) => c.department_id)?.department_id
      const deptName = firstDeptId ? deptMap[firstDeptId] || 'Multi-Department' : 'Public Services'

      clusters.push({
        id: `INC-${group.district.slice(0, 3).toUpperCase()}-${group.locality.replace(/\s+/g, '').slice(0, 5).toUpperCase()}`,
        title: `${maxCategory} Cluster in ${group.locality}`,
        locality: group.locality,
        district: group.district,
        departmentName: deptName,
        complaintCount: group.complaints.length,
        complaints: group.complaints,
        severity,
        primaryCategory: maxCategory,
        firstReported: group.complaints[group.complaints.length - 1].created_at,
        latestReported: group.complaints[0].created_at,
        summary: `${group.complaints.length} linked citizen grievances recorded in ${group.locality}, ${group.district} regarding ${maxCategory}. Automated incident coordination recommended.`,
      })
    }
  })

  // Sort by severity (Critical first) then count
  return clusters.sort((a, b) => {
    const scoreA = (a.severity === 'Critical' ? 100 : a.severity === 'High' ? 50 : 10) + a.complaintCount
    const scoreB = (b.severity === 'Critical' ? 100 : b.severity === 'High' ? 50 : 10) + b.complaintCount
    return scoreB - scoreA
  })
}

/**
 * Finds complaints related to a specific complaint (by locality or category or district)
 */
export function findRelatedComplaints(currentComplaint, allComplaints = []) {
  if (!currentComplaint || !allComplaints.length) return []

  const currentLocality = (currentComplaint.locality || '').toLowerCase().trim()
  const currentCategory = (currentComplaint.category || '').toLowerCase().trim()
  const currentDistrict = (currentComplaint.district || '').toLowerCase().trim()

  return allComplaints
    .filter((c) => c.id !== currentComplaint.id)
    .map((c) => {
      let matchScore = 0
      const reasons = []

      if (c.locality && c.locality.toLowerCase().trim() === currentLocality) {
        matchScore += 50
        reasons.push('Same Locality')
      }
      if (c.category && c.category.toLowerCase().trim() === currentCategory) {
        matchScore += 30
        reasons.push('Same Category')
      }
      if (c.district && c.district.toLowerCase().trim() === currentDistrict) {
        matchScore += 20
        reasons.push('Same District')
      }

      return {
        ...c,
        matchScore,
        reasons,
      }
    })
    .filter((c) => c.matchScore >= 40)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5)
}
