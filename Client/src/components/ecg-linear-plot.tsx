"use client"

import { useEffect, useRef, useState } from "react"
import type { ECGRecording } from "../data/ecg-data-loader"

interface LinearECGPlotProps {
  channel: number
  isPlaying: boolean
  channelName: string
  recording: ECGRecording | null
}

export default function LinearECGPlot({ channel, isPlaying, channelName, recording }: LinearECGPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dataBuffer, setDataBuffer] = useState<number[]>([])
  const animationRef = useRef<number>()
  const dataPointerRef = useRef(0)

  const windowSize = 1000 // 2 seconds at 500 Hz
  const stepSize = 20 // Samples to add per animation frame

  const getNextSamples = (): number[] => {
    if (!recording || !recording.signals || recording.signals.length === 0) {
      return []
    }

    const samples: number[] = []
    for (let i = 0; i < stepSize; i++) {
      const idx = dataPointerRef.current + i
      if (idx >= recording.signals.length) {
        dataPointerRef.current = 0
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

      if (newSamples.length === 0) return

      setDataBuffer((prev) => {
        const updated = [...prev, ...newSamples]
        if (updated.length > windowSize) {
          return updated.slice(updated.length - windowSize)
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

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = "#f0f0f0"
    ctx.lineWidth = 1

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * canvas.width
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }

    // Horizontal grid lines
    for (let i = 0; i <= 8; i++) {
      const y = (i / 8) * canvas.height
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    if (dataBuffer.length < 2) return

    ctx.strokeStyle = "#6366f1"
    ctx.lineWidth = 2
    ctx.beginPath()

    const scaleY = canvas.height / 4
    const centerY = canvas.height / 2
    const scaleX = canvas.width / dataBuffer.length

    dataBuffer.forEach((value, index) => {
      const x = index * scaleX
      const y = centerY - value * scaleY

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    if (isPlaying) {
      ctx.strokeStyle = "#d97706"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(canvas.width - 2, 0)
      ctx.lineTo(canvas.width - 2, canvas.height)
      ctx.stroke()
    }
  }, [dataBuffer, isPlaying])

  return (
    <div className="w-full">
      <canvas ref={canvasRef} width={800} height={300} className="w-full border border-border rounded-md" />
      <div className="mt-2 text-sm text-muted-foreground text-center">
        Time Window: 2 seconds ({windowSize} samples) | Sampling Rate: {recording?.samplingRate || 500} Hz
      </div>
    </div>
  )
}
