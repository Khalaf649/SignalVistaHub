export interface ECGPredictionResponse {
  status: string
  data: {
    probabilities: {
      "1dAVb": number
      RBBB: number
      LBBB: number
      SB: number
      AF: number
      ST: number
    }
    predictions: {
      "1dAVb": number
      RBBB: number
      LBBB: number
      SB: number
      AF: number
      ST: number
    }
    summary: string[]
  }
}

const BASE_URL = "http://127.0.0.1:8000/api/ecg"

/**
 * Predict ECG conditions from a patient recording
 * @param jsonPath - Path in format /{patientFolder}/{Record_id}
 */
export async function predictECG(jsonPath: string): Promise<ECGPredictionResponse> {
    console.log("Predicting ECG for:", jsonPath)
  const response = await fetch(`${BASE_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      json_path: jsonPath,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to predict ECG: ${response.status} ${response.statusText}`)
  }
  console.log("ECG prediction response status:", response)

  const result = await response.json()
  return result as ECGPredictionResponse
}

// Disease name mappings for better display
export const DISEASE_NAMES: Record<string, string> = {
  "1dAVb": "First-degree AV Block",
  RBBB: "Right Bundle Branch Block",
  LBBB: "Left Bundle Branch Block",
  SB: "Sinus Bradycardia",
  AF: "Atrial Fibrillation",
  ST: "ST-segment Changes",
}
