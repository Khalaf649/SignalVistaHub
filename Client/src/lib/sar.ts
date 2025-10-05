export interface SARImageResponse {
  status: string
  access_url: string
  message?: string
}

const BASE_URL = "http://127.0.0.1:8000/api/image"

/**
 * Fetch SAR image from backend
 * Returns the access URL to the generated image
 */
export async function fetchSARImage(): Promise<SARImageResponse> {
  const response = await fetch(BASE_URL, {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch SAR image: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data as SARImageResponse
}
