"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Label } from "../components/ui/label"
import { Card } from "../components/ui/card"
import { Upload, Volume2 } from "lucide-react"
import { useToast } from "../hooks/use-toast"

export default function DopplerAnalyzer() {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [plotData, setPlotData] = useState<{
    time: number[]
    amplitude: number[]
    dominantFreq: number[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasAmplitudeRef = useRef<HTMLCanvasElement>(null)
  const canvasFreqRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("audio/")) {
        toast({
          title: "Invalid File",
          description: "Please select an audio file.",
          variant: "destructive",
        })
        return
      }
      setAudioFile(file)
      setAudioUrl(URL.createObjectURL(file))
      setPlotData(null)
    }
  }

  const analyzeAudio = async () => {
    if (!audioFile) return

    setIsAnalyzing(true)

    try {
      const arrayBuffer = await audioFile.arrayBuffer()
      const audioContext = new AudioContext()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      const channelData = audioBuffer.getChannelData(0)
      const sampleRate = audioBuffer.sampleRate

      const time = Array.from({ length: channelData.length }, (_, i) => i / sampleRate)

      const downsampleFactor = Math.max(1, Math.floor(channelData.length / 2000))
      const plotTime = time.filter((_, i) => i % downsampleFactor === 0)
      const plotAmplitude = Array.from(channelData).filter((_, i) => i % downsampleFactor === 0)

      const windowSize = 2048
      const hopSize = 512
      const dominantFreqs: number[] = []

      for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
        const window = channelData.slice(i, i + windowSize)

        const hammingWindow = window.map((val, idx) => {
          const hamming = 0.54 - 0.46 * Math.cos((2 * Math.PI * idx) / (windowSize - 1))
          return val * hamming
        })

        const fft = computeFFT(hammingWindow)
        const magnitudes = fft.map((c) => Math.sqrt(c.real * c.real + c.imag * c.imag))

        const maxIdx = magnitudes.indexOf(Math.max(...magnitudes.slice(0, magnitudes.length / 2)))
        const dominantFreq = (maxIdx * sampleRate) / windowSize

        dominantFreqs.push(dominantFreq)
      }

      setPlotData({
        time: plotTime,
        amplitude: plotAmplitude,
        dominantFreq: dominantFreqs,
      })

      toast({
        title: "Analysis Complete",
        description: "Audio file has been analyzed successfully.",
      })
    } catch (error) {
      console.error("[v0] Error analyzing audio:", error)
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze audio file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const computeFFT = (signal: number[]): { real: number; imag: number }[] => {
    const N = signal.length
    const result: { real: number; imag: number }[] = []

    for (let k = 0; k < N; k++) {
      let real = 0
      let imag = 0

      for (let n = 0; n < N; n++) {
        const angle = (2 * Math.PI * k * n) / N
        real += signal[n] * Math.cos(angle)
        imag -= signal[n] * Math.sin(angle)
      }

      result.push({ real, imag })
    }

    return result
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
        const freqTimes = Array.from({ length: plotData.dominantFreq.length }, (_, i) => (i * 512) / 44100)
        drawPlot(
          ctx,
          canvasFreq,
          freqTimes,
          plotData.dominantFreq,
          "Dominant Frequency vs Time",
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
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="audio-file" className="text-foreground">
              Upload Audio File
            </Label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                id="audio-file"
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1">
                <Upload className="h-4 w-4 mr-2" />
                {audioFile ? audioFile.name : "Choose Audio File"}
              </Button>

              {audioFile && (
                <Button onClick={analyzeAudio} disabled={isAnalyzing}>
                  {isAnalyzing ? "Analyzing..." : "Analyze"}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Upload a WAV, MP3, or other audio file to analyze</p>
          </div>
        </div>
      </Card>

      {audioUrl && (
        <Card className="p-4 bg-card">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-secondary" />
              <h3 className="font-semibold text-foreground">Audio Preview</h3>
            </div>
            <audio controls src={audioUrl} className="w-full" />
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
