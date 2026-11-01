import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface FormProps {
  onSearch: (val: string) => void
  onClear: () => void
}

function ImeiForm({ onSearch, onClear }: FormProps) {
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) onSearch(value.trim())
  }

  const handleReset = () => {
    setValue('')
    onClear()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor="imei-input" className="text-xs font-medium text-muted-foreground">
          Scan or enter 15-digit IMEI
        </label>
        <Input
          id="imei-input"
          placeholder="e.g. 356892110482910"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="font-mono text-sm"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">Lookup IMEI</Button>
        <Button type="button" variant="outline" onClick={handleReset}>Clear</Button>
      </div>
    </form>
  )
}

function ImeiResult({ imei }: { imei: string }) {
  return (
    <div className="rounded-lg border border-border p-3 bg-muted/40 space-y-1 text-sm">
      <div className="text-xs text-muted-foreground">Queried IMEI:</div>
      <div className="font-mono font-medium">{imei}</div>
      <div className="text-xs text-muted-foreground pt-1">
        Status: <span className="text-primary font-medium">In Stock</span>
      </div>
    </div>
  )
}

function App() {
  const [searchedImei, setSearchedImei] = useState<string | null>(null)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">Mobile ERP & POS</CardTitle>
            <Badge variant="secondary" className="text-xs">Online</Badge>
          </div>
          <CardDescription>Mobile device retail and consignment management system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImeiForm onSearch={setSearchedImei} onClear={() => setSearchedImei(null)} />
          {searchedImei && <ImeiResult imei={searchedImei} />}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground border-t pt-3 justify-between">
          <span>Tailwind CSS v4 + Shadcn UI</span>
          <span>Desktop POS Terminal</span>
        </CardFooter>
      </Card>
    </div>
  )
}

export default App
