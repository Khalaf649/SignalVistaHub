"use client"

import { useEffect, useRef, useState } from "react"

interface PolarPlotProps {
  data: number[]
  samplesPerCycle: number
  lineColor?: string
  gridColor?: string
  centerPointColor?: string
  className?: string
}

export function PolarPlot({
  data,
  samplesPerCycle,
  lineColor = "#8b5cf6", // Keeping purple for vibrancy
  gridColor = "#e5e7eb",
  centerPointColor = "#6366f1",
  className = "",
}: PolarPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const currentIndexRef = useRef(0)
  const intervalRef = useRef<number | null>(null)
  const [plottedData, setPlottedData] = useState<number[]>([])
  const [speed, setSpeed] = useState<number>(1)

  // Reset on data change (assumes data is fixed or fully provided)
  useEffect(() => {
    currentIndexRef.current = 0
    setPlottedData([])
  }, [data])

  // Animation effect
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (data.length === 0 || currentIndexRef.current >= data.length) return

    const intervalMs = 1000 / speed
    intervalRef.current = setInterval(() => {
      if (currentIndexRef.current >= data.length) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        return
      }

      setPlottedData((prev) => {
        const newData = [...prev, data[currentIndexRef.current]]
        if (newData.length > 5000) {
          return newData.slice(1)
        }
        return newData
      })

      currentIndexRef.current++
    }, intervalMs)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [data, speed])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const maxRadius = Math.min(centerX, centerY) - 40

    // Improved background gradient for a softer, more modern feel
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius)
    gradient.addColorStop(0, "#fefefe")
    gradient.addColorStop(0.7, "#f8fafc")
    gradient.addColorStop(1, "#f1f5f9")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Concentric circles with subtle variation in opacity and weight for depth
    for (let i = 1; i <= 5; i++) {
      ctx.strokeStyle = i === 5 ? "#cbd5e1" : gridColor
      ctx.lineWidth = i === 5 ? 2.5 : 1
      ctx.globalAlpha = 0.8
      ctx.beginPath()
      ctx.arc(centerX, centerY, (i / 5) * maxRadius, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.globalAlpha = 1

      // Updated labels with better positioning and font
      if (i === 5) {
        ctx.fillStyle = "#64748b"
        ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(`${i * 20}%`, centerX, centerY - (i / 5) * maxRadius + 18)
      } else {
        ctx.fillStyle = "#94a3b8"
        ctx.font = "11px -apple-system, BlinkMacSystemFont, sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(`${i * 20}%`, centerX, centerY - (i / 5) * maxRadius + 16)
      }
    }

    // Radial lines with improved styling
    ctx.strokeStyle = gridColor
    ctx.lineWidth = 1
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * 2 * Math.PI
      ctx.globalAlpha = 0.6
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(centerX + maxRadius * Math.cos(angle), centerY + maxRadius * Math.sin(angle))
      ctx.stroke()
      ctx.globalAlpha = 1

      // Angular labels with refined positioning and font
      const labelRadius = maxRadius + 25
      const labelX = centerX + labelRadius * Math.cos(angle)
      const labelY = centerY + labelRadius * Math.sin(angle) - 4
      ctx.fillStyle = "#64748b"
      ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "bottom"
      ctx.fillText(`${i * 30}°`, labelX, labelY)
    }

    if (plottedData.length < 2) return

    // Enhanced line gradient for smoother transitions
    const lineGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    lineGradient.addColorStop(0, lineColor)
    lineGradient.addColorStop(0.3, "#a78bfa")
    lineGradient.addColorStop(0.7, "#7c3aed")
    lineGradient.addColorStop(1, "#5b21b6")

    // Improved shadow for a more polished glow effect
    ctx.shadowColor = lineColor
    ctx.shadowBlur = 12
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.strokeStyle = lineGradient
    ctx.lineWidth = 3
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.beginPath()

    plottedData.forEach((value, index) => {
      const angle = ((index % samplesPerCycle) / samplesPerCycle) * 2 * Math.PI
      const radius = maxRadius * 0.5 + value

      const x = centerX + radius * Math.cos(angle - Math.PI / 2)
      const y = centerY + radius * Math.sin(angle - Math.PI / 2)

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    // Enhanced center point with layered glow
    ctx.shadowColor = centerPointColor
    ctx.shadowBlur = 15
    ctx.fillStyle = centerPointColor
    ctx.beginPath()
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI)
    ctx.fill()

    ctx.shadowBlur = 0
    ctx.fillStyle = "#ffffff"
    ctx.beginPath()
    ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI)
    ctx.fill()
  }, [
    plottedData,
    samplesPerCycle,
    lineColor,
    gridColor,
    centerPointColor,
  ])

  return (
    <div className={className}>
      <canvas ref={canvasRef} width={800} height={800} />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          marginTop: "16px",
        }}
      >
        {[0.5, 1, 2, 4].map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            style={{
              padding: "8px 12px",
              border: "none",
              borderRadius: "6px",
              backgroundColor: speed === s ? "#8b5cf6" : "#e5e7eb",
              color: speed === s ? "white" : "#374151",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: speed === s ? "bold" : "normal",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor =
                speed === s ? "#7c3aed" : "#d1d5db")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor =
                speed === s ? "#8b5cf6" : "#e5e7eb")
            }
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  )
}