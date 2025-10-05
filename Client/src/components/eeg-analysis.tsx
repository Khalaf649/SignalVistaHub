"use client"
import { lazy, Suspense } from "react"
import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Brain, Play, Pause, RotateCcw, AlertCircle, Upload, Loader2 } from "lucide-react"
import { preprocessEDF, fetchEEGData } from "../lib/eeg"

const LinearEEGPlot = lazy(() => import("./eeg-linear-plot"))
const PolarEEGPlot = lazy(() => import("./eeg-polar-plot"))

type EEGRecording = {
  id: string
  samplingRate: number
  duration: number
  leads: string[]
  signals: number[][]
}

export default function EEGAnalysis() {
  const [currentRecording, setCurrentRecording] = useState<EEGRecording | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [selectedChannel, setSelectedChannel] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [plotMode, setPlotMode] = useState<"linear" | "polar">("linear")

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".edf")) {
      setError("Please upload a valid .edf file")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Step 1: Preprocess the EDF file
      setLoadingMessage("Preprocessing EDF file...")
      const preprocessResponse = await preprocessEDF(file)

      console.log("[v0] Preprocess response:", preprocessResponse)

      // Step 2: Fetch the actual data from the access URL (this is the 200MB file)
      setLoadingMessage("Fetching EEG data (this may take a moment for large files)...")
      const eegData = await fetchEEGData(preprocessResponse.access_url)

      console.log("[v0] EEG data loaded, channels:", eegData.channels.length)

      // Calculate sampling rate and duration from the data if not provided
      const samplingRate = eegData.samplingRate || 256 // Default to 256 Hz if not provided
      const duration = eegData.duration || (eegData.data[0]?.length || 0) / samplingRate

      const recording: EEGRecording = {
        id: file.name,
        samplingRate,
        duration,
        leads: eegData.channels,
        signals: eegData.data,
      }

      setCurrentRecording(recording)
      setSelectedChannel(0)
      setIsPlaying(false)
      setError(null)
      setLoadingMessage("")
    } catch (err) {
      setError("Failed to process EDF file. Please check the file format and try again.")
      console.error("[v0] EEG preprocessing error:", err)
      setLoadingMessage("")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setIsPlaying(false)
  }

  const availableLeads = currentRecording?.leads || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">EEG Analysis</h2>
        <p className="text-muted-foreground">Electroencephalography signal processing and analysis</p>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            EEG Signal Processor
          </CardTitle>
          <CardDescription>
            Upload EDF files to visualize brain wave patterns and analyze frequency bands
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edf-upload">Upload EDF File</Label>
              <div className="flex gap-2">
                <Input
                  id="edf-upload"
                  type="file"
                  accept=".edf"
                  onChange={handleFileUpload}
                  disabled={loading}
                  className="flex-1"
                />
                <Button variant="outline" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel-select">Channel</Label>
              <Select
                value={selectedChannel.toString()}
                onValueChange={(v) => setSelectedChannel(Number.parseInt(v))}
                disabled={!currentRecording}
              >
                <SelectTrigger id="channel-select">
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  {availableLeads.map((channel, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>
                      {channel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plot-mode">Plot Mode</Label>
              <Select value={plotMode} onValueChange={(v: "linear" | "polar") => setPlotMode(v)}>
                <SelectTrigger id="plot-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear (V-T)</SelectItem>
                  <SelectItem value="polar">Polar (R-θ)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => setIsPlaying(!isPlaying)}
              variant={isPlaying ? "destructive" : "default"}
              disabled={!currentRecording}
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
            <Button onClick={handleReset} variant="outline" disabled={!currentRecording}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {loading && loadingMessage && (
            <div className="mt-4 flex items-center gap-2 text-primary text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p>{loadingMessage}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {currentRecording && (
            <div className="mt-4 text-sm text-muted-foreground">
              Recording: {currentRecording.id} | Sampling Rate: {currentRecording.samplingRate} Hz | Duration:{" "}
              {currentRecording.duration.toFixed(1)}s | Channels: {currentRecording.leads.length}
            </div>
          )}
        </CardContent>
      </Card>

      {currentRecording && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {availableLeads[selectedChannel]} - {plotMode === "linear" ? "Linear" : "Polar"} View
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-96">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              }
            >
              {plotMode === "linear" ? (
                <LinearEEGPlot
                  channel={selectedChannel}
                  isPlaying={isPlaying}
                  channelName={availableLeads[selectedChannel]}
                  recording={currentRecording}
                />
              ) : (
                <PolarEEGPlot
                  channel={selectedChannel}
                  isPlaying={isPlaying}
                  channelName={availableLeads[selectedChannel]}
                  recording={currentRecording}
                />
              )}
            </Suspense>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
