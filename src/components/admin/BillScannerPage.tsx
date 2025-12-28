import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Camera, 
  Upload, 
  Loader2, 
  FileText, 
  Copy,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ExtractedItem {
  product: string;
  brand: string | null;
  size: string | null;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

interface ScanResult {
  success: boolean;
  vendor?: string;
  date?: string;
  invoice_number?: string;
  items?: ExtractedItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
  error?: string;
  rawResponse?: string;
}

export function BillScannerPage() {
  const { t, language } = useLanguage();
  const { isAdmin } = useAuth();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Redirect non-admins
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              {t('Access Denied', 'पहुँच अस्वीकृत')}
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              {t('Only admins can access this tool.', 'केवल एडमिन इस टूल का उपयोग कर सकते हैं।')}
            </p>
            <Link to="/">
              <Button>{t('Go Home', 'होम जाएं')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('Please select an image file', 'कृपया एक इमेज फाइल चुनें'));
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('Image too large (max 10MB)', 'इमेज बहुत बड़ी है (अधिकतम 10MB)'));
      return;
    }

    // Read and display preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImagePreview(base64);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async () => {
    if (!imagePreview) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('ocr-bill-scanner', {
        body: { imageBase64: imagePreview }
      });

      if (error) {
        console.error('Edge function error:', error);
        toast.error(t('Failed to process image', 'इमेज प्रोसेस करने में विफल'));
        setResult({ success: false, error: error.message });
        return;
      }

      setResult(data);
      
      if (data.success && data.items?.length > 0) {
        toast.success(t(`Extracted ${data.items.length} items`, `${data.items.length} आइटम निकाले गए`));
      } else if (!data.success) {
        toast.error(data.error || t('Could not extract data', 'डेटा निकालने में विफल'));
      }
    } catch (err) {
      console.error('Processing error:', err);
      toast.error(t('Processing failed', 'प्रोसेसिंग विफल'));
      setResult({ success: false, error: 'Processing failed' });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setImagePreview(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const copyToClipboard = () => {
    if (!result?.items) return;
    
    const text = result.items.map(item => 
      `${item.product} ${item.brand || ''} ${item.size || ''} - ${item.quantity} ${item.unit} @ ₹${item.rate} = ₹${item.amount}`
    ).join('\n');
    
    navigator.clipboard.writeText(text);
    toast.success(t('Copied to clipboard', 'क्लिपबोर्ड पर कॉपी किया गया'));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card px-4 py-3 shadow-sm">
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {t('Bill Scanner', 'बिल स्कैनर')}
            </h1>
            <p className="text-[10px] text-muted-foreground">
              {t('Extract product data from invoices', 'इनवॉइस से प्रोडक्ट डेटा निकालें')}
            </p>
          </div>
          <Badge variant="secondary" className="ml-auto text-[10px]">
            {t('Admin Tool', 'एडमिन टूल')}
          </Badge>
        </div>
      </header>

      <div className="mx-auto max-w-2xl p-4 space-y-4">
        {/* Upload Section */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {t('Upload Bill/Invoice', 'बिल/इनवॉइस अपलोड करें')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!imagePreview ? (
              <div className="grid grid-cols-2 gap-3">
                {/* Camera Input */}
                <div>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="camera-input"
                  />
                  <label htmlFor="camera-input">
                    <div className="flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Camera className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-sm font-medium">
                        {t('Take Photo', 'फोटो लें')}
                      </span>
                    </div>
                  </label>
                </div>

                {/* File Upload */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="file-input"
                  />
                  <label htmlFor="file-input">
                    <div className="flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-sm font-medium">
                        {t('Upload File', 'फाइल अपलोड')}
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Image Preview */}
                <div className="relative rounded-lg overflow-hidden border bg-muted">
                  <img 
                    src={imagePreview} 
                    alt="Bill preview" 
                    className="w-full max-h-64 object-contain"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetScanner}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    {t('Change', 'बदलें')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={processImage}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        {t('Processing...', 'प्रोसेसिंग...')}
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-1" />
                        {t('Extract Data', 'डेटा निकालें')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {result && (
          <Card className={`shadow-sm ${result.success ? 'border-success/30' : 'border-destructive/30'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  {result.success ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      {t('Extracted Data', 'निकाला गया डेटा')}
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      {t('Extraction Failed', 'निकालना विफल')}
                    </>
                  )}
                </CardTitle>
                {result.success && result.items && (
                  <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    {t('Copy', 'कॉपी')}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {result.success && result.items ? (
                <div className="space-y-4">
                  {/* Invoice Info */}
                  {(result.vendor || result.date || result.invoice_number) && (
                    <div className="flex flex-wrap gap-2 text-xs">
                      {result.vendor && (
                        <Badge variant="outline">{result.vendor}</Badge>
                      )}
                      {result.date && (
                        <Badge variant="outline">{result.date}</Badge>
                      )}
                      {result.invoice_number && (
                        <Badge variant="outline">#{result.invoice_number}</Badge>
                      )}
                    </div>
                  )}

                  {/* Items Table */}
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-xs py-2">{t('Product', 'प्रोडक्ट')}</TableHead>
                          <TableHead className="text-xs py-2 text-right">{t('Qty', 'मात्रा')}</TableHead>
                          <TableHead className="text-xs py-2 text-right">{t('Rate', 'रेट')}</TableHead>
                          <TableHead className="text-xs py-2 text-right">{t('Amount', 'राशि')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.items.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="py-2">
                              <div>
                                <span className="text-xs font-medium">{item.product}</span>
                                {(item.brand || item.size) && (
                                  <p className="text-[10px] text-muted-foreground">
                                    {[item.brand, item.size].filter(Boolean).join(' • ')}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs py-2 text-right">
                              {item.quantity} {item.unit}
                            </TableCell>
                            <TableCell className="text-xs py-2 text-right">
                              ₹{item.rate}
                            </TableCell>
                            <TableCell className="text-xs py-2 text-right font-medium">
                              {formatCurrency(item.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Totals */}
                  {result.total && (
                    <div className="flex justify-end">
                      <div className="text-right space-y-1">
                        {result.subtotal && (
                          <p className="text-xs text-muted-foreground">
                            {t('Subtotal', 'उप-योग')}: {formatCurrency(result.subtotal)}
                          </p>
                        )}
                        {result.tax && result.tax > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {t('Tax', 'कर')}: {formatCurrency(result.tax)}
                          </p>
                        )}
                        <p className="text-sm font-bold text-primary">
                          {t('Total', 'कुल')}: {formatCurrency(result.total)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-destructive">{result.error}</p>
                  {result.rawResponse && (
                    <details className="mt-2 text-left">
                      <summary className="text-xs text-muted-foreground cursor-pointer">
                        {t('View raw response', 'रॉ रिस्पॉन्स देखें')}
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-40">
                        {result.rawResponse}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="shadow-sm border-dashed">
          <CardContent className="py-4">
            <h3 className="text-xs font-semibold mb-2">
              {t('Tips for best results', 'बेहतर परिणाम के लिए सुझाव')}
            </h3>
            <ul className="text-[11px] text-muted-foreground space-y-1">
              <li>• {t('Ensure good lighting and clear image', 'अच्छी रोशनी और साफ इमेज सुनिश्चित करें')}</li>
              <li>• {t('Capture the full bill/invoice', 'पूरा बिल/इनवॉइस कैप्चर करें')}</li>
              <li>• {t('Avoid shadows and reflections', 'छाया और प्रतिबिंब से बचें')}</li>
              <li>• {t('Works best with printed invoices', 'प्रिंटेड इनवॉइस के साथ सबसे अच्छा काम करता है')}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
