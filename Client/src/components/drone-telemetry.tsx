"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Label } from "./ui/label"
import { Button } from "./ui/button"
import { Plane, Upload, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Input } from "./ui/input"
import { useToast } from "../hooks/use-toast"

interface PredictionResult {
  classification: string
  confidence: number
  status: string
}

export default function DroneTelemetry() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check if file is audio
      if (!file.type.startsWith("audio/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an audio file",
          variant: "destructive",
        })
        return
      }
      setSelectedFile(file)
      setPredictionResult(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select an audio file first",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setPredictionResult(null)

    try {
      const formData = new FormData()
      formData.append("audio", selectedFile)

      console.log("[v0] Uploading file to prediction API:", selectedFile.name)

      const response = await fetch("http://127.0.0.1:5000/predictDrone", {
        method: "POST",
        body: formData,
      })
      console.log("[v0] Response:", response)

      console.log("[v0] Response status:", response.status)

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`)
      }

      const result: PredictionResult = await response.json()
      console.log("[v0] Prediction result:", result)

      setPredictionResult(result)

      toast({
        title: "Analysis complete",
        description: `Drone classified as: ${result.classification}`,
      })
    } catch (error) {
      console.error("[v0] Error uploading file:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to analyze audio file",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPredictionResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-secondary" />
            Drone Audio Classification
          </CardTitle>
          <CardDescription>Upload drone audio for AI-powered classification and analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="audio-file">Audio File</Label>
              <div className="flex gap-2">
                <Input
                  id="audio-file"
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="flex-1"
                />
                <Button onClick={handleReset} variant="outline" disabled={isUploading || !selectedFile}>
                  Reset
                </Button>
              </div>
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {/* Upload Button */}
            <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="w-full" size="lg">
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Analyze
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Panel */}
      {predictionResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {predictionResult.status === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-chart-3" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              Analysis Results
            </CardTitle>
            <CardDescription>AI classification results for the uploaded audio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Classification */}
              <div className="p-4 rounded-lg bg-muted">
                <Label className="text-sm text-muted-foreground">Classification</Label>
                <p className="text-2xl font-bold text-foreground mt-1">{predictionResult.classification}</p>
              </div>

              {/* Confidence */}
              <div className="p-4 rounded-lg bg-muted">
                <Label className="text-sm text-muted-foreground">Confidence</Label>
                <div className="flex items-end gap-2 mt-1">
                  <p className="text-2xl font-bold text-foreground">
                    {(predictionResult.confidence * 100).toFixed(2)}%
                  </p>
                  <div className="flex-1 h-4 bg-background rounded-full overflow-hidden mb-1">
                    <div
                      className="h-full bg-chart-1 transition-all duration-500"
                      style={{ width: `${predictionResult.confidence * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="p-4 rounded-lg bg-muted">
                <Label className="text-sm text-muted-foreground">Status</Label>
                <div className="flex items-center gap-2 mt-1">
                  {predictionResult.status === "success" ? (
                    <CheckCircle2 className="h-5 w-5 text-chart-3" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <p className="text-xl font-semibold text-foreground capitalize">{predictionResult.status}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      {!predictionResult && !selectedFile && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Plane className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Upload Drone Audio</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Select an audio file containing drone sounds to classify the drone type using AI-powered analysis. The
                system will return the classification, confidence level, and processing status.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
