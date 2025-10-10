"use client";

import { useEffect, useRef, useState } from "react";

interface PolarSignalPlotProps {
  data: number[][]; // Changed to 2D array: [sample][channel]
  samplingRate: number; // Sampling rate in Hz
  isPlaying: boolean;
  channelNames: string[]; // Changed to array for multiple channels
  windowDuration: number; // Cycle duration in seconds
  speed: number; // Playback speed multiplier
  signalType: string;
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

export default function PolarSignalPlot({
  data,
  samplingRate,
  isPlaying,
  channelNames,
  windowDuration = 2,
  speed = 1,
}: PolarSignalPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataBuffer, setDataBuffer] = useState<number[][]>([]);
  const animationRef = useRef<number>(0);
  const dataPointerRef = useRef(0);
  const samplesPerCycle = windowDuration * samplingRate;

  const getNextSamples = (numSamples: number): number[][] => {
    if (!data || data.length === 0) return [];

    const samples: number[][] = [];
    for (let i = 0; i < numSamples; i++) {
      const sampleIndex = (dataPointerRef.current + i) % data.length;
      if (data[sampleIndex]) {
        samples.push([...data[sampleIndex]]);
      }
    }

    dataPointerRef.current =
      (dataPointerRef.current + samples.length) % data.length;
    return samples;
  };

  useEffect(() => {
    const animate = () => {
      if (!isPlaying) return;

      const stepSize = Math.max(1, Math.round((samplingRate * speed) / 60));
      const newSamples = getNextSamples(stepSize);
      if (newSamples.length === 0) return;

      setDataBuffer((prev) => {
        const updated = [...prev, ...newSamples];
        if (updated.length > samplesPerCycle) {
          return updated.slice(-samplesPerCycle);
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
    dataPointerRef.current = 0;
  }, [data, windowDuration]);

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
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 20;

    // Clear and draw background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid circles
    ctx.strokeStyle = "#f0f0f0";
    ctx.lineWidth = 1;

    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (i / 5) * maxRadius, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw radial lines
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + maxRadius * Math.cos(angle),
        centerY + maxRadius * Math.sin(angle)
      );
      ctx.stroke();
    }

    if (dataBuffer.length < 2) return;

    // Transpose data for easier channel-wise processing
    const channelData = transposeData(dataBuffer);

    // Draw each channel's polar plot
    channelData.forEach((channelBuffer, channelIndex) => {
      if (channelBuffer.length < 2) return;

      // Normalize this channel to [-1, 1]
      const minY = Math.min(...channelBuffer);
      const maxY = Math.max(...channelBuffer);
      const range = maxY - minY;
      const normalize = (y: number): number => {
        if (range === 0) return 0;
        return (2 * (y - minY)) / range - 1;
      };

      ctx.strokeStyle = CHANNEL_COLORS[channelIndex % CHANNEL_COLORS.length];
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      channelBuffer.forEach((value, sampleIndex) => {
        const normalizedValue = normalize(value);
        const angle =
          ((sampleIndex % samplesPerCycle) / samplesPerCycle) * 2 * Math.PI;
        const radius = maxRadius * 0.5 + normalizedValue * maxRadius * 0.4;

        const x = centerX + radius * Math.cos(angle - Math.PI / 2);
        const y = centerY + radius * Math.sin(angle - Math.PI / 2);

        if (sampleIndex === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw channel indicator at the end of the line
      if (channelBuffer.length > 0) {
        const lastSampleIndex = channelBuffer.length - 1;
        const lastValue = normalize(channelBuffer[lastSampleIndex]);
        const lastAngle =
          ((lastSampleIndex % samplesPerCycle) / samplesPerCycle) * 2 * Math.PI;
        const lastRadius = maxRadius * 0.5 + lastValue * maxRadius * 0.4;

        const lastX = centerX + lastRadius * Math.cos(lastAngle - Math.PI / 2);
        const lastY = centerY + lastRadius * Math.sin(lastAngle - Math.PI / 2);

        ctx.fillStyle = CHANNEL_COLORS[channelIndex % CHANNEL_COLORS.length];
        ctx.beginPath();
        ctx.arc(lastX, lastY, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Draw center point
    ctx.fillStyle = "#6366f1";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
    ctx.fill();

    // Draw legend
    const legendX = 10;
    const legendY = 20;
    const legendItemHeight = 15;

    channelData.forEach((_, channelIndex) => {
      const yPos = legendY + channelIndex * legendItemHeight;

      // Color box
      ctx.fillStyle = CHANNEL_COLORS[channelIndex % CHANNEL_COLORS.length];
      ctx.fillRect(legendX, yPos, 10, 8);

      // Channel name
      ctx.fillStyle = "#000000";
      ctx.font = "10px Arial";
      ctx.fillText(
        channelNames[channelIndex] || `Ch ${channelIndex + 1}`,
        legendX + 15,
        yPos + 8
      );
    });
  }, [dataBuffer, samplesPerCycle, channelNames]);

  return (
    <div className="w-full">
      <canvas
        ref={canvasRef}
        width={600}
        height={300}
        className="w-full border border-border rounded-md"
      />
      <div className="mt-2 text-sm text-muted-foreground text-center">
        Polar Representation ({channelNames.join(", ")}) | Radius = Normalized
        Amplitude [-1,1] | Cycle: {windowDuration} seconds ({samplesPerCycle}{" "}
        samples) | Total: {dataBuffer.length} samples | Channels:{" "}
        {channelNames.length}
      </div>
    </div>
  );
}
