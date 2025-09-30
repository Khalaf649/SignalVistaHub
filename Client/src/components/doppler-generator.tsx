"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Play, Download, Volume2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function DopplerGenerator() {
  const [frequency, setFrequency] = useState(650)
  const [velocity, setVelocity] = useState(20)
  const [duration, setDuration] = useState(10)
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [plotData, setPlotData] = useState<{
    time: number[]
    amplitude: number[]
    observedFreq: number[]
  } | null>(null)
  const canvasAmplitudeRef = useRef<HTMLCanvasElement>(null)
  const canvasFreqRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  const generateDopplerSound = async () => {
    setIsGenerating(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Simulation parameters
      const v_sound = 343.0
      const d = 10.0
      const fs = 44100
      const f_low = frequency
      const f_high = frequency + 350
      const cycle_time = 4.0

      const numSamples = Math.floor(duration * fs)

      const t = new Float32Array(numSamples)
      const x = new Float32Array(numSamples)
      const r = new Float32Array(numSamples)
      const v_rad = new Float32Array(numSamples)
      const f_s = new Float32Array(numSamples)
      const f_o = new Float32Array(numSamples)
      const signal = new Float32Array(numSamples)
      const amp_factors = new Float32Array(numSamples)
      const pan = new Float32Array(numSamples)
      const left = new Float32Array(numSamples)
      const right = new Float32Array(numSamples)

      const t0 = duration / 2.0

      // Calculate time array and derived values
      for (let i = 0; i < numSamples; i++) {
        t[i] = i / fs
        x[i] = velocity * (t[i] - t0)
        r[i] = Math.sqrt(x[i] * x[i] + d * d)
        v_rad[i] = (velocity * -x[i]) / r[i]

        // Calculate source frequency (siren sweep)
        const phase_mod = (t[i] / cycle_time) % 1.0
        const amp = phase_mod <= 0.5 ? 2 * phase_mod : 2 - 2 * phase_mod
        f_s[i] = f_low + (f_high - f_low) * amp

        // Calculate observed frequency (Doppler shift)
        f_o[i] = (f_s[i] * v_sound) / (v_sound - v_rad[i])

        // Calculate amplitude factor (inverse square law)
        amp_factors[i] = 1.0 / (r[i] * r[i])
      }

      const dt = 1 / fs
      let phi = 0
      for (let i = 0; i < numSamples; i++) {
        phi += 2 * Math.PI * f_o[i] * dt
        signal[i] = Math.sign(Math.sin(phi))
      }

      let max_amp = 0
      for (let i = 0; i < numSamples; i++) {
        if (amp_factors[i] > max_amp) max_amp = amp_factors[i]
      }

      // Apply amplitude factors
      for (let i = 0; i < numSamples; i++) {
        signal[i] = signal[i] * (amp_factors[i] / max_amp)
      }

      let max_signal = 0
      for (let i = 0; i < numSamples; i++) {
        const abs_val = Math.abs(signal[i])
        if (abs_val > max_signal) max_signal = abs_val
      }

      for (let i = 0; i < numSamples; i++) {
        signal[i] = signal[i] / max_signal
      }

      for (let i = 0; i < numSamples; i++) {
        pan[i] = x[i] / r[i]
        left[i] = signal[i] * Math.sqrt(0.5 * (1 - pan[i]))
        right[i] = signal[i] * Math.sqrt(0.5 * (1 + pan[i]))
      }

      // Create audio buffer
      const audioContext = new AudioContext()
      const audioBuffer = audioContext.createBuffer(2, numSamples, fs)

      const leftChannel = audioBuffer.getChannelData(0)
      const rightChannel = audioBuffer.getChannelData(1)

      for (let i = 0; i < numSamples; i++) {
        leftChannel[i] = left[i]
        rightChannel[i] = right[i]
      }

      const wav = audioBufferToWav(audioBuffer)
      const blob = new Blob([wav], { type: "audio/wav" })
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)

      const downsampleFactor = Math.max(1, Math.floor(numSamples / 1000))
      const plotLength = Math.floor(numSamples / downsampleFactor)
      const plotTime: number[] = []
      const plotAmplitude: number[] = []
      const plotFreq: number[] = []

      for (let i = 0; i < plotLength; i++) {
        const idx = i * downsampleFactor
        plotTime.push(t[idx])
        plotAmplitude.push(signal[idx])
        plotFreq.push(f_o[idx])
      }

      setPlotData({
        time: plotTime,
        amplitude: plotAmplitude,
        observedFreq: plotFreq,
      })

      toast({
        title: "Sound Generated",
        description: "Doppler effect audio has been generated successfully.",
      })
    } catch (error) {
      console.error("[v0] Error generating Doppler sound:", error)
      toast({
        title: "Generation Failed",
        description: "Failed to generate Doppler sound. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const numChannels = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const format = 1
    const bitDepth = 16

    const bytesPerSample = bitDepth / 8
    const blockAlign = numChannels * bytesPerSample

    const data = []
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = buffer.getChannelData(channel)[i]
        const int16 = Math.max(-1, Math.min(1, sample)) * 0x7fff
        data.push(int16)
      }
    }

    const dataLength = data.length * bytesPerSample
    const bufferLength = 44 + dataLength
    const arrayBuffer = new ArrayBuffer(bufferLength)
    const view = new DataView(arrayBuffer)

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, "RIFF")
    view.setUint32(4, bufferLength - 8, true)
    writeString(8, "WAVE")
    writeString(12, "fmt ")
    view.setUint32(16, 16, true)
    view.setUint16(20, format, true)
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * blockAlign, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bitDepth, true)
    writeString(36, "data")
    view.setUint32(40, dataLength, true)

    let offset = 44
    for (let i = 0; i < data.length; i++) {
      view.setInt16(offset, data[i], true)
      offset += 2
    }

    return arrayBuffer
  }

  const drawPlots = () => {
    if (!plotData) return

    const canvasAmp = canvasAmplitudeRef.current
    if (canvasAmp) {
      const ctx = canvasAmp.getContext("2d")
      if (ctx) {
        drawPlot(
          ctx,
          canvasAmp,
          plotData.time,
          plotData.amplitude,
          "Amplitude vs Time",
          "Time (s)",
          "Amplitude",
          "#3b82f6",
        )
      }
    }

    const canvasFreq = canvasFreqRef.current
    if (canvasFreq) {
      const ctx = canvasFreq.getContext("2d")
      if (ctx) {
        drawPlot(
          ctx,
          canvasFreq,
          plotData.time,
          plotData.observedFreq,
          "Observed Frequency vs Time",
          "Time (s)",
          "Frequency (Hz)",
          "#f59e0b",
        )
      }
    }
  }

  const drawPlot = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    xData: number[],
    yData: number[],
    title: string,
    xLabel: string,
    yLabel: string,
    color: string,
  ) => {
    const padding = 50
    const width = canvas.width - 2 * padding
    const height = canvas.height - 2 * padding

    ctx.fillStyle = "#0a0a0a"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = "#1a1a1a"
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * width
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, padding + height)
      ctx.stroke()

      const y = padding + (i / 10) * height
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(padding + width, y)
      ctx.stroke()
    }

    ctx.strokeStyle = "#4a4a4a"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, padding + height)
    ctx.lineTo(padding + width, padding + height)
    ctx.stroke()

    const xMin = Math.min(...xData)
    const xMax = Math.max(...xData)
    const yMin = Math.min(...yData)
    const yMax = Math.max(...yData)

    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()

    xData.forEach((x, i) => {
      const xPos = padding + ((x - xMin) / (xMax - xMin)) * width
      const yPos = padding + height - ((yData[i] - yMin) / (yMax - yMin)) * height

      if (i === 0) {
        ctx.moveTo(xPos, yPos)
      } else {
        ctx.lineTo(xPos, yPos)
      }
    })

    ctx.stroke()

    ctx.fillStyle = "#ffffff"
    ctx.font = "12px sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(xLabel, padding + width / 2, canvas.height - 10)

    ctx.save()
    ctx.translate(15, padding + height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(yLabel, 0, 0)
    ctx.restore()

    ctx.font = "14px sans-serif"
    ctx.fillText(title, canvas.width / 2, 20)
  }

  useEffect(() => {
    if (plotData) {
      drawPlots()
    }
  }, [plotData])

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="frequency" className="text-foreground">
              Source Frequency (Hz)
            </Label>
            <Input
              id="frequency"
              type="number"
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
              min={100}
              max={2000}
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">Typical: 650 Hz (ambulance siren)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="velocity" className="text-foreground">
              Source Velocity (m/s)
            </Label>
            <Input
              id="velocity"
              type="number"
              value={velocity}
              onChange={(e) => setVelocity(Number(e.target.value))}
              min={1}
              max={100}
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">Typical: 20 m/s (car speed)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="text-foreground">
              Duration (seconds)
            </Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={1}
              max={30}
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">Audio length</p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={generateDopplerSound} disabled={isGenerating} className="flex-1">
            <Play className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Generate Sound"}
          </Button>

          {audioUrl && (
            <Button variant="outline" asChild>
              <a href={audioUrl} download="doppler_sound.wav">
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            </Button>
          )}
        </div>
      </Card>

      {audioUrl && (
        <Card className="p-4 bg-card">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-secondary" />
              <h3 className="font-semibold text-foreground">Generated Audio</h3>
            </div>
            <audio controls src={audioUrl} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Use headphones for best 8D panning effect (left to right as source passes)
            </p>
          </div>
        </Card>
      )}

      {plotData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4 bg-card">
            <canvas
              ref={canvasAmplitudeRef}
              width={600}
              height={300}
              className="w-full border border-border rounded-md"
            />
          </Card>

          <Card className="p-4 bg-card">
            <canvas ref={canvasFreqRef} width={600} height={300} className="w-full border border-border rounded-md" />
          </Card>
        </div>
      )}
    </div>
  )
}
