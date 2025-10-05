"use client"

import { useEffect, useRef, useState } from "react"
import { PolarPlot } from "./plots/polar-signal-plot"

type EEGRecording = {
  id: string
  samplingRate: number
  duration: number
  leads: string[]
  signals: number[][]
}

interface PolarEEGPlotProps {
  channel: number
  isPlaying: boolean
  channelName: string
  recording: EEGRecording | null
}

export default function PolarEEGPlot({ channel, isPlaying, channelName, recording }: PolarEEGPlotProps) {
  const [dataBuffer, setDataBuffer] = useState<number[]>([])
  const animationRef = useRef<number>(0)
  const dataPointerRef = useRef(0)
  const samplesPerCycle = recording ? recording.samplingRate / 2 : 1000 // Half second cycle
  const stepSize = 20 // Add samples in smaller chunks for smooth animation

  const getNextSamples = (): number[] => {
    if (!recording || !recording.signals || recording.signals.length === 0) {
      return []
    }

    const channelData = recording.signals[channel] || []
    const maxSamples = Math.min(5000, channelData.length)

    const samples: number[] = []
    for (let i = 0; i < stepSize; i++) {
      const idx = dataPointerRef.current + i
      if (idx >= maxSamples) {
        break
      }
      samples.push(channelData[idx])
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

  return (
    <div className="w-full">
      <PolarPlot
        data={dataBuffer}
        samplesPerCycle={samplesPerCycle}
        width={600}
        height={300}
        className="w-full border border-border rounded-md"
        minValue={-600}
        maxValue={600}
        autoNormalize={true} // Use auto normalization for EEG to handle varying amplitudes
      />
      <div className="mt-2 text-sm text-muted-foreground text-center">
        Polar Representation (R-θ) | Radius = Amplitude | Cycle: 0.5 seconds ({samplesPerCycle} samples) | Total:{" "}
        {dataBuffer.length} samples (max 5000)
      </div>
    </div>
  )
}
