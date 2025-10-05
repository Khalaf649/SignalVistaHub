"use client"

import { useEffect, useRef, useState } from "react"
import type { ECGRecording } from "../data/ecg-data-loader"

interface RecurrencePlotProps {
  channel1: number
  channel2: number
  isPlaying: boolean
  channel1Name: string
  channel2Name: string
  recording: ECGRecording | null
}

export default function RecurrencePlot({
  channel1,
  channel2,
  isPlaying,
  channel1Name,
  channel2Name,
  recording,
}: RecurrencePlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dataBuffer1, setDataBuffer1] = useState<number[]>([])
  const [dataBuffer2, setDataBuffer2] = useState<number[]>([])
  const animationRef = useRef<number>(0)
  const dataPointerRef = useRef(0)
  const stepSize = 50 // Increased for 500Hz sampling
  const recurrenceMapRef = useRef<Map<string, number>>(new Map())

  // 500Hz for 10 seconds = 5000 points total
  const maxPoints = 5000
  const samplingRate = 500 // Hz

  const getNextSamples = (): { samples1: number[]; samples2: number[] } => {
    if (!recording || !recording.signals || recording.signals.length === 0) {
      const samples1 = Array.from({ length: stepSize }, (_, i) => {
        const t = (dataPointerRef.current + i) / samplingRate
        return generateECGSample(t, channel1)
      })
      const samples2 = Array.from({ length: stepSize }, (_, i) => {
        const t = (dataPointerRef.current + i) / samplingRate
        return generateECGSample(t, channel2)
      })
      return { samples1, samples2 }
    }

    const samples1: number[] = []
    const samples2: number[] = []
    for (let i = 0; i < stepSize; i++) {
      const idx = dataPointerRef.current + i
      if (idx >= recording.signals.length) {
        dataPointerRef.current = 0
        break
      }
      samples1.push(recording.signals[idx][channel1])
      samples2.push(recording.signals[idx][channel2])
    }

    dataPointerRef.current += samples1.length
    return { samples1, samples2 }
  }

  const generateECGSample = (t: number, channelOffset = 0): number => {
    const heartRate = 1.2
    const phase = (t * heartRate + channelOffset * 0.1) % 1

    let value = 0

    if (phase < 0.15) {
      value = 0.15 * Math.sin((phase * Math.PI) / 0.15)
    } else if (phase >= 0.2 && phase < 0.35) {
      const qrsPhase = (phase - 0.2) / 0.15
      if (qrsPhase < 0.3) {
        value = -0.2 * Math.sin((qrsPhase * Math.PI) / 0.3)
      } else if (qrsPhase < 0.5) {
        value = 1.5 * Math.sin(((qrsPhase - 0.3) * Math.PI) / 0.2)
      } else {
        value = -0.3 * Math.sin(((qrsPhase - 0.5) * Math.PI) / 0.5)
      }
    } else if (phase >= 0.45 && phase < 0.7) {
      value = 0.3 * Math.sin(((phase - 0.45) * Math.PI) / 0.25)
    }

    value += (Math.random() - 0.5) * 0.02

    return value
  }

  useEffect(() => {
    const animate = () => {
      if (!isPlaying) return

      const { samples1, samples2 } = getNextSamples()

      setDataBuffer1((prev) => {
        const updated = [...prev, ...samples1]
        if (updated.length > maxPoints) {
          return updated.slice(updated.length - maxPoints)
        }
        return updated
      })

      setDataBuffer2((prev) => {
        const updated = [...prev, ...samples2]
        if (updated.length > maxPoints) {
          return updated.slice(updated.length - maxPoints)
        }
        return updated
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, channel1, channel2, recording])

  useEffect(() => {
    setDataBuffer1([])
    setDataBuffer2([])
    dataPointerRef.current = 0
    recurrenceMapRef.current.clear()
  }, [channel1, channel2, recording])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = "#f0f0f0"
    ctx.lineWidth = 1

    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * canvas.width
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()

      const y = (i / 10) * canvas.height
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Draw axes
    ctx.strokeStyle = "#374151"
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.moveTo(0, canvas.height / 2)
    ctx.lineTo(canvas.width, canvas.height / 2)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(canvas.width / 2, 0)
    ctx.lineTo(canvas.width / 2, canvas.height)
    ctx.stroke()

    if (dataBuffer1.length < 2 || dataBuffer2.length < 2) return

    const scaleX = canvas.width / 4
    const scaleY = canvas.height / 4
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    // Update recurrence map with new points
    const newRecurrenceMap = new Map(recurrenceMapRef.current)
    
    // Only process new points to maintain animation
    const startIdx = Math.max(0, dataBuffer1.length - stepSize)
    
    for (let i = startIdx; i < dataBuffer1.length; i++) {
      const x = centerX + dataBuffer1[i] * scaleX
      const y = centerY - dataBuffer2[i] * scaleY

      // Quantize coordinates for recurrence detection
      const quantizedX = Math.round(x / 2) * 2
      const quantizedY = Math.round(y / 2) * 2
      const key = `${quantizedX},${quantizedY}`
      
      newRecurrenceMap.set(key, (newRecurrenceMap.get(key) || 0) + 1)
    }

    recurrenceMapRef.current = newRecurrenceMap

    // Draw recurrence plot with density-based coloring
    newRecurrenceMap.forEach((count, key) => {
      const [x, y] = key.split(",").map(Number)
      
      // Calculate density-based properties
      const maxDensity = 20 // Maximum expected recurrence count
      const density = Math.min(count / maxDensity, 1)
      
      // Color gradient from light blue to dark red based on density
      const r = Math.floor(100 + density * 155)
      const g = Math.floor(100 + (1 - density) * 100)
      const b = Math.floor(241 - density * 141)
      const alpha = Math.min(0.3 + density * 0.7, 1)
      
      // Size increases with density
      const size = Math.min(1 + density * 8, 9)

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
      ctx.beginPath()
      ctx.arc(x, y, size, 0, 2 * Math.PI)
      ctx.fill()
    })

    // Draw recent trajectory (last 100 points)
    if (dataBuffer1.length > 100) {
      ctx.strokeStyle = "rgba(34, 197, 94, 0.8)" // Green color for trajectory
      ctx.lineWidth = 1.5
      ctx.beginPath()

      const recentPoints = 100
      const startIdx = dataBuffer1.length - recentPoints

      for (let i = startIdx; i < dataBuffer1.length; i++) {
        const x = centerX + dataBuffer1[i] * scaleX
        const y = centerY - dataBuffer2[i] * scaleY

        if (i === startIdx) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.stroke()

      // Draw current position
      const currentX = centerX + dataBuffer1[dataBuffer1.length - 1] * scaleX
      const currentY = centerY - dataBuffer2[dataBuffer2.length - 1] * scaleY
      
      ctx.fillStyle = "#dc2626" // Red for current position
      ctx.beginPath()
      ctx.arc(currentX, currentY, 4, 0, 2 * Math.PI)
      ctx.fill()
    }

    // Draw density legend
    drawDensityLegend(ctx, canvas.width, canvas.height)
  }, [dataBuffer1, dataBuffer2])

  const drawDensityLegend = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const legendWidth = 120
    const legendHeight = 20
    const legendX = width - legendWidth - 10
    const legendY = 10

    // Legend background
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight)

    // Density gradient
    const gradient = ctx.createLinearGradient(legendX, legendY, legendX + legendWidth, legendY)
    gradient.addColorStop(0, "rgba(99, 102, 241, 0.3)") // Low density
    gradient.addColorStop(1, "rgba(220, 38, 38, 1)") // High density
    
    ctx.fillStyle = gradient
    ctx.fillRect(legendX + 5, legendY + 5, legendWidth - 10, 8)

    // Legend text
    ctx.fillStyle = "#374151"
    ctx.font = "10px Arial"
    ctx.fillText("Low", legendX + 5, legendY + 25)
    ctx.fillText("High", legendX + legendWidth - 25, legendY + 25)
    ctx.fillText("Density", legendX + 40, legendY + 25)
  }

  return (
    <div className="w-full">
      <canvas ref={canvasRef} width={600} height={300} className="w-full border border-border rounded-md" />
      <div className="mt-2 text-sm text-muted-foreground text-center">
        X-axis: {channel1Name} | Y-axis: {channel2Name} | Points: {dataBuffer1.length}/{maxPoints}
      </div>
    </div>
  )
}