export interface DopplerPlotData {
  time: number[]
  amplitude?: number[]
  frequency?: number[]
  stats?: DopplerStats
}

export interface DopplerParams {
  frequency: number
  velocity: number
  duration: number
}

export interface DopplerStats {
  max_observed?: number
  min_observed?: number
  shift_ratio?: number
}

export interface DopplerPrediction {
  predictedFrequency: number
  predictedVelocity: number
}

const BASE_URL = "http://127.0.0.1:8000/api/doppler"

/**
 * Fetch Doppler audio file from backend
 */
export async function fetchDopplerAudio(params: DopplerParams): Promise<Blob> {
  const url = `${BASE_URL}/audio?frequency=${params.frequency}&velocity=${params.velocity}&duration=${params.duration}`

  const response = await fetch(url, {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`)
  }

  return await response.blob()
}

/**
 * Fetch Doppler plot data (time, amplitude, frequency arrays) from backend
 */
export async function fetchDopplerPlotData(params: DopplerParams): Promise<DopplerPlotData> {
  const url = `${BASE_URL}/?frequency=${params.frequency}&velocity=${params.velocity}&duration=${params.duration}`

  const response = await fetch(url, {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch plot data: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data as DopplerPlotData
}

/**
 * Predict source frequency and velocity from uploaded audio file using AI model
 */
export async function predictDoppler(audioFile: File): Promise<DopplerPrediction> {
  const formData = new FormData()
  formData.append("file", audioFile)

  const response = await fetch(`http://127.0.0.1:8000/api/dopplerAnalyze`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Failed to predict: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data as DopplerPrediction
}
