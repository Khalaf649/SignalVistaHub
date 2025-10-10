"use client";

import type React from "react";
import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Upload, Volume2, Sparkles } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { predictDoppler } from "../lib/doppler";

export default function DopplerAnalyzer() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState<{
    predictedFrequency: number;
    predictedVelocity: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("audio/")) {
        toast({
          title: "Invalid File",
          description: "Please select an audio file.",
          variant: "destructive",
        });
        return;
      }
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
      setPredictionResult(null);
    }
  };

  const handleAIPrediction = async () => {
    if (!audioFile) return;

    setIsPredicting(true);

    try {
      const result = await predictDoppler(audioFile);
      setPredictionResult(result);
      toast({
        title: "AI Prediction Complete",
        description: "Source frequency and velocity have been predicted.",
      });
    } catch (error) {
      console.error("[v0] Error predicting Doppler:", error);
      toast({
        title: "Prediction Failed",
        description: "Failed to predict Doppler parameters. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-card">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="audio-file" className="text-foreground">
              Upload Audio File
            </Label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                id="audio-file"
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                {audioFile ? audioFile.name : " Choose Audio File"}
              </Button>

              {audioFile && (
                <Button
                  onClick={handleAIPrediction}
                  disabled={isPredicting}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isPredicting ? "Predicting..." : "AI Predict"}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Upload a WAV, MP3, or other audio file to analyze
            </p>
          </div>
        </div>
      </Card>

      {predictionResult && (
        <Card className="p-6 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <h3 className="font-semibold text-foreground text-lg">
                AI Prediction Results
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-background/50 rounded-lg p-4 border border-purple-500/20">
                <p className="text-sm text-muted-foreground mb-1">
                  Predicted Source Frequency
                </p>
                <p className="text-2xl font-bold text-purple-400">
                  {predictionResult.predictedFrequency.toFixed(2)} Hz
                </p>
              </div>
              <div className="bg-background/50 rounded-lg p-4 border border-blue-500/20">
                <p className="text-sm text-muted-foreground mb-1">
                  Predicted Source Velocity
                </p>
                <p className="text-2xl font-bold text-blue-400">
                  {predictionResult.predictedVelocity.toFixed(2)} m/s
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {audioUrl && (
        <Card className="p-4 bg-card">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-secondary" />
              <h3 className="font-semibold text-foreground">Audio Preview</h3>
            </div>
            <audio controls src={audioUrl} className="w-full" />
          </div>
        </Card>
      )}
    </div>
  );
}
