import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Check, X, AlertTriangle, Package, User, MapPin, 
  Scale, Calculator, TrendingUp, Warehouse 
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import type { DraftCardRender, ClarificationReasonCode } from '@/lib/ai-parser/types';

interface DraftCardProps {
  draft: DraftCardRender;
  onConfirm: () => void;
  onReject: () => void;
  onResolveClarification: (reasonCode: ClarificationReasonCode, value: string) => void;
  isProcessing?: boolean;
}

export function DraftCard({ 
  draft, 
  onConfirm, 
  onReject, 
  onResolveClarification,
  isProcessing = false 
}: DraftCardProps) {
  const { language } = useLanguage();
  const t = (en: string, hi: string) => language === 'hi' ? hi : en;
  
  const [clarificationValues, setClarificationValues] = useState<Record<string, string>>({});
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-primary/10 text-primary';
      case 'NEEDS_CLARIFICATION': return 'bg-amber-500/10 text-amber-600';
      case 'CONFIRMED': return 'bg-green-500/10 text-green-600';
      case 'REJECTED': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };
  
  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'text-green-600';
      case 'LOW_STOCK': return 'text-amber-600';
      case 'NOT_AVAILABLE': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };
  
  const getIntentIcon = () => {
    if (draft.intent.includes('RATE')) return <TrendingUp className="h-5 w-5" />;
    if (draft.intent.includes('STOCK')) return <Warehouse className="h-5 w-5" />;
    if (draft.intent.includes('CALCULATE')) return <Calculator className="h-5 w-5" />;
    return <Package className="h-5 w-5" />;
  };
  
  const hasClarifications = draft.clarification_checklist.length > 0;
  const allClarificationsResolved = draft.line_items.every(
    item => item.flags.length === 0 || 
    item.flags.every(flag => clarificationValues[flag])
  );
  
  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIntentIcon()}
            <CardTitle className="text-lg">{draft.intent_display}</CardTitle>
          </div>
          <Badge className={getStatusColor(draft.status)}>
            {draft.status === 'DRAFT' && t('Draft', 'ड्राफ्ट')}
            {draft.status === 'NEEDS_CLARIFICATION' && t('Needs Info', 'जानकारी चाहिए')}
            {draft.status === 'CONFIRMED' && t('Confirmed', 'कन्फर्म')}
          </Badge>
        </div>
        
        {/* Raw input display */}
        <div className="mt-2 p-2 rounded-md bg-muted/50">
          <p className="text-xs text-muted-foreground">{t('You said:', 'आपने कहा:')}</p>
          <p className="text-sm font-medium">"{draft.raw_input}"</p>
        </div>
        
        {/* Confidence indicator */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                draft.parse_confidence >= 0.8 ? 'bg-green-500' :
                draft.parse_confidence >= 0.5 ? 'bg-amber-500' : 'bg-destructive'
              }`}
              style={{ width: `${draft.parse_confidence * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {Math.round(draft.parse_confidence * 100)}%
          </span>
        </div>

        <p className="mt-1 text-[10px] text-muted-foreground">
          {draft.parse_source === 'LLM_FALLBACK'
            ? t('Parser: AI fallback (uses credits)', 'Parser: AI fallback (क्रेडिट लगेगा)')
            : t('Parser: Rules (no credits)', 'Parser: Rules (कोई क्रेडिट नहीं)')}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Customer display */}
        {draft.customer_display && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{draft.customer_display.name}</p>
              {draft.customer_display.balance && (
                <p className="text-xs text-muted-foreground">{draft.customer_display.balance}</p>
              )}
            </div>
          </div>
        )}
        
        {/* Line items */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {t('Items:', 'आइटम:')}
          </p>
          {draft.line_items.map((item, idx) => (
            <div key={idx} className="p-3 rounded-lg border bg-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{item.product_name || t('Unknown Item', 'अज्ञात आइटम')}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm">
                      {item.input_qty} {item.input_unit}
                    </span>
                    {item.converted_qty && (
                      <>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-sm font-medium text-primary">
                          {item.converted_qty.toFixed(2)} {item.converted_unit}
                        </span>
                      </>
                    )}
                  </div>
                  {item.conversion_formula && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Formula: {item.conversion_formula}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className={`text-xs ${getStockStatusColor(item.stock_status)}`}>
                    {item.stock_status === 'AVAILABLE' && t('In Stock', 'स्टॉक में')}
                    {item.stock_status === 'LOW_STOCK' && t('Low Stock', 'कम स्टॉक')}
                    {item.stock_status === 'NOT_AVAILABLE' && t('Out of Stock', 'स्टॉक नहीं')}
                    {item.stock_status === 'UNKNOWN' && t('Check Stock', 'स्टॉक चेक करें')}
                  </p>
                  {item.stock_location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {item.stock_location}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Item flags */}
              {item.flags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.flags.map((flag, flagIdx) => (
                    <Badge key={flagIdx} variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {flag.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Clarification checklist */}
        {hasClarifications && (
          <div className="space-y-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
            <p className="text-sm font-medium flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              {t('Please clarify:', 'कृपया बताएं:')}
            </p>
            {draft.clarification_checklist.map((prompt, idx) => (
              <div key={idx} className="space-y-2">
                <p className="text-sm">{prompt}</p>
                {/* Simple input for now - can be enhanced with options */}
                <Input
                  placeholder={t('Enter value...', 'वैल्यू डालें...')}
                  value={clarificationValues[`clarification_${idx}`] || ''}
                  onChange={(e) => setClarificationValues(prev => ({
                    ...prev,
                    [`clarification_${idx}`]: e.target.value,
                  }))}
                  className="h-9"
                />
              </div>
            ))}
          </div>
        )}
        
        {/* Rate display for rate intents */}
        {draft.intent.includes('RATE') && draft.line_items[0]?.rate_ref && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm text-muted-foreground">{t('Current Rate:', 'मौजूदा रेट:')}</p>
            <p className="text-xl font-bold text-primary">
              ₹{draft.line_items[0].rate_ref}/kg
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex gap-2 pt-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onReject}
          disabled={isProcessing}
        >
          <X className="h-4 w-4 mr-1" />
          {t('Reject', 'रद्द करें')}
        </Button>
        <Button
          className="flex-1"
          onClick={onConfirm}
          disabled={isProcessing || (hasClarifications && !allClarificationsResolved)}
        >
          <Check className="h-4 w-4 mr-1" />
          {isProcessing ? t('Processing...', 'प्रोसेसिंग...') : t('Confirm', 'पुष्टि करें')}
        </Button>
      </CardFooter>
    </Card>
  );
}
