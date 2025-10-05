"use client"

import PolarSignalPlot from "./plots/polar-signal-plot-ecg"
import type { ECGRecording } from "../data/ecg-data-loader"

interface PolarECGPlotProps {
  channel: number
  isPlaying: boolean
  channelName: string
  recording: ECGRecording | null
}

export default function PolarECGPlot({ channel, isPlaying, channelName, recording }: PolarECGPlotProps) {
  if (!recording || !recording.signals || recording.signals.length === 0) {
    return <div className="text-muted-foreground">No recording data available</div>
  }

  // Extract channel data from 2D array
  const channelData = recording.signals.map((sample) => sample[channel])

  return (
    <PolarSignalPlot
      data={channelData}
      samplingRate={recording.samplingRate}
      isPlaying={isPlaying}
      channelName={channelName}
    />
  )
}
