import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Radio } from "lucide-react"
import DopplerGenerator from "./doppler-generator"
import DopplerAnalyzer from "./doppler-analyzer"

export default function DopplerAnalysis() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Doppler Effect Analysis</h2>
        <p className="text-muted-foreground">Generate and analyze Doppler-shifted audio signals</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            Doppler Effect Simulator
          </CardTitle>
          <CardDescription>Simulate moving sound sources and analyze frequency shifts</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generate">Generate Sound</TabsTrigger>
              <TabsTrigger value="analyze">Analyze Sound</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-4 mt-4">
              <DopplerGenerator />
            </TabsContent>

            <TabsContent value="analyze" className="space-y-4 mt-4">
              <DopplerAnalyzer />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
