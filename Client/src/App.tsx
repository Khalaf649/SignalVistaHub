"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card"
import { Activity, Radio, Brain, Waves, Plane } from "lucide-react"

import { lazy,Suspense } from "react"

const ECGMonitor = lazy(() => import("./components/ecg-monitor"))

const DopplerAnalysis = lazy(() => import("./components/doppler-analysis"))

const DroneTelemetry = lazy(() => import("./components/drone-telemetry"))

export default function App() {
  const [activeTab, setActiveTab] = useState("ecg")

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">DSP Signal Processing Suite</h1>
              <p className="text-sm text-muted-foreground">Real-time signal analysis and visualization</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-chart-3 animate-pulse" />
              <span className="text-sm text-muted-foreground">System Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="ecg" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              ECG Monitor
            </TabsTrigger>
            <TabsTrigger value="doppler" className="flex items-center gap-2">
              <Radio className="h-4 w-4" />
              Doppler Effect
            </TabsTrigger>
            <TabsTrigger value="eeg" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              EEG Analysis
            </TabsTrigger>
            <TabsTrigger value="submarines" className="flex items-center gap-2">
              <Waves className="h-4 w-4" />
              Submarines
            </TabsTrigger>
            <TabsTrigger value="drones" className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              Drones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ecg" className="space-y-4">
            <Suspense fallback={<div className="text-center text-muted-foreground">Loading ECG Monitor...</div>}>
              <ECGMonitor />
            </Suspense>
          </TabsContent>

          <TabsContent value="doppler" className="space-y-4">
            <Suspense fallback={<div className="text-center text-muted-foreground">Loading Doppler Analysis...</div>}>
              <DopplerAnalysis />
            </Suspense>
          </TabsContent>

          <TabsContent value="eeg" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-secondary" />
                  EEG Analysis Module
                </CardTitle>
                <CardDescription>Electroencephalography signal processing and analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64 border-2 border-dashed border-border rounded-lg">
                  <div className="text-center">
                    <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">EEG module coming soon</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      This section will include brainwave analysis and visualization
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submarines" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Waves className="h-5 w-5 text-secondary" />
                  Submarine Detection Module
                </CardTitle>
                <CardDescription>Underwater acoustic signal processing and detection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64 border-2 border-dashed border-border rounded-lg">
                  <div className="text-center">
                    <Waves className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Submarine detection module coming soon</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      This section will include sonar signal analysis and tracking
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drones" className="space-y-4">
            <Suspense fallback={<div className="text-center text-muted-foreground">Loading Drone Telemetry...</div>}>
              <DroneTelemetry />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
