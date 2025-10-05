"use client"

import RecurrencePlot from "./plots/recurrence-plot"

type EEGRecording = {
  id: string
  samplingRate: number
  duration: number
  leads: string[]
  signals: number[][]
}

interface EEGRecurrencePlotProps {
  channel1: number
  channel2: number
  channel1Name: string
  channel2Name: string
  recording: EEGRecording | null
  isPlaying: boolean
}

export default function EEGRecurrencePlot({
  channel1,
  channel2,
  channel1Name,
  channel2Name,
  recording,
}: EEGRecurrencePlotProps) {
  if (!recording) {
    return <div className="flex items-center justify-center h-96 text-muted-foreground">No recording loaded</div>
  }

  const channel1Data = recording.signals[channel1] || []
  const channel2Data = recording.signals[channel2] || []

  return (
    <RecurrencePlot
      channel1Data={channel1Data}
      channel2Data={channel2Data}
      channel1Name={channel1Name}
      channel2Name={channel2Name}
      maxSamples={500}
    />
  )
}
