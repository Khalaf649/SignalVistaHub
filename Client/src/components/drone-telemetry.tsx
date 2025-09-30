"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Button } from "./ui/button"
import { Plane, Play, Pause, RotateCcw } from "lucide-react"

interface DroneSignal {
  timestamp: number
  signalStrength: number
  gpsQuality: number
  controlLatency: number
  altitude: number
}

export default function DroneTelemetry() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [droneId, setDroneId] = useState("drone-1")
  const [signalData, setSignalData] = useState<DroneSignal[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gpsCanvasRef = useRef<HTMLCanvasElement>(null)
  const latencyCanvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const timeRef = useRef(0)

  const DRONES = [
    { id: "drone-1", name: "Alpha Unit" },
    { id: "drone-2", name: "Beta Unit" },
    { id: "drone-3", name: "Gamma Unit" },
    { id: "drone-4", name: "Delta Unit" },
  ]

  // Generate realistic drone telemetry signal
  const generateSignal = (t: number): DroneSignal => {
    const baseFreq = droneId === "drone-1" ? 0.5 : droneId === "drone-2" ? 0.7 : droneId === "drone-3" ? 0.6 : 0.8

    // Signal strength with interference
    const signalStrength =
      -40 + 15 * Math.sin(2 * Math.PI * baseFreq * t) + 5 * Math.sin(2 * Math.PI * 2.3 * t) + 3 * Math.random()

    // GPS quality (0-100%)
    const gpsQuality = 70 + 20 * Math.sin(2 * Math.PI * 0.3 * t) + 10 * Math.random()

    // Control latency in ms
    const controlLatency = 50 + 20 * Math.sin(2 * Math.PI * 0.4 * t) + 15 * Math.random()

    // Altitude variation
    const altitude = 100 + 30 * Math.sin(2 * Math.PI * 0.2 * t) + 10 * Math.random()

    return {
      timestamp: t,
      signalStrength: Math.max(-80, Math.min(-20, signalStrength)),
      gpsQuality: Math.max(0, Math.min(100, gpsQuality)),
      controlLatency: Math.max(10, Math.min(150, controlLatency)),
      altitude: Math.max(50, Math.min(200, altitude)),
    }
  }

  // Draw signal strength plot
  const drawSignalPlot = (canvas: HTMLCanvasElement, data: DroneSignal[]) => {
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.fillStyle = "#0a0a0a"
    ctx.fillRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = "#27272a"
    ctx.lineWidth = 1
    for (let i = 0; i <= 5; i++) {
      const y = (i * height) / 5
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    if (data.length < 2) return

    // Draw signal strength
    ctx.strokeStyle = "#3b82f6"
    ctx.lineWidth = 2
    ctx.beginPath()

    data.forEach((point, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * width
      const normalized = (point.signalStrength + 80) / 60 // Map -80 to -20 dBm to 0-1
      const y = height - normalized * height

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Draw labels
    ctx.fillStyle = "#a1a1aa"
    ctx.font = "12px monospace"
    ctx.fillText("-20 dBm", 5, 15)
    ctx.fillText("-80 dBm", 5, height - 5)
    ctx.fillText("Signal Strength", width / 2 - 50, 15)
  }

  // Draw GPS quality plot
  const drawGPSPlot = (canvas: HTMLCanvasElement, data: DroneSignal[]) => {
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    ctx.fillStyle = "#0a0a0a"
    ctx.fillRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = "#27272a"
    ctx.lineWidth = 1
    for (let i = 0; i <= 5; i++) {
      const y = (i * height) / 5
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    if (data.length < 2) return

    // Draw GPS quality
    ctx.strokeStyle = "#10b981"
    ctx.lineWidth = 2
    ctx.beginPath()

    data.forEach((point, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * width
      const y = height - (point.gpsQuality / 100) * height

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Draw labels
    ctx.fillStyle = "#a1a1aa"
    ctx.font = "12px monospace"
    ctx.fillText("100%", 5, 15)
    ctx.fillText("0%", 5, height - 5)
    ctx.fillText("GPS Quality", width / 2 - 40, 15)
  }

  // Draw latency plot
  const drawLatencyPlot = (canvas: HTMLCanvasElement, data: DroneSignal[]) => {
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    ctx.fillStyle = "#0a0a0a"
    ctx.fillRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = "#27272a"
    ctx.lineWidth = 1
    for (let i = 0; i <= 5; i++) {
      const y = (i * height) / 5
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    if (data.length < 2) return

    // Draw control latency
    ctx.strokeStyle = "#f59e0b"
    ctx.lineWidth = 2
    ctx.beginPath()

    data.forEach((point, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * width
      const normalized = (point.controlLatency - 10) / 140 // Map 10-150ms to 0-1
      const y = height - normalized * height

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Draw labels
    ctx.fillStyle = "#a1a1aa"
    ctx.font = "12px monospace"
    ctx.fillText("10 ms", 5, height - 5)
    ctx.fillText("150 ms", 5, 15)
    ctx.fillText("Control Latency", width / 2 - 50, 15)
  }

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    const animate = () => {
      timeRef.current += 0.05
      const newSignal = generateSignal(timeRef.current)

      setSignalData((prev) => {
        const updated = [...prev, newSignal]
        return updated.slice(-200) // Keep last 200 points
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, droneId])

  // Draw plots
  useEffect(() => {
    if (canvasRef.current) {
      drawSignalPlot(canvasRef.current, signalData)
    }
    if (gpsCanvasRef.current) {
      drawGPSPlot(gpsCanvasRef.current, signalData)
    }
    if (latencyCanvasRef.current) {
      drawLatencyPlot(latencyCanvasRef.current, signalData)
    }
  }, [signalData])

  const handleReset = () => {
    setIsPlaying(false)
    setSignalData([])
    timeRef.current = 0
  }

  // Get current stats
  const currentSignal = signalData[signalData.length - 1]

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-secondary" />
            Drone Telemetry Monitor
          </CardTitle>
          <CardDescription>Real-time signal analysis for UAV communication systems</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="drone-select">Drone Unit</Label>
              <Select value={droneId} onValueChange={setDroneId}>
                <SelectTrigger id="drone-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DRONES.map((drone) => (
                    <SelectItem key={drone.id} value={drone.id}>
                      {drone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Controls</Label>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsPlaying(!isPlaying)}
                  variant={isPlaying ? "destructive" : "default"}
                  className="flex-1"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </>
                  )}
                </Button>
                <Button onClick={handleReset} variant="outline">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Current Status</Label>
              <div className="text-sm space-y-1">
                {currentSignal ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Signal:</span>
                      <span className="font-mono">{currentSignal.signalStrength.toFixed(1)} dBm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GPS:</span>
                      <span className="font-mono">{currentSignal.gpsQuality.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Latency:</span>
                      <span className="font-mono">{currentSignal.controlLatency.toFixed(0)} ms</span>
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground">No data</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualization Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Signal Strength */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">RF Signal Strength</CardTitle>
          </CardHeader>
          <CardContent>
            <canvas ref={canvasRef} width={600} height={300} className="w-full h-auto border border-border rounded" />
          </CardContent>
        </Card>

        {/* GPS Quality */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">GPS Signal Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <canvas
              ref={gpsCanvasRef}
              width={600}
              height={300}
              className="w-full h-auto border border-border rounded"
            />
          </CardContent>
        </Card>

        {/* Control Latency */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Control Signal Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <canvas
              ref={latencyCanvasRef}
              width={1200}
              height={300}
              className="w-full h-auto border border-border rounded"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
