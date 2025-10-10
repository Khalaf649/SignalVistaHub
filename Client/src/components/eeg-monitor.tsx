"use client";
import { useState } from "react";
import type EEGRecording from "../interfaces/EEGData";
import { preprocessEDF, fetchEEGData } from "../lib/eeg";
import EEGCard from "./eeg-card";

export default function EEGMonitor() {
  const [currentRecording, setCurrentRecording] = useState<EEGRecording | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".edf")) {
      setError("Please upload a valid .edf file");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError("File is too large. Please upload a smaller EDF file.");
      return;
    }

    setError(null);
    setCurrentRecording(null);
    setLoading(true);

    try {
      setLoadingMessage("Preprocessing EDF file...");
      const preprocessResponse = await preprocessEDF(file);

      setLoadingMessage(
        "Fetching EEG data (this may take a moment for large files)..."
      );
      const eegData = await fetchEEGData(preprocessResponse.access_url);

      const duration = (eegData.data[0]?.length || 0) / eegData.samplingRate!;
      const transposedData: number[][] = eegData.data[0].map(
        (_: number, colIndex: number) =>
          eegData.data.map((row: number[]) => row[colIndex])
      );

      const EEGdata: EEGRecording = {
        samplingRate: eegData.samplingRate!,
        channels: eegData.channels,
        data: transposedData,
        duration,
      };

      setCurrentRecording(EEGdata);
      setLoadingMessage("");
    } catch (err) {
      console.error("[EEGMonitor] Error:", err);
      setError(
        "Failed to process EDF file. Please check the file format and try again."
      );
      setLoadingMessage("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">EEG Monitor</h2>
        <p className="text-muted-foreground">
          Upload an EEG <code>.edf</code> file to view signals
        </p>
      </div>

      <div className="flex items-center gap-4">
        <input
          type="file"
          accept=".edf"
          onChange={handleFileUpload}
          className="border border-gray-300 rounded-lg p-2 text-sm"
        />
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground animate-pulse">
          {loadingMessage}
        </div>
      )}

      {error && <div className="text-red-500 text-sm">{error}</div>}

      {currentRecording && (
        <div className="mt-6">
          <EEGCard
            channels={currentRecording.channels}
            data={currentRecording.data}
            samplingRate={currentRecording.samplingRate}
            duration={currentRecording.duration}
          />
        </div>
      )}
    </div>
  );
}
