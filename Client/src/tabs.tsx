import { Activity, Radio, Brain, Waves, Plane } from "lucide-react";
import { lazy, Suspense } from "react";

const ECGMonitor = lazy(() => import("./components/ecg-monitor"));
const DopplerAnalysis = lazy(() => import("./components/doppler-analysis"));
const DroneTelemetry = lazy(() => import("./components/drone-telemetry"));
const EEGModule = lazy(() => import("./components/eeg-monitor"));
const SARAnalysis = lazy(() => import("./components/sar-analysis"));

const tabConfig = [
  {
    value: "ecg",
    label: "ECG Monitor",
    icon: Activity,
    content: (
      <Suspense
        fallback={
          <div className="text-center text-muted-foreground">
            Loading ECG Monitor...
          </div>
        }
      >
        <ECGMonitor />
      </Suspense>
    ),
  },
  {
    value: "doppler",
    label: "Doppler Effect",
    icon: Radio,
    content: (
      <Suspense
        fallback={
          <div className="text-center text-muted-foreground">
            Loading Doppler Analysis...
          </div>
        }
      >
        <DopplerAnalysis />
      </Suspense>
    ),
  },
  {
    value: "eeg",
    label: "EEG Analysis",
    icon: Brain,
    content: (
      <Suspense
        fallback={
          <div className="text-center text-muted-foreground">
            Loading EEG Module...
          </div>
        }
      >
        <EEGModule />
      </Suspense>
    ),
  },
  {
    value: "SAR",
    label: "SAR Analysis",
    icon: Waves,
    content: (
      <Suspense
        fallback={
          <div className="text-center text-muted-foreground">
            Loading SAR Analysis...
          </div>
        }
      >
        <SARAnalysis />
      </Suspense>
    ),
  },
  {
    value: "drones",
    label: "Drones",
    icon: Plane,
    content: (
      <Suspense
        fallback={
          <div className="text-center text-muted-foreground">
            Loading Drone Telemetry...
          </div>
        }
      >
        <DroneTelemetry />
      </Suspense>
    ),
  },
];

export default tabConfig;
