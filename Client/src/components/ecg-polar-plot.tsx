"use client"

import { useEffect, useRef, useState } from "react"
import type { ECGRecording } from "../data/ecg-data-loader"

interface PolarECGPlotProps {
  channel: number
  isPlaying: boolean
  channelName: string
  recording: ECGRecording | null
}

export default function PolarECGPlot({ channel, isPlaying, channelName, recording }: PolarECGPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dataBuffer, setDataBuffer] = useState<number[]>([])
  const animationRef = useRef<number>()
  const dataPointerRef = useRef(0)
  const samplesPerCycle = 1000 // 2 seconds at 500 Hz = one complete 360° rotation
  const stepSize = 20 // Add samples in smaller chunks for smooth animation

  const getNextSamples = (): number[] => {
    if (!recording || !recording.signals || recording.signals.length === 0) {
      return []
    }

    const samples: number[] = []
    for (let i = 0; i < stepSize; i++) {
      const idx = dataPointerRef.current + i
      if (idx >= recording.signals.length) {
        break
      }
      samples.push(recording.signals[idx][channel])
    }

    dataPointerRef.current += samples.length
    return samples
  }

  useEffect(() => {
    const animate = () => {
      if (!isPlaying) return

      const newSamples = getNextSamples()

      if (newSamples.length === 0) {
        return
      }

      setDataBuffer((prev) => {
        return [...prev, ...newSamples]
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
  }, [isPlaying, channel, recording])

  useEffect(() => {
    setDataBuffer([])
    dataPointerRef.current = 0
  }, [channel, recording])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const maxRadius = Math.min(centerX, centerY) - 20

    // Clear and draw background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid circles
    ctx.strokeStyle = "#f0f0f0"
    ctx.lineWidth = 1

    for (let i = 1; i <= 5; i++) {
      ctx.beginPath()
      ctx.arc(centerX, centerY, (i / 5) * maxRadius, 0, 2 * Math.PI)
      ctx.stroke()
    }

    // Draw radial lines
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * 2 * Math.PI
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(centerX + maxRadius * Math.cos(angle), centerY + maxRadius * Math.sin(angle))
      ctx.stroke()
    }

    if (dataBuffer.length < 2) return

    ctx.strokeStyle = "#e02424"
    ctx.lineWidth = 2
    ctx.beginPath()

    dataBuffer.forEach((value, index) => {
      // This creates overlapping cycles while keeping all previous data visible
      const angle = ((index % samplesPerCycle) / samplesPerCycle) * 2 * Math.PI
      const radius = maxRadius * 0.5 + value * maxRadius * 0.4

      const x = centerX + radius * Math.cos(angle - Math.PI / 2)
      const y = centerY + radius * Math.sin(angle - Math.PI / 2)

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Draw center point
    ctx.fillStyle = "#6366f1"
    ctx.beginPath()
    ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI)
    ctx.fill()
  }, [dataBuffer, samplesPerCycle])

  return (
    <div className="w-full">
      <canvas ref={canvasRef} width={600} height={300} className="w-full border border-border rounded-md" />
      <div className="mt-2 text-sm text-muted-foreground text-center">
        Polar Representation (R-θ) | Radius = Amplitude | Cycle: 2 seconds ({samplesPerCycle} samples) | Total:{" "}
        {dataBuffer.length} samples
      </div>
    </div>
  )
}
