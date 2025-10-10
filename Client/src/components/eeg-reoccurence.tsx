"use client";

import { useState, useMemo } from "react";
import RecurrencePlot from "./plots/recurrence-plot";
import type EEGData from "../interfaces/EEGData";

interface EEGReoccurenceProps {
  data: EEGData;
}

export default function EEGReoccurence({ data }: EEGReoccurenceProps) {
  const [primaryLead, setPrimaryLead] = useState<string>("");
  const [secondaryLead, setSecondaryLead] = useState<string>("");

  // ✅ Extract the channel (column) for each lead, since signals are [samples][channels]
  const channelSignals = useMemo(() => {
    if (!data.data || data.data.length === 0) return [];
    const numChannels = data.data[0].length;
    const channels = Array.from({ length: numChannels }, (_, i) =>
      data.data.map((row) => row[i])
    );
    return channels;
  }, [data.data]);

  // ✅ Lead selections
  const handlePrimaryChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setPrimaryLead(e.target.value);

  const handleSecondaryChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setSecondaryLead(e.target.value);

  const channel1Index = data.channels.indexOf(primaryLead);
  const channel2Index = data.channels.indexOf(secondaryLead);

  const channel1Data =
    channel1Index !== -1 ? channelSignals[channel1Index] : null;
  const channel2Data =
    channel2Index !== -1 ? channelSignals[channel2Index] : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          ECG Recurrence Analysis
        </h2>
        <p className="text-muted-foreground">
          Select two ECG leads to visualize their recurrence relationship.
        </p>
      </div>

      {/* Lead Selection */}
      <div className="flex flex-wrap items-center gap-6">
        {/* Primary Channel */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Primary Channel</label>
          <select
            value={primaryLead}
            onChange={handlePrimaryChange}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
          >
            <option value="">-- Select Primary Lead --</option>
            {data.channels.map((lead) => (
              <option key={lead} value={lead}>
                {lead}
              </option>
            ))}
          </select>
        </div>

        {/* Secondary Channel */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Secondary Channel</label>
          <select
            value={secondaryLead}
            onChange={handleSecondaryChange}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
          >
            <option value="">-- Select Secondary Lead --</option>
            {data.channels.map((lead) => (
              <option key={lead} value={lead}>
                {lead}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Recurrence Plot */}
      {primaryLead && secondaryLead && channel1Data && channel2Data ? (
        <div className="mt-6">
          <RecurrencePlot
            channel1Data={channel1Data}
            channel2Data={channel2Data}
            channel1Name={primaryLead}
            channel2Name={secondaryLead}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mt-4">
          Please select both channels to generate the recurrence plot.
        </p>
      )}
    </div>
  );
}
