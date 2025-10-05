"use client"

import { useEffect, useRef } from "react"

interface PolarPlotProps {
  data: number[]
  samplesPerCycle: number
  width?: number
  height?: number
  lineColor?: string
  gridColor?: string
  centerPointColor?: string
  className?: string
  minValue?: number
  maxValue?: number
  autoNormalize?: boolean // If true, auto-compute min/max from data
}

export function PolarPlot({
  data,
  samplesPerCycle,
  width = 600,
  height = 300,
  lineColor = "#e02424",
  gridColor = "#f0f0f0",
  centerPointColor = "#6366f1",
  className = "",
  minValue: propMinValue,
  maxValue: propMaxValue,
  autoNormalize = true,
}: PolarPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
    ctx.strokeStyle = gridColor
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

    if (data.length < 2) return

    let minValue = propMinValue
    let maxValue = propMaxValue
    if (autoNormalize) {
      const dataMin = Math.min(...data)
      const dataMax = Math.max(...data)
      minValue = dataMin
      maxValue = dataMax
    }
    if (minValue === undefined || maxValue === undefined || minValue >= maxValue) {
      return // Invalid range, skip plotting
    }

    const normalizedCenter = (maxValue + minValue) / 2 // For zero-centered data, this is 0
    const scaleFactor =
      (maxRadius * 0.4) / Math.max(Math.abs(maxValue - normalizedCenter), Math.abs(minValue - normalizedCenter))

    // Draw data line
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 2
    ctx.beginPath()

    data.forEach((value, index) => {
      const angle = ((index % samplesPerCycle) / samplesPerCycle) * 2 * Math.PI
      const normalizedValue = (value - normalizedCenter) * scaleFactor
      const radius = maxRadius * 0.5 + normalizedValue

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
    ctx.fillStyle = centerPointColor
    ctx.beginPath()
    ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI)
    ctx.fill()
  }, [
    data,
    samplesPerCycle,
    width,
    height,
    lineColor,
    gridColor,
    centerPointColor,
    propMinValue,
    propMaxValue,
    autoNormalize,
  ])

  return <canvas ref={canvasRef} width={width} height={height} className={className} />
}
