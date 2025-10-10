export default interface ECGData {
  leads: string[];
  samplingRate: number;
  signals: number[][];
}
