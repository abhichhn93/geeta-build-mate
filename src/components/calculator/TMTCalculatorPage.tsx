import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Share2, Calculator, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  calculateTMTWeight,
  getAvailableDiameters,
  STANDARD_LENGTHS,
  formatWeight,
} from '@/lib/tmt-calculator';
import { generateTMTCalculationLink, openWhatsApp, formatINR } from '@/lib/whatsapp';

export function TMTCalculatorPage() {
  const [diameter, setDiameter] = useState<number>(10);
  const [length, setLength] = useState<number>(12);
  const [pieces, setPieces] = useState<number>(1);
  const [pricePerKg, setPricePerKg] = useState<number>(0);

  const weight = calculateTMTWeight(diameter, length, pieces);
  const totalCost = pricePerKg > 0 ? weight * pricePerKg : 0;

  const handleShare = () => {
    const link = generateTMTCalculationLink(
      diameter,
      length,
      pieces,
      weight,
      pricePerKg > 0 ? pricePerKg : undefined
    );
    openWhatsApp(link);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-primary px-4 py-4 text-primary-foreground">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-lg font-bold">
              <Calculator className="h-5 w-5" />
              TMT Weight Calculator
            </h1>
            <p className="text-xs opacity-90 hindi-text">सरिया वजन कैलकुलेटर</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* Input Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Enter Details / विवरण दर्ज करें</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Diameter */}
            <div className="space-y-2">
              <Label htmlFor="diameter">
                Diameter / व्यास (mm)
              </Label>
              <Select
                value={diameter.toString()}
                onValueChange={(v) => setDiameter(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select diameter" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableDiameters().map((d) => (
                    <SelectItem key={d} value={d.toString()}>
                      {d}mm
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Length */}
            <div className="space-y-2">
              <Label htmlFor="length">
                Length / लंबाई (meters)
              </Label>
              <Select
                value={length.toString()}
                onValueChange={(v) => setLength(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  {STANDARD_LENGTHS.map((l) => (
                    <SelectItem key={l} value={l.toString()}>
                      {l} meters
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pieces */}
            <div className="space-y-2">
              <Label htmlFor="pieces">
                Number of Pieces / टुकड़ों की संख्या
              </Label>
              <Input
                id="pieces"
                type="number"
                min={1}
                value={pieces}
                onChange={(e) => setPieces(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>

            {/* Price per kg (optional) */}
            <div className="space-y-2">
              <Label htmlFor="price">
                Price per kg / प्रति किलो भाव (₹) - Optional
              </Label>
              <Input
                id="price"
                type="number"
                min={0}
                value={pricePerKg || ''}
                placeholder="Enter current rate"
                onChange={(e) => setPricePerKg(parseFloat(e.target.value) || 0)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Result Card */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Result / परिणाम</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Weight Result */}
            <div className="rounded-lg bg-card p-4 text-center shadow-sm">
              <p className="text-sm text-muted-foreground">Total Weight / कुल वजन</p>
              <p className="text-3xl font-bold text-primary">{formatWeight(weight)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Formula: (d² × L × pieces) / 162
              </p>
            </div>

            {/* Cost Result (if price entered) */}
            {pricePerKg > 0 && (
              <div className="rounded-lg bg-card p-4 text-center shadow-sm">
                <p className="text-sm text-muted-foreground">Total Cost / कुल लागत</p>
                <p className="text-3xl font-bold text-success">{formatINR(totalCost)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatWeight(weight)} × {formatINR(pricePerKg)}/kg
                </p>
              </div>
            )}

            {/* Calculation Details */}
            <div className="rounded-lg bg-secondary/50 p-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Diameter:</span>
                  <span className="ml-2 font-medium">{diameter}mm</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Length:</span>
                  <span className="ml-2 font-medium">{length}m</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Pieces:</span>
                  <span className="ml-2 font-medium">{pieces}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Weight/pc:</span>
                  <span className="ml-2 font-medium">
                    {formatWeight(calculateTMTWeight(diameter, length, 1))}
                  </span>
                </div>
              </div>
            </div>

            {/* Share Button */}
            <Button onClick={handleShare} className="w-full gap-2">
              <Share2 className="h-4 w-4" />
              Share on WhatsApp / व्हाट्सएप पर शेयर करें
            </Button>
          </CardContent>
        </Card>

        {/* Quick Reference */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Reference / त्वरित संदर्भ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="rounded-lg bg-secondary/50 p-2">
                <p className="font-bold">8mm</p>
                <p className="text-muted-foreground">0.395 kg/m</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-2">
                <p className="font-bold">10mm</p>
                <p className="text-muted-foreground">0.617 kg/m</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-2">
                <p className="font-bold">12mm</p>
                <p className="text-muted-foreground">0.888 kg/m</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-2">
                <p className="font-bold">16mm</p>
                <p className="text-muted-foreground">1.58 kg/m</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}