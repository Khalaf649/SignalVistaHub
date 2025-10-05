'use client'

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card } from "./ui/card"
import { Play, Download, Volume2 } from "lucide-react"
import { useToast } from "../hooks/use-toast"

// Import Plotly
import Plot from 'react-plotly.js';
import { fetchDopplerAudio, fetchDopplerPlotData, type DopplerPlotData } from "../lib/doppler"

export default function DopplerGenerator() {
  const [frequency, setFrequency] = useState(650)
  const [velocity, setVelocity] = useState(20)
  const [duration, setDuration] = useState(10)
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [plotData, setPlotData] = useState<DopplerPlotData | null>(null)
  const { toast } = useToast()

  // Prepare chart data based on plotData - YOUR EXISTING LOGIC
  const chartData =
    plotData && plotData.time && Array.isArray(plotData.time)
      ? plotData.time.map((time, index) => ({
          time: time,
          frequency: (plotData.frequency || plotData.freq)?.[index] || 0,
          amplitude: (plotData.amplitude || plotData.amp)?.[index] || 0,
        }))
      : []

  const generateDopplerSound = async () => {
    setIsGenerating(true)
    try {
      const params = { frequency, velocity, duration }
      const [audioBlob, plotDataResponse] = await Promise.all([
        fetchDopplerAudio(params),
        fetchDopplerPlotData(params)
      ])
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)
      setPlotData(plotDataResponse)
      toast({
        title: "Sound Generated",
        description: "Doppler effect audio has been generated successfully.",
      })
    } catch (error) {
      console.error("Error generating Doppler sound:", error)
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate Doppler sound. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Modern color scheme
  const chartColors = {
    frequency: 'hsl(210, 100%, 60%)',  // Vibrant blue
    amplitude: 'hsl(340, 90%, 60%)',   // Vibrant pink
    grid: 'hsl(var(--border))',
    background: 'transparent',
    text: 'hsl(var(--foreground))'
  }

  return (
    <div className="space-y-6">
      {/* Input Card - Unchanged from your original code */}
      <Card className="p-6 bg-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="frequency" className="text-foreground">Source Frequency (Hz)</Label>
            <Input id="frequency" type="number" value={frequency} onChange={(e) => setFrequency(Number(e.target.value))} min={100} max={2000} className="bg-background" />
            <p className="text-xs text-muted-foreground">Typical: 650 Hz (ambulance siren)</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="velocity" className="text-foreground">Source Velocity (m/s)</Label>
            <Input id="velocity" type="number" value={velocity} onChange={(e) => setVelocity(Number(e.target.value))} min={1} max={100} className="bg-background" />
            <p className="text-xs text-muted-foreground">Typical: 20 m/s (car speed)</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-foreground">Duration (seconds)</Label>
            <Input id="duration" type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={1} max={30} className="bg-background" />
            <p className="text-xs text-muted-foreground">Audio length</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={generateDopplerSound} disabled={isGenerating} className="flex-1">
            <Play className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Generate Sound"}
          </Button>
          {audioUrl && (
            <Button variant="outline" asChild>
              <a href={audioUrl} download="doppler_sound.wav">
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            </Button>
          )}
        </div>
      </Card>

      {/* Audio Player Card - Unchanged from your original code */}
      {audioUrl && (
        <Card className="p-6 bg-card">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-secondary" />
              <h3 className="font-semibold text-foreground">Generated Audio</h3>
            </div>
            <audio controls src={audioUrl} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Use headphones for best 8D panning effect (left to right as source passes)
            </p>
          </div>
        </Card>
      )}

      {/* Enhanced Plotly.js Charts with Modern Animations */}
      {plotData && chartData.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enhanced Frequency Chart */}
            <Card className="p-6 bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">Observed Frequency vs Time</h3>
              <Plot
                data={[
                  {
                    x: chartData.map(d => d.time),
                    y: chartData.map(d => d.frequency),
                    type: 'scatter',
                    mode: 'lines',
                    line: { 
                      color: chartColors.frequency, 
                      width: 4,
                      shape: 'spline',
                      smoothing: 1.3
                    },
                    name: 'Frequency (Hz)',
                    hovertemplate: 'Time: %{x:.2f}s<br>Frequency: %{y:.1f} Hz<extra></extra>',
                  }
                ]}
                layout={{
                  height: 400,
                  xaxis: {
                    title: {
                      text: 'Time (seconds)',
                      font: {
                        family: 'Inter, sans-serif',
                        size: 12,
                        color: chartColors.text
                      }
                    },
                    gridcolor: chartColors.grid,
                    gridwidth: 1,
                    showline: true,
                    linecolor: chartColors.grid,
                    linewidth: 1,
                    zeroline: false,
                    tickfont: {
                      family: 'Inter, sans-serif',
                      size: 10,
                      color: chartColors.text
                    }
                  },
                  yaxis: {
                    title: {
                      text: 'Frequency (Hz)',
                      font: {
                        family: 'Inter, sans-serif',
                        size: 12,
                        color: chartColors.text
                      }
                    },
                    gridcolor: chartColors.grid,
                    gridwidth: 1,
                    showline: true,
                    linecolor: chartColors.grid,
                    linewidth: 1,
                    zeroline: false,
                    tickfont: {
                      family: 'Inter, sans-serif',
                      size: 10,
                      color: chartColors.text
                    }
                  },
                  plot_bgcolor: chartColors.background,
                  paper_bgcolor: chartColors.background,
                  font: { color: chartColors.text, family: 'Inter, sans-serif' },
                  hoverlabel: {
                    bgcolor: 'hsl(var(--background))',
                    bordercolor: 'hsl(var(--border))',
                    font: { family: 'Inter, sans-serif' }
                  },
                  showlegend: false,
                  margin: { t: 10, r: 40, b: 60, l: 60 },
                }}
                config={{
                  displayModeBar: true,
                  displaylogo: false,
                  responsive: true,
                  modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
                  scrollZoom: true,
                }}
                style={{ width: '100%' }}
                onInitialized={(figure) => {
                  // Trigger smooth animation after chart initialization
                  setTimeout(() => {
                    const event = new Event('restyle');
                    window.dispatchEvent(event);
                  }, 100);
                }}
              />
            </Card>

            {/* Enhanced Amplitude Chart */}
            <Card className="p-6 bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">Amplitude vs Time</h3>
              <Plot
                data={[
                  {
                    x: chartData.map(d => d.time),
                    y: chartData.map(d => d.amplitude),
                    type: 'scatter',
                    mode: 'lines',
                    line: { 
                      color: chartColors.amplitude, 
                      width: 4,
                      shape: 'spline',
                      smoothing: 1.3
                    },
                    name: 'Amplitude',
                    hovertemplate: 'Time: %{x:.2f}s<br>Amplitude: %{y:.3f}<extra></extra>',
                  }
                ]}
                layout={{
                  height: 400,
                  xaxis: {
                    title: {
                      text: 'Time (seconds)',
                      font: {
                        family: 'Inter, sans-serif',
                        size: 12,
                        color: chartColors.text
                      }
                    },
                    gridcolor: chartColors.grid,
                    gridwidth: 1,
                    showline: true,
                    linecolor: chartColors.grid,
                    linewidth: 1,
                    zeroline: false,
                    tickfont: {
                      family: 'Inter, sans-serif',
                      size: 10,
                      color: chartColors.text
                    }
                  },
                  yaxis: {
                    title: {
                      text: 'Amplitude',
                      font: {
                        family: 'Inter, sans-serif',
                        size: 12,
                        color: chartColors.text
                      }
                    },
                    gridcolor: chartColors.grid,
                    gridwidth: 1,
                    showline: true,
                    linecolor: chartColors.grid,
                    linewidth: 1,
                    zeroline: false,
                    tickfont: {
                      family: 'Inter, sans-serif',
                      size: 10,
                      color: chartColors.text
                    }
                  },
                  plot_bgcolor: chartColors.background,
                  paper_bgcolor: chartColors.background,
                  font: { color: chartColors.text, family: 'Inter, sans-serif' },
                  hoverlabel: {
                    bgcolor: 'hsl(var(--background))',
                    bordercolor: 'hsl(var(--border))',
                    font: { family: 'Inter, sans-serif' }
                  },
                  showlegend: false,
                  margin: { t: 10, r: 40, b: 60, l: 60 },
                }}
                config={{
                  displayModeBar: true,
                  displaylogo: false,
                  responsive: true,
                  modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
                  scrollZoom: true,
                }}
                style={{ width: '100%' }}
                onInitialized={(figure) => {
                  setTimeout(() => {
                    const event = new Event('restyle');
                    window.dispatchEvent(event);
                  }, 100);
                }}
              />
            </Card>
          </div>

          {/* Stats Section - Unchanged from your original code */}
          {plotData?.stats && (
            <Card className="p-6 bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">Doppler Effect Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm text-muted-foreground mb-2 font-medium">Maximum Frequency</p>
                  <p className="text-3xl font-bold text-chart-1">{plotData.stats.max_observed?.toFixed(1)} Hz</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm text-muted-foreground mb-2 font-medium">Minimum Frequency</p>
                  <p className="text-3xl font-bold text-chart-1">{plotData.stats.min_observed?.toFixed(1)} Hz</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm text-muted-foreground mb-2 font-medium">Frequency Shift Ratio</p>
                  <p className="text-3xl font-bold text-chart-2">{plotData.stats.shift_ratio?.toFixed(3)}x</p>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}