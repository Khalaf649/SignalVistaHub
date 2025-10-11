"use client";
import { useState } from "react";
import EcgCard from "./components/ecg-card";

import type ECGData from "../ECG/interfaces/ECGData";

export default function ECGMonitor() {
  const [ecgData, setEcgData] = useState<ECGData | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!json.leads || !json.samplingRate || !json.signals) {
          alert("Invalid ECG JSON format. Missing required fields.");
          return;
        }

        const parsedData: ECGData = {
          leads: json.leads,
          samplingRate: json.samplingRate,
          signals: json.signals,
        };
        console.log("Parsed ECG Data:", parsedData);

        setEcgData(parsedData);
      } catch (error) {
        console.error("Error reading JSON file:", error);
        alert("Failed to read JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">ECG Monitor</h2>
        <p className="text-muted-foreground">
          Upload an ECG JSON file to view signals
        </p>
      </div>

      <div className="flex items-center gap-4">
        <input
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          className="border border-gray-300 rounded-lg p-2 text-sm"
        />
      </div>

      {ecgData && (
        <div className="mt-6">
          <EcgCard
            leads={ecgData.leads}
            samplingRate={ecgData.samplingRate}
            signals={ecgData.signals}
          />
        </div>
      )}
    </div>
  );
}
