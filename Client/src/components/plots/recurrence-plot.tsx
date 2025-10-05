"use client"

import { useEffect, useRef } from "react"

interface RecurrencePlotProps {
  channel1Data: number[]
  channel2Data: number[]
  channel1Name: string
  channel2Name: string
  maxSamples?: number
}

export default function RecurrencePlot({
  channel1Data,
  channel2Data,
  channel1Name,
  channel2Name,
  maxSamples = 500,
}: RecurrencePlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Colormap function for modern plasma-like gradient
  const getColorFromDensity = (density: number, maxDensity: number): string => {
    const normalized = Math.min(density / maxDensity, 1)
    if (normalized < 0.2) {
      // Dark purple to blue
      const t = normalized / 0.2
      const r = Math.floor(12 * (1 - t) + 68 * t)
      const g = Math.floor(7 * (1 - t) + 1 * t)
      const b = Math.floor(133 * (1 - t) + 119 * t)
      return `rgb(${r}, ${g}, ${b})`
    } else if (normalized < 0.4) {
      // Blue to cyan
      const t = (normalized - 0.2) / 0.2
      const r = Math.floor(68 * (1 - t) + 115 * t)
      const g = Math.floor(1 * (1 - t) + 192 * t)
      const b = Math.floor(119 * (1 - t) + 203 * t)
      return `rgb(${r}, ${g}, ${b})`
    } else if (normalized < 0.6) {
      // Cyan to green-yellow
      const t = (normalized - 0.4) / 0.2
      const r = Math.floor(115 * (1 - t) + 253 * t)
      const g = Math.floor(192 * (1 - t) + 231 * t)
      const b = Math.floor(203 * (1 - t) + 37 * t)
      return `rgb(${r}, ${g}, ${b})`
    } else if (normalized < 0.8) {
      // Green-yellow to yellow
      const t = (normalized - 0.6) / 0.2
      const r = Math.floor(253 * (1 - t) + 252 * t)
      const g = Math.floor(231 * (1 - t) + 233 * t)
      const b = Math.floor(37 * (1 - t) + 3 * t)
      return `rgb(${r}, ${g}, ${b})`
    } else {
      // Yellow to red
      const t = (normalized - 0.8) / 0.2
      const r = Math.floor(252 * (1 - t) + 247 * t)
      const g = Math.floor(233 * (1 - t) + 59 * t)
      const b = Math.floor(3 * (1 - t) + 31 * t)
      return `rgb(${r}, ${g}, ${b})`
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !channel1Data.length || !channel2Data.length) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const samples = Math.min(maxSamples, channel1Data.length, channel2Data.length)
    const data1 = channel1Data.slice(0, samples)
    const data2 = channel2Data.slice(0, samples)

    const minX = Math.min(...data1)
    const maxX = Math.max(...data1)
    const minY = Math.min(...data2)
    const maxY = Math.max(...data2)

    if (maxX === minX || maxY === minY) return

    const padding = 60
    const plotWidth = canvas.width - 2 * padding
    const plotHeight = canvas.height - 2 * padding

    const numBins = 100 // Higher resolution for smoother density

    // Clear canvas with modern dark gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    bgGradient.addColorStop(0, "#0f0f23")
    bgGradient.addColorStop(1, "#1a1a2e")
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Compute 2D histogram for density
    const histogram: number[][] = Array.from({ length: numBins }, () => Array(numBins).fill(0))
    for (let i = 0; i < samples; i++) {
      const binX = Math.floor(((data1[i] - minX) / (maxX - minX)) * (numBins - 1))
      const binY = Math.floor(((data2[i] - minY) / (maxY - minY)) * (numBins - 1))
      histogram[binY][binX]++ // Note: Y inverted for canvas coords
    }

    // Find max density for normalization
    const maxDensity = Math.max(...histogram.flat())

    // Draw density heatmap
    const binWidth = plotWidth / numBins
    const binHeight = plotHeight / numBins
    for (let y = 0; y < numBins; y++) {
      for (let x = 0; x < numBins; x++) {
        const density = histogram[y][x]
        if (density === 0) continue

        const color = getColorFromDensity(density, maxDensity)
        ctx.fillStyle = color
        ctx.fillRect(
          padding + x * binWidth,
          padding + y * binHeight,
          binWidth,
          binHeight
        )
      }
    }

    // Draw subtle grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * plotWidth
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, canvas.height - padding)
      ctx.stroke()

      const y = padding + (i / 10) * plotHeight
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(canvas.width - padding, y)
      ctx.stroke()
    }

    // Draw axes
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, canvas.height - padding)
    ctx.lineTo(canvas.width - padding, canvas.height - padding)
    ctx.stroke()

    // Draw ticks and labels
    ctx.fillStyle = "#e2e8f0"
    ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    // X-axis ticks
    for (let i = 0; i <= 5; i++) {
      const x = padding + (i / 5) * plotWidth
      const tickY = canvas.height - padding + 5
      ctx.beginPath()
      ctx.moveTo(x, canvas.height - padding)
      ctx.lineTo(x, tickY)
      ctx.stroke()

      const label = ((maxX - minX) * (i / 5) + minX).toFixed(1)
      ctx.fillText(label, x, canvas.height - padding + 20)
    }

    // Y-axis ticks
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i / 5) * plotHeight
      const tickX = padding - 5
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(tickX, y)
      ctx.stroke()

      const label = ((maxY - minY) * (i / 5) + minY).toFixed(1)
      ctx.fillText(label, padding - 10, y)
    }

    // Axis labels
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 14px -apple-system, BlinkMacSystemFont, sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "bottom"
    ctx.fillText(channel1Name, canvas.width / 2, canvas.height - 10)

    ctx.save()
    ctx.translate(padding - 40, canvas.height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = "center"
    ctx.textBaseline = "bottom"
    ctx.fillText(channel2Name, 0, 0)
    ctx.restore()

    // Subtitle
    ctx.fillStyle = "#94a3b8"
    ctx.font = "10px -apple-system, BlinkMacSystemFont, sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    ctx.fillText(
      `Density Plot: ${channel1Name} vs ${channel2Name} • Higher density = warmer colors`,
      canvas.width / 2,
      10
    )
  }, [channel1Data, channel2Data, channel1Name, channel2Name, maxSamples])

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <canvas ref={canvasRef} width={600} height={600} className="border border-border rounded-lg bg-black shadow-lg" />
    </div>
  )
}