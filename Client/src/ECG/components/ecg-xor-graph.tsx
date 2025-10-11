"use client";

import { useEffect, useState } from "react";
import LinearSignalPlot from "../../components/plots/linear-plot";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../components/ui/select";

import type ECGData from "../interfaces/ECGData";

interface XorECGPlotProps {
  data: ECGData;
}

export default function XorECGPlot({ data }: XorECGPlotProps) {
  const [primaryChannel, setPrimaryChannel] = useState<string>(data.leads[0]);
  const [secondaryChannel, setSecondaryChannel] = useState<string>(
    data.leads[1] || data.leads[0]
  );
  const [threshold, setThreshold] = useState<number>(0.1);
  const [speed, setSpeed] = useState<number>(1);
  const [windowTime, setWindowTime] = useState<number>(5);
  const [xorSignal, setXorSignal] = useState<number[][]>([]); // 2D array (n × 1)

  // 🧩 Compute XOR-like signal
  useEffect(() => {
    const ch1Index = data.leads.indexOf(primaryChannel);
    const ch2Index = data.leads.indexOf(secondaryChannel);

    if (
      ch1Index === -1 ||
      ch2Index === -1 ||
      !data.signals ||
      data.signals.length === 0
    )
      return;

    const signal1 = data.signals.map((s) => s[ch1Index]);
    const signal2 = data.signals.map((s) => s[ch2Index]);

    const processed1D = signal1.map((v, i) => {
      const diff = Math.abs(v - signal2[i]);
      return diff > threshold ? v : NaN;
    });

    // ✅ Make it a 2D array (n × 1)
    const processed2D = processed1D.map((v) => [v]);

    setXorSignal(processed2D);
  }, [data, primaryChannel, secondaryChannel, threshold]);

  return (
    <Card className="border-secondary/30 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          ECG XOR Analysis
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Primary Channel */}
          <div className="space-y-2">
            <Label>Primary Channel</Label>
            <Select
              value={primaryChannel}
              onValueChange={(val) => setPrimaryChannel(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Primary" />
              </SelectTrigger>
              <SelectContent>
                {data.leads.map((lead) => (
                  <SelectItem key={lead} value={lead}>
                    {lead}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Secondary Channel */}
          <div className="space-y-2">
            <Label>Secondary Channel</Label>
            <Select
              value={secondaryChannel}
              onValueChange={(val) => setSecondaryChannel(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Secondary" />
              </SelectTrigger>
              <SelectContent>
                {data.leads.map((lead) => (
                  <SelectItem key={lead} value={lead}>
                    {lead}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Threshold */}
          <div className="space-y-1">
            <Label>Threshold (mV): {threshold.toFixed(2)}</Label>
            <input
              type="range"
              min={0.01}
              max={1.0}
              step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          {/* Speed */}
          <div className="space-y-1">
            <Label>Speed</Label>
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="border rounded px-2 py-1 w-full"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={4}>4x</option>
            </select>
          </div>

          {/* Window Size */}
          <div className="space-y-1">
            <Label>Window Size (s)</Label>
            <input
              type="number"
              min={1}
              max={30}
              value={windowTime}
              onChange={(e) => setWindowTime(Number(e.target.value))}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
        </div>

        <div>
          <LinearSignalPlot
            data={xorSignal}
            samplingRate={data.samplingRate}
            isPlaying={true}
            channelNames={[`XOR: ${primaryChannel} vs ${secondaryChannel}`]}
            signalType="ECG"
            speed={speed}
            windowDuration={windowTime}
            Normalize={false}
          />
        </div>
      </CardContent>
    </Card>
  );
}
