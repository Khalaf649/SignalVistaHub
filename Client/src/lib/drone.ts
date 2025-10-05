export interface DronePredictionResult {
  classification: string
  confidence: number
  status: string
}

const BASE_URL = "http://127.0.0.1:8000/api"

/**
 * Upload audio file for drone classification
 */
export async function predictDrone(audioFile: File): Promise<DronePredictionResult> {
  const formData = new FormData()
  formData.append("audio", audioFile)

  const response = await fetch(`${BASE_URL}/predictDrone`, {
    method: "POST",
    body: formData,
  })


  if (!response.ok) {
    throw new Error(`Failed to classify drone: ${response.status} ${response.statusText}`)
  }

  const result = await response.json()
  return result as DronePredictionResult
}
