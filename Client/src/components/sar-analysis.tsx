"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { Waves, RefreshCw, Download, ImageIcon } from "lucide-react"
import { useToast } from "../hooks/use-toast"
import { fetchSARImage, type SARImageResponse } from "../lib/sar"

export default function SARAnalysis() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [imageData, setImageData] = useState<SARImageResponse | null>(null)
  const { toast } = useToast()

  const generateImage = async () => {
    setIsGenerating(true)

    try {
      const response = await fetchSARImage()

      setImageData(response)

      toast({
        title: "Image Generated",
        description: "SAR analysis image has been generated successfully.",
      })
    } catch (error) {
      console.error("[v0] Error generating SAR image:", error)
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate SAR image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-6 bg-card">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Waves className="h-6 w-6 text-secondary" />
              <h2 className="text-2xl font-bold text-foreground">SAR Image Analysis</h2>
            </div>
            <p className="text-sm text-muted-foreground">Synthetic Aperture Radar imaging and signal processing</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={generateImage} disabled={isGenerating} size="lg">
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Generate Image
                </>
              )}
            </Button>
            {imageData?.access_url && (
              <Button variant="outline" size="lg" asChild>
                <a href={imageData.access_url} download="sar_image.png" target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Image Display Card */}
      <Card className="p-6 bg-card border-2 border-border/50 hover:border-secondary/50 transition-colors">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-secondary animate-pulse" />
            <h3 className="text-lg font-semibold text-foreground">SAR Image Output</h3>
          </div>

          <div className="relative rounded-lg border-2 border-border bg-muted/30 overflow-hidden min-h-[500px] flex items-center justify-center">
            {imageData?.access_url ? (
              <div className="w-full h-full">
                <img
                  src={imageData.access_url || "/placeholder.svg"}
                  alt="SAR Analysis Result"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.error("[v0] Error loading image:", e)
                    toast({
                      title: "Image Load Error",
                      description: "Failed to load the generated image. Please try again.",
                      variant: "destructive",
                    })
                  }}
                />
              </div>
            ) : (
              <div className="text-center p-12">
                <Waves className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-lg text-muted-foreground font-medium">No image generated yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Click "Generate Image" to create a SAR analysis visualization
                </p>
              </div>
            )}
          </div>

          {imageData?.message && (
            <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/30">
              <p className="text-sm text-foreground">
                <span className="font-semibold text-secondary">Info:</span> {imageData.message}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Information Card */}
      <Card className="p-6 bg-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">About SAR Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">Key Features</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>High-resolution radar imaging</li>
              <li>All-weather, day/night operation</li>
              <li>Ground penetration capabilities</li>
              <li>Target detection and classification</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">Applications</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Terrain mapping and surveillance</li>
              <li>Environmental monitoring</li>
              <li>Military reconnaissance</li>
              <li>Disaster assessment</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
