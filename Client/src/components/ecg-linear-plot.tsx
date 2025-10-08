"use client"

import LinearSignalPlot from "./plots/linear-signal-plot"
import type { ECGRecording } from "../data/ecg-data-loader"

interface LinearECGPlotProps {
  channel: number
  isPlaying: boolean
  channelName: string
  recording: ECGRecording | null
}

export default function LinearECGPlot({ channel, isPlaying, channelName, recording }: LinearECGPlotProps) {
  if (!recording || !recording.signals || recording.signals.length === 0) {
    return <div className="text-muted-foreground">No recording data available</div>
  }

  // Extract channel data from 2D array
  const channelData = recording.signals.map((sample) => sample[channel])

  return (
    <LinearSignalPlot
      data={channelData}
      samplingRate={500}
      isPlaying={isPlaying}
      channelName={channelName}
      signalType="ECG"
    />
  )
}
