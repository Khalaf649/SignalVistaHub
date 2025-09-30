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
  const animationRef = useRef<number>()
  const dataPointerRef = useRef(0)
  const stepSize = 20

  const getNextSamples = (): { samples1: number[]; samples2: number[] } => {
    if (!recording || !recording.signals || recording.signals.length === 0) {
      const samples1 = Array.from({ length: stepSize }, (_, i) => {
        const t = (dataPointerRef.current + i) / 100
        return generateECGSample(t, channel1)
      })
      const samples2 = Array.from({ length: stepSize }, (_, i) => {
        const t = (dataPointerRef.current + i) / 100
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
    const maxPoints = 500

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
  }, [channel1, channel2, recording])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

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

    const pointMap = new Map<string, number>()

    for (let i = 0; i < Math.min(dataBuffer1.length, dataBuffer2.length); i++) {
      const x = centerX + dataBuffer1[i] * scaleX
      const y = centerY - dataBuffer2[i] * scaleY

      const key = `${Math.round(x)},${Math.round(y)}`
      pointMap.set(key, (pointMap.get(key) || 0) + 1)
    }

    pointMap.forEach((count, key) => {
      const [x, y] = key.split(",").map(Number)
      const alpha = Math.min(0.1 + count * 0.02, 1)
      const size = Math.min(2 + count * 0.1, 6)

      ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`
      ctx.beginPath()
      ctx.arc(x, y, size, 0, 2 * Math.PI)
      ctx.fill()
    })

    if (dataBuffer1.length > 50) {
      ctx.strokeStyle = "rgba(217, 119, 6, 0.6)"
      ctx.lineWidth = 1.5
      ctx.beginPath()

      const recentPoints = 50
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
    }
  }, [dataBuffer1, dataBuffer2])

  return (
    <div className="w-full">
      <canvas ref={canvasRef} width={600} height={300} className="w-full border border-border rounded-md" />
      <div className="mt-2 text-sm text-muted-foreground text-center">
        X-axis: {channel1Name} | Y-axis: {channel2Name}
      </div>
    </div>
  )
}
