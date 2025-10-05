"use client"
import { lazy } from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Activity, Play, Pause, RotateCcw, AlertCircle, Brain, CheckCircle2 } from "lucide-react"
import { predictECG, DISEASE_NAMES, type ECGPredictionResponse } from "../lib/ecg"
import { useToast } from "../hooks/use-toast"

const LinearECGPlot = lazy(() => import("./ecg-linear-plot"))
const PolarECGPlot = lazy(() => import("./ecg-polar-plot"))
const RecurrencePlot = lazy(() => import("./ecg-recurrence-plot"))
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

  const [predicting, setPredicting] = useState(false)
  const [prediction, setPrediction] = useState<ECGPredictionResponse | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    console.log("rendering ......")
    const patients = getAvailablePatients()

    setAvailablePatients(patients)
    if (patients.length > 0) {
      setSelectedPatient(patients[0])
    }
    console.log("Available patients:", patients)
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
    setPrediction(null)

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

  const handlePredict = async () => {
    if (!selectedPatient || !recordingId) {
      toast({
        title: "Error",
        description: "Please load a recording first",
        variant: "destructive",
      })
      return
    }

    setPredicting(true)
    setPrediction(null)

    try {
      // Format: /{patientFolder}/{Record_id}
      const jsonPath = `${selectedPatient}/${recordingId.padStart(5, "0").concat("_hr.json")}`
      const result = await predictECG(jsonPath)

      setPrediction(result)
      toast({
        title: "Prediction Complete",
        description: "ECG analysis has been completed successfully",
      })
    } catch (err) {
      console.error("[v0] Prediction error:", err)
      toast({
        title: "Prediction Failed",
        description: err instanceof Error ? err.message : "Failed to analyze ECG",
        variant: "destructive",
      })
    } finally {
      setPredicting(false)
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

      {currentRecording && (
        <Card className="border-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-secondary" />
              AI-Powered ECG Analysis
            </CardTitle>
            <CardDescription>Detect cardiac abnormalities using machine learning</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={handlePredict} disabled={predicting} className="w-full md:w-auto">
                <Brain className="h-4 w-4 mr-2" />
                {predicting ? "Analyzing..." : "Analyze ECG"}
              </Button>

              {prediction && prediction.status === "success" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(prediction.data.probabilities).map(([key, probability]) => {
                      const isPredicted =
                        prediction.data.predictions[key as keyof typeof prediction.data.predictions] === 1
                      const percentage = (probability * 100).toFixed(2)

                      return (
                        <Card key={key} className={isPredicted ? "border-destructive/50 bg-destructive/5" : ""}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-sm font-medium">{DISEASE_NAMES[key]}</CardTitle>
                                <p className="text-xs text-muted-foreground mt-1">{key}</p>
                              </div>
                              {isPredicted ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-destructive text-destructive-foreground ml-2">
                                  <AlertCircle className="h-3 w-3" />
                                  Detected
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border border-border bg-background ml-2">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Normal
                                </span>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Probability</span>
                                <span className="font-medium">{percentage}%</span>
                              </div>
                              <div className="h-2 w-full bg-secondary/20 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-secondary transition-all duration-500 ease-out rounded-full"
                                  style={{ width: `${probability * 100}%` }}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  {prediction.data.summary && prediction.data.summary.length > 0 && (
                    <Card className="bg-muted/50">
                      <CardHeader>
                        <CardTitle className="text-sm">Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1 text-sm">
                          {prediction.data.summary.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-muted-foreground">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
