import { Rocket } from 'lucide-react'

function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex items-center gap-2 text-slate-600">
        <Rocket className="h-5 w-5" />
        <span className="text-sm font-medium">Project scaffold ready</span>
      </div>
    </div>
  )
}

export default App