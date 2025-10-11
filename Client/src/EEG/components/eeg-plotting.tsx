"use client";
import { useState } from "react";
import LinearECG from "../../components/plots/linear-plot";
import PolarECGPlot from "../../components/plots/polar-plot";
import type EEGData from "../interfaces/EEGData";

interface EEGPlotProps {
  data: EEGData;
}

export default function EEGPlot({ data }: EEGPlotProps) {
  const [selectedLeads, setSelectedLeads] = useState<string[]>([
    data.channels[0],
  ]);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [windowSize, setWindowSize] = useState(5);

  const handleLeadChange = (lead: string) => {
    setSelectedLeads((prev) =>
      prev.includes(lead) ? prev.filter((l) => l !== lead) : [...prev, lead]
    );
  };

  // Filter and prepare data for selected leads - returns n samples * m channels
  const getSelectedSignals = (): number[][] => {
    if (!data.data || data.data.length === 0) return [];

    // Get indices of selected leads
    const selectedIndices = selectedLeads.map((lead) =>
      data.channels.indexOf(lead)
    );

    // For each sample, only include the selected channels
    return data.data.map((sample) =>
      selectedIndices.map((channelIndex) => sample[channelIndex])
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground mb-4">
        EEG Plot Controls
      </h2>

      {/* --- Control Panel --- */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Lead Selection */}
        <div>
          <label className="font-medium">Leads:</label>
          <div className="flex gap-2 flex-wrap mt-1">
            {data.channels.map((lead) => (
              <label key={lead} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={selectedLeads.includes(lead)}
                  onChange={() => handleLeadChange(lead)}
                />
                <span>{lead}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Speed */}
        <div>
          <label className="font-medium">Speed:</label>
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="border rounded px-2 py-1 ml-2"
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
          </select>
        </div>

        {/* Window Size */}
        <div>
          <label className="font-medium">Window Size (s):</label>
          <input
            type="number"
            min={1}
            max={30}
            value={windowSize}
            onChange={(e) => setWindowSize(Number(e.target.value))}
            className="border rounded px-2 py-1 w-16 ml-2"
          />
        </div>

        {/* Pause/Resume */}
        <button
          onClick={() => setIsPaused((p) => !p)}
          className={`px-4 py-2 rounded text-white ${
            isPaused ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {isPaused ? "Resume" : "Pause"}
        </button>
      </div>

      {/* --- EEG Display --- */}
      <LinearECG
        data={getSelectedSignals()}
        samplingRate={data.samplingRate}
        isPlaying={!isPaused}
        speed={speed}
        windowDuration={windowSize}
        signalType="EEG"
        channelNames={selectedLeads}
      />
      <PolarECGPlot
        data={getSelectedSignals()}
        samplingRate={data.samplingRate}
        isPlaying={!isPaused}
        speed={speed}
        windowDuration={windowSize}
        signalType="EEG"
        channelNames={selectedLeads}
      />
    </div>
  );
}
