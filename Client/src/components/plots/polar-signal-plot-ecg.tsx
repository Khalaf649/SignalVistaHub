"use client"

import { useEffect, useRef, useState } from "react"

interface PolarSignalPlotProps {
  data: number[] // Signal data array
  samplingRate: number // Sampling rate in Hz
  isPlaying: boolean
  channelName: string
}

export default function PolarSignalPlot({ data, samplingRate, isPlaying, channelName }: PolarSignalPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dataBuffer, setDataBuffer] = useState<number[]>([])
  const animationRef = useRef<number>(0)
  const dataPointerRef = useRef(0)
  const samplesPerCycle = 2 * samplingRate // 2 seconds = one complete 360° rotation
  const stepSize = 20

  const getNextSamples = (): number[] => {
    if (!data || data.length === 0) return []

    const samples: number[] = []
    for (let i = 0; i < stepSize; i++) {
      const idx = dataPointerRef.current + i
      if (idx >= data.length) {
        break
      }
      samples.push(data[idx])
    }

    dataPointerRef.current += samples.length
    return samples
  }

  useEffect(() => {
    const animate = () => {
      if (!isPlaying) return

      const newSamples = getNextSamples()
      if (newSamples.length === 0) return

      setDataBuffer((prev) => [...prev, ...newSamples])
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
  }, [isPlaying, data])

  useEffect(() => {
    setDataBuffer([])
    dataPointerRef.current = 0
  }, [data])

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
