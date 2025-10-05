"use client"

import { useEffect, useState } from "react"
import LinearSignalPlot from "./plots/linear-signal-plot"

interface XorECGPlotProps {
  channel1: number
  channel2: number
  channel1Name: string
  channel2Name: string
  recording: any
  isPlaying: boolean
  threshold?: number
}

export default function XorECGPlot({
  channel1,
  channel2,
  channel1Name,
  channel2Name,
  recording,
  isPlaying,
  threshold = 0.1,
}: XorECGPlotProps) {
  const [xorSignal, setXorSignal] = useState<number[]>([])

  // Process the XOR signal
  useEffect(() => {
    if (!recording?.signals) {
      setXorSignal([])
      return
    }

    const signal1 = recording.signals.map((sample: number[]) => sample[channel1])
    const signal2 = recording.signals.map((sample: number[]) => sample[channel2])
    
    const processedSignal: number[] = []
    
    for (let i = 0; i < Math.min(signal1.length, signal2.length); i++) {
      const primaryValue = signal1[i]
      const secondaryValue = signal2[i]
      const absoluteDifference = Math.abs(primaryValue - secondaryValue)
      
      // Only include primary value if difference exceeds threshold
      if (absoluteDifference > threshold) {
        processedSignal.push(primaryValue)
      } else {
        processedSignal.push(NaN) // Use 0 for no plot, or you could use null/undefined
      }
    }
    
    setXorSignal(processedSignal)
  }, [recording, channel1, channel2, threshold])

  if (!recording || !recording.signals || recording.signals.length === 0) {
    return <div className="text-muted-foreground">No recording data available</div>
  }

  return (
    <div className="space-y-2">
      <LinearSignalPlot
        data={xorSignal}
        samplingRate={recording.samplingRate || 500}
        isPlaying={isPlaying}
        channelName={`XOR: ${channel1Name} (diff > ${threshold}mV)`}
        signalType="ECG"
      />
    </div>
  )
}