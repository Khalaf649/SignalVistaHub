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
import type EEGData from "../interfaces/EEGData";
import EEGPlot from "../components/eeg-plotting";
import EEGReoccurence from "../components/eeg-reoccurence";

export default function EEGCard({
  channels,
  samplingRate,
  data,
  duration,
}: EEGData) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-primary" />
          EEG Signal Analyzer
        </CardTitle>
        <CardDescription>Analyze and visualize EEG signals</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plotting">ECG plotting</TabsTrigger>
            <TabsTrigger value="reoccurence">Reoccurence ECG</TabsTrigger>
          </TabsList>

          <TabsContent value="plotting" className="space-y-4 mt-4">
            {<EEGPlot data={{ channels, samplingRate, data, duration }} />}
          </TabsContent>

          <TabsContent value="reoccurence" className="space-y-4 mt-4">
            {
              <EEGReoccurence
                data={{ channels, samplingRate, data, duration }}
              />
            }
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
