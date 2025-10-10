"use client";

import { useEffect, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LinearSignalPlotProps {
  data: number[][]; // Corrected: [sample][channel] - n samples * n channels
  samplingRate: number; // Sampling rate in Hz
  isPlaying: boolean;
  channelNames: string[]; // Array for multiple channels
  signalType: string; // "ECG" or "EEG" for display
  windowDuration: number; // in seconds, default 10s
  speed: number; // Playback speed multiplier, default 1x
}

// Color palette for multiple channels
const CHANNEL_COLORS = [
  "rgb(99, 102, 241)", // indigo
  "rgb(239, 68, 68)", // red
  "rgb(34, 197, 94)", // green
  "rgb(234, 179, 8)", // yellow
  "rgb(168, 85, 247)", // purple
  "rgb(14, 165, 233)", // blue
  "rgb(249, 115, 22)", // orange
  "rgb(20, 184, 166)", // teal
  "rgb(16, 185, 129)", // emerald
  "rgb(244, 63, 94)", // rose
  "rgb(132, 204, 22)", // lime
  "rgb(79, 70, 229)", // violet
];

export default function LinearSignalPlot({
  data,
  samplingRate,
  isPlaying,
  channelNames,
  signalType = "Signal",
  windowDuration,
  speed,
}: LinearSignalPlotProps) {
  const [dataBuffer, setDataBuffer] = useState<number[][]>([]);
  const [currentTimeOffset, setCurrentTimeOffset] = useState(0);
  const animationRef = useRef<number>(0);
  const dataPointerRef = useRef(0);

  const windowSize = windowDuration * samplingRate; // Dynamic window size based on duration

  const getNextSamples = (numToAdd: number): number[][] => {
    if (!data || data.length === 0) return [];

    const samples: number[][] = [];
    let remaining = numToAdd;

    while (remaining > 0) {
      const sampleIndex = dataPointerRef.current % data.length;

      // Get all channel values for this sample
      if (data[sampleIndex]) {
        samples.push([...data[sampleIndex]]);
      }

      dataPointerRef.current++;
      remaining--;
    }

    // Keep pointer bounded
    dataPointerRef.current = dataPointerRef.current % data.length;

    // Update time offset
    setCurrentTimeOffset(
      (dataPointerRef.current / samplingRate) % (data.length / samplingRate)
    );

    return samples;
  };

  // Transpose data from [sample][channel] to [channel][sample] for easier processing
  const transposeData = (sampleData: number[][]): number[][] => {
    if (sampleData.length === 0) return [];

    const numChannels = sampleData[0].length;
    const transposed: number[][] = Array(numChannels)
      .fill(null)
      .map(() => []);

    sampleData.forEach((sample) => {
      sample.forEach((value, channelIdx) => {
        transposed[channelIdx].push(value);
      });
    });

    return transposed;
  };

  useEffect(() => {
    const windowSize = windowDuration * samplingRate;
    const animate = () => {
      if (!isPlaying) return;

      const samplesPerFrame = Math.max(
        1,
        Math.round((samplingRate * speed) / 60)
      );
      const newSamples = getNextSamples(samplesPerFrame);
      if (newSamples.length === 0) return;

      setDataBuffer((prev) => {
        // Add new samples to buffer
        const updated = [...prev, ...newSamples];

        // Trim to window size
        if (updated.length > windowSize) {
          return updated.slice(-windowSize);
        }
        return updated;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, data, samplingRate, windowDuration, speed]);

  useEffect(() => {
    setDataBuffer([]);
    setCurrentTimeOffset(0);
    dataPointerRef.current = 0;
  }, [data]);

  const currentEndTime = currentTimeOffset;
  const currentStartTime = Math.max(0, currentEndTime - windowDuration);

  // Transpose the buffer for chart display [channel][sample]
  const transposedData = transposeData(dataBuffer);

  // Generate datasets for each channel with normalization to [-1, 1]
  const chartData = {
    datasets: transposedData
      .map((channelData, channelIndex) => {
        if (channelData.length === 0) return null;

        const minY = Math.min(...channelData);
        const maxY = Math.max(...channelData);
        const range = maxY - minY;
        const normalize = (y: number): number => {
          if (range === 0) return 0;
          return (2 * (y - minY)) / range - 1;
        };

        return {
          label: channelNames[channelIndex] || `Channel ${channelIndex + 1}`,
          data: channelData.map((value, sampleIndex) => ({
            x: currentStartTime + sampleIndex / samplingRate,
            y: normalize(value),
          })),
          borderColor: CHANNEL_COLORS[channelIndex % CHANNEL_COLORS.length],
          backgroundColor:
            CHANNEL_COLORS[channelIndex % CHANNEL_COLORS.length] + "20",
          borderWidth: 1.5,
          fill: false,
          pointRadius: 0,
          tension: 0,
        };
      })
      .filter(
        (dataset): dataset is NonNullable<typeof dataset> => dataset !== null
      ),
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0,
    },
    scales: {
      x: {
        type: "linear" as const,
        display: true,
        title: {
          display: true,
          text: "Time (s)",
        },
        grid: {
          color: "rgba(240, 240, 240, 0.5)",
        },
        min: currentStartTime,
        max: currentEndTime,
        ticks: {
          stepSize: Math.max(0.5, windowDuration / 5),
          callback: (value: any) => `${Math.round(value * 10) / 10}s`,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: "Normalized Amplitude [-1, 1]",
        },
        grid: {
          color: "rgba(240, 240, 240, 0.5)",
        },
        min: -1,
        max: 1,
      },
    },
    plugins: {
      legend: {
        display: transposedData.length > 1, // Show legend only for multiple channels
        position: "top" as const,
      },
      title: {
        display: true,
        text: `${signalType} | Time: ${
          Math.round(currentStartTime * 10) / 10
        }s - ${Math.round(currentEndTime * 10) / 10}s`,
        font: {
          size: 16,
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            const time = context.parsed.x;
            return `${label}: ${value.toFixed(2)} at ${
              Math.round(time * 10) / 10
            }s`;
          },
        },
      },
    },
    elements: {
      point: {
        radius: 0,
      },
      line: {
        tension: 0,
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  };

  return (
    <div className="w-full h-80 bg-white rounded-lg border border-gray-200 p-4">
      <Line options={chartOptions} data={chartData} />
      <div className="mt-2 flex justify-between items-center text-xs">
        <span>Channels: {transposedData.length}</span>
        <span>Sampling Rate: {samplingRate}Hz</span>
        <span>Speed: {speed}x</span>
      </div>
    </div>
  );
}
