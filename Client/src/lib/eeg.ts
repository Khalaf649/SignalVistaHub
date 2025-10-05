export interface EEGPreprocessResponse {
  channels: string[]
  access_url: string
  message: string
}

export interface EEGData {
  channels: string[]
  data: number[][] // 2D array: data[channelIndex][sampleIndex]
  samplingRate?: number
  duration?: number
}

const BASE_URL = "http://127.0.0.1:8000/api/eeg"

/**
 * Preprocess EEG file and get access URL to the data
 * @param file - .edf file to process
 */
export async function preprocessEDF(file: File): Promise<EEGPreprocessResponse> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(`${BASE_URL}/preprocess-edf`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Failed to preprocess EEG: ${response.status} ${response.statusText}`)
  }

  const result = await response.json()
  return result as EEGPreprocessResponse
}

/**
 * Fetch the preprocessed EEG data from the access URL
 * @param accessUrl - URL to fetch the JSON data from
 */
export async function fetchEEGData(accessUrl: string): Promise<EEGData> {
  const response = await fetch(accessUrl)

  if (!response.ok) {
    throw new Error(`Failed to fetch EEG data: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data as EEGData
}
