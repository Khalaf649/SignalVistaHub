// ECG Data Loader - Loads real ECG data from JSON files
// Structure: public/ecg-data/records500/{patientFolder}/{recordingId}_hr.json
// Patient folders: 00000, 01000, 02000, ..., 21000
// Recording IDs: 00001 to 00999

export interface ECGRecording {
  id: string
  filename: string
  samplingRate: number
  leads: string[]
  signals: number[][] // [timeIndex][leadIndex] = voltage value
  duration: number
}

/**
 * Get list of available patient folders
 * Returns: ["00000", "01000", "02000", ..., "21000"]
 */
export function getAvailablePatients(): string[] {
  const patients: string[] = []
  // Patient folders increment by 1000: 00000, 01000, 02000, ..., 10000

    patients.push("0".padStart(5, "0"))
  
  return patients
}

/**
 * Load ECG recording from specific patient folder and recording ID
 * @param patientFolder - Patient folder name (e.g., "00000", "01000")
 * @param recordingId - Recording ID number (e.g., "00001", "00999")
 * @returns ECG recording data or null if failed
 */
export async function loadECGRecording(patientFolder: string, recordingId: string): Promise<ECGRecording | null> {
  try {
    // Ensure recordingId is 5 digits with leading zeros
    const paddedRecordingId = recordingId.padStart(5, "0")
    const filename = `${paddedRecordingId}_hr.json`
    const filePath = `/ecg-data/records500/${patientFolder}/${filename}`

    console.log("[v0] Loading ECG recording from:", filePath)

    const response = await fetch(filePath)

    if (!response.ok) {
      console.error("[v0] Failed to fetch recording:", response.status, response.statusText)
      return null
    }

    const contentType = response.headers.get("content-type")
    if (!contentType?.includes("application/json")) {
      console.error("[v0] Invalid content type:", contentType)
      return null
    }

    const data = await response.json()

    // Validate data structure
    if (!data.signals || !Array.isArray(data.signals) || data.signals.length === 0) {
      console.error("[v0] Invalid signal data structure")
      return null
    }

    if (!data.leads || !Array.isArray(data.leads) || data.leads.length === 0) {
      console.error("[v0] Invalid leads data")
      return null
    }

    const samplingRate = data.samplingRate || 500
    const duration = data.signals.length / samplingRate

    console.log("[v0] Successfully loaded recording:", {
      id: data.id,
      samples: data.signals.length,
      leads: data.leads.length,
      samplingRate: samplingRate,
      duration: duration.toFixed(2) + "s",
    })

    return {
      id: data.id || `${patientFolder}/${paddedRecordingId}`,
      filename: data.filename || filename,
      samplingRate: samplingRate,
      leads: data.leads,
      signals: data.signals,
      duration: duration,
    }
  } catch (error) {
    console.error("[v0] Error loading ECG recording:", error)
    return null
  }
}

/**
 * Check if a recording exists
 */
export async function checkRecordingExists(patientFolder: string, recordingId: string): Promise<boolean> {
  try {
    const paddedRecordingId = recordingId.padStart(5, "0")
    const filename = `${paddedRecordingId}_hr.json`
    const filePath = `/ecg-data/records500/${patientFolder}/${filename}`

    const response = await fetch(filePath, { method: "HEAD" })
    return response.ok
  } catch {
    return false
  }
}
