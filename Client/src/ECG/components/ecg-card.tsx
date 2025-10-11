"use client";
import { Radio } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import ECGPlot from "./ecg-plotting";
import ECGPrediction from "./ecg-prediction";
import ECGReoccurence from "./ecg-reoccurence";
import ECGXORGraph from "./ecg-xor-graph";
import type EcgData from "../interfaces/ECGData";

export default function ECGCard({ leads, samplingRate, signals }: EcgData) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-primary" />
          ECG Signal Analyzer
        </CardTitle>
        <CardDescription>
          Analyze and visualize ECG signals for heart rate and rhythm
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="plotting">ECG plotting</TabsTrigger>
            <TabsTrigger value="prediction">AI prediction ECG</TabsTrigger>
            <TabsTrigger value="reoccurence">Reoccurence ECG</TabsTrigger>
            <TabsTrigger value="xor graph">XOR Graph ECG</TabsTrigger>
          </TabsList>

          <TabsContent value="plotting" className="space-y-4 mt-4">
            <ECGPlot data={{ leads, samplingRate, signals }} />
          </TabsContent>

          <TabsContent value="prediction" className="space-y-4 mt-4">
            <ECGPrediction />
          </TabsContent>

          <TabsContent value="reoccurence" className="space-y-4 mt-4">
            <ECGReoccurence data={{ leads, samplingRate, signals }} />
          </TabsContent>
          <TabsContent value="xor graph" className="space-y-4 mt-4">
            <ECGXORGraph data={{ leads, samplingRate, signals }} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
