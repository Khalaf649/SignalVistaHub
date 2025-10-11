export default interface EEGRecording {
  samplingRate: number;
  channels: string[];
  data: number[][];
  duration: number;
}
