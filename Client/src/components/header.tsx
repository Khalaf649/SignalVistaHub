export default function Header() {
    return (
       <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">DSP Signal Processing Suite</h1>
              <p className="text-sm text-muted-foreground">Real-time signal analysis and visualization</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-chart-3 animate-pulse" />
              <span className="text-sm text-muted-foreground">System Active</span>
            </div>
          </div>
        </div>
      </header>
    );
}