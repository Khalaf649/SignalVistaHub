"use client"

import LinearSignalPlot from "./plots/linear-signal-plot"

type EEGRecording = {
  id: string
  samplingRate: number
  duration: number
  leads: string[]
  signals: number[][]
}

interface LinearEEGPlotProps {
  channel: number
  isPlaying: boolean
  channelName: string
  recording: EEGRecording | null
}

export default function LinearEEGPlot({ channel, isPlaying, channelName, recording }: LinearEEGPlotProps) {
  if (!recording || !recording.signals || recording.signals.length === 0) {
    return <div className="text-muted-foreground">No recording data available</div>
  }

  const channelData = recording.signals[channel] || []

  return (
    <LinearSignalPlot
      data={channelData}
      samplingRate={recording.samplingRate}
      isPlaying={isPlaying}
      channelName={channelName}
      signalType="EEG"
    />
  )
}
