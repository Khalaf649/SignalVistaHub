"use client"

import { useEffect, useRef, useState } from "react"
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
} from "chart.js"
import { Line } from "react-chartjs-2"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface LinearSignalPlotProps {
  data: number[] // Signal data array
  samplingRate: number // Sampling rate in Hz
  isPlaying: boolean
  channelName: string
  signalType?: string // "ECG" or "EEG" for display
}

export default function LinearSignalPlot({
  data,
  samplingRate,
  isPlaying,
  channelName,
  signalType = "Signal",
}: LinearSignalPlotProps) {
  const [dataBuffer, setDataBuffer] = useState<number[]>([])
  const [currentTimeOffset, setCurrentTimeOffset] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [windowDuration, setWindowDuration] = useState(2)
  const animationRef = useRef<number>(0)
  const dataPointerRef = useRef(0)

  const windowSize = windowDuration * samplingRate // Dynamic window size based on duration

  const getNextSamples = (numToAdd: number): number[] => {
    if (!data || data.length === 0) return []

    const samples: number[] = []
    let remaining = numToAdd

    while (remaining > 0) {
      const idx = dataPointerRef.current % data.length
      samples.push(data[idx])
      dataPointerRef.current++
      remaining--
    }

    // Keep pointer bounded
    dataPointerRef.current = dataPointerRef.current % data.length

    // Update time offset (resets per loop cycle)
    setCurrentTimeOffset((dataPointerRef.current / samplingRate) % (data.length / samplingRate))

    return samples
  }

  useEffect(() => {
    const windowSize = windowDuration * samplingRate
    const animate = () => {
      if (!isPlaying) return

      const samplesPerFrame = Math.max(1, Math.round((samplingRate * speed) / 60))
      const newSamples = getNextSamples(samplesPerFrame)
      if (newSamples.length === 0) return

      setDataBuffer((prev) => {
        const updated = [...prev, ...newSamples]
        if (updated.length > windowSize) {
          return updated.slice(-windowSize)
        }
        return updated
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, data, samplingRate, windowDuration, speed])

  useEffect(() => {
    setDataBuffer([])
    setCurrentTimeOffset(0)
    dataPointerRef.current = 0
  }, [data])

  const currentEndTime = currentTimeOffset
  const currentStartTime = Math.max(0, currentEndTime - windowDuration)

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
          text: signalType === "EEG" ? "Amplitude (µV)" : "Amplitude (mV)",
        },
        grid: {
          color: "rgba(240, 240, 240, 0.5)",
        },
        min: signalType === "EEG" ? -600 : -2,
        max: signalType === "EEG" ? 600 : 2,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `${signalType} - ${channelName} | Time: ${Math.round(currentStartTime * 10) / 10}s - ${Math.round(currentEndTime * 10) / 10}s`,
        font: {
          size: 16,
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        callbacks: {
          label: (context: any) => `Time: ${Math.round(context.parsed.x * 10) / 10}s, Value: ${context.parsed.y.toFixed(2)}`,
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
  }

  const chartData = {
    datasets: [
      {
        label: channelName,
        data: dataBuffer.map((value, index) => ({
          x: currentStartTime + index / samplingRate,
          y: value,
        })),
        borderColor: "rgb(99, 102, 241)",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        borderWidth: 1.5,
        fill: false,
      },
    ],
  }

  return (
    <div className="w-full h-80 bg-white rounded-lg border border-gray-200 p-4">
      <Line options={chartOptions} data={chartData} />
      <div className="mt-2 flex justify-between items-center text-xs">
        <div className="flex items-center space-x-2">
          <label>Speed:</label>
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="border border-gray-300 rounded px-1 py-0.5"
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
          </select>
        </div>
      </div>
    </div>
  )
}