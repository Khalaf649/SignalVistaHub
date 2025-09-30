"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Activity, Play, Pause, RotateCcw, AlertCircle } from "lucide-react"
import LinearECGPlot from "./ecg-linear-plot"
import PolarECGPlot from "./ecg-polar-plot"
import RecurrencePlot from "./ecg-recurrence-plot"
import { getAvailablePatients, loadECGRecording, type ECGRecording } from "../data/ecg-data-loader"

export default function ECGMonitor() {
  const [availablePatients, setAvailablePatients] = useState<string[]>([])
  const [selectedPatient, setSelectedPatient] = useState<string>("")
  const [recordingId, setRecordingId] = useState<string>("1")
  const [currentRecording, setCurrentRecording] = useState<ECGRecording | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [primaryChannel, setPrimaryChannel] = useState(0)
  const [secondaryChannel, setSecondaryChannel] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [plotMode, setPlotMode] = useState<"linear" | "polar">("linear")

  useEffect(() => {
    const patients = getAvailablePatients()
    setAvailablePatients(patients)
    if (patients.length > 0) {
      setSelectedPatient(patients[0])
    }
  }, [])

  const handleLoadRecording = async () => {
    if (!selectedPatient || !recordingId) {
      setError("Please select a patient and enter a recording ID")
      return
    }

    const recordingNum = Number.parseInt(recordingId)
    if (isNaN(recordingNum) || recordingNum < 1 || recordingNum > 999) {
      setError("Recording ID must be between 1 and 999")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const recording = await loadECGRecording(selectedPatient, recordingId)
      if (recording) {
        setCurrentRecording(recording)
        setPrimaryChannel(0)
        setSecondaryChannel(Math.min(1, recording.leads.length - 1))
        setIsPlaying(false)
        setError(null)
      } else {
        setError(`Recording ${recordingId} not found for patient ${selectedPatient}`)
      }
    } catch (err) {
      setError("Failed to load recording. Check console for details.")
      console.error("[v0] Load error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setIsPlaying(false)
  }

  const availableLeads = currentRecording?.leads || []

  if (availablePatients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-secondary" />
            ECG Real-Time Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 py-8">
            <div className="flex items-start gap-2 text-destructive">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">No patient data available</p>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-3 text-sm">
              <p className="font-medium">Expected Data Structure:</p>
              <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
                {`public/
└── ecg-data/
    └── records500/
        ├── 00000/
        │   ├── 00001_hr.json
        │   ├── 00002_hr.json
        │   └── ... (up to 00999_hr.json)
        ├── 01000/
        │   ├── 01001_hr.json
        │   └── ...
        └── ... (up to 21000/)`}
              </pre>
              <p className="text-muted-foreground">
                Place your ECG JSON files in the structure above. Each patient folder (00000, 01000, ..., 21000)
                contains recording files numbered 00001_hr.json through 00999_hr.json.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-secondary" />
            ECG Real-Time Monitor
          </CardTitle>
          <CardDescription>
            Real ECG data from records500 - Select patient, enter recording ID (1-999), and choose visualization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patient-select">Patient Folder</Label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger id="patient-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availablePatients.map((patient) => (
                    <SelectItem key={patient} value={patient}>
                      {patient}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recording-id">Recording ID (1-999)</Label>
              <div className="flex gap-2">
                <Input
                  id="recording-id"
                  type="number"
                  min="1"
                  max="999"
                  value={recordingId}
                  onChange={(e) => setRecordingId(e.target.value)}
                  placeholder="1-999"
                />
                <Button onClick={handleLoadRecording} disabled={loading}>
                  {loading ? "Loading..." : "Load"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary-channel">Primary Channel</Label>
              <Select
                value={primaryChannel.toString()}
                onValueChange={(v) => setPrimaryChannel(Number.parseInt(v))}
                disabled={!currentRecording}
              >
                <SelectTrigger id="primary-channel">
                  <SelectValue />
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
              <Label htmlFor="secondary-channel">Secondary Channel</Label>
              <Select
                value={secondaryChannel.toString()}
                onValueChange={(v) => setSecondaryChannel(Number.parseInt(v))}
                disabled={!currentRecording}
              >
                <SelectTrigger id="secondary-channel">
                  <SelectValue />
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

            <div className="space-y-2">
              <Label>Controls</Label>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsPlaying(!isPlaying)}
                  variant={isPlaying ? "destructive" : "default"}
                  className="flex-1"
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
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {currentRecording && (
            <div className="mt-4 text-sm text-muted-foreground">
              Recording: {currentRecording.id} | Sampling Rate: {currentRecording.samplingRate} Hz | Duration:{" "}
              {currentRecording.duration.toFixed(1)}s | Leads: {currentRecording.leads.length} | Samples:{" "}
              {currentRecording.signals.length}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visualization Area */}
      {currentRecording && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Primary Channel Plot */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {availableLeads[primaryChannel]} - {plotMode === "linear" ? "Linear" : "Polar"} View
              </CardTitle>
            </CardHeader>
            <CardContent>
              {plotMode === "linear" ? (
                <LinearECGPlot
                  channel={primaryChannel}
                  isPlaying={isPlaying}
                  channelName={availableLeads[primaryChannel]}
                  recording={currentRecording}
                />
              ) : (
                <PolarECGPlot
                  channel={primaryChannel}
                  isPlaying={isPlaying}
                  channelName={availableLeads[primaryChannel]}
                  recording={currentRecording}
                />
              )}
            </CardContent>
          </Card>

          {/* Recurrence Plot */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Recurrence: {availableLeads[primaryChannel]} vs {availableLeads[secondaryChannel]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RecurrencePlot
                channel1={primaryChannel}
                channel2={secondaryChannel}
                isPlaying={isPlaying}
                channel1Name={availableLeads[primaryChannel]}
                channel2Name={availableLeads[secondaryChannel]}
                recording={currentRecording}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
