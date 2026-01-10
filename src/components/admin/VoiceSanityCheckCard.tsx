import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { parseCommand } from '@/lib/ai-parser';
import { useLanguage } from '@/hooks/useLanguage';

export function VoiceSanityCheckCard() {
  const { language } = useLanguage();
  const t = (en: string, hi: string) => (language === 'hi' ? hi : en);

  const [text, setText] = useState('');
  const [ranText, setRanText] = useState<string | null>(null);

  const result = useMemo(() => {
    if (!ranText) return null;
    return parseCommand(ranText);
  }, [ranText]);

  const parsed = result?.parsed;
  const item = parsed?.items?.[0];

  const summary = useMemo(() => {
    if (!result || !parsed) return null;

    return {
      intent: parsed.intent,
      category: item?.category,
      brand: item?.brand,
      size: item?.size,
      price: parsed.financials?.amount,
      confidence: result.confidence,
      needsClarification: parsed.needs_clarification,
    };
  }, [result, parsed, item]);

  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-sm">{t('Voice Sanity Check', 'वॉइस sanity चेक')}</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-3">
        <div className="space-y-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t(
              'Type Hindi/English command (e.g. “अंकुर टीएमटी 8mm का रेट 65 कर दो”)',
              'कमांड लिखें (जैसे “अंकुर टीएमटी 8mm का रेट 65 कर दो”)'
            )}
            className="h-9"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="h-8"
              onClick={() => setRanText(text.trim() || null)}
              disabled={!text.trim()}
            >
              {t('Sanity Check', 'Sanity चेक')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => {
                setText('');
                setRanText(null);
              }}
            >
              {t('Clear', 'क्लियर')}
            </Button>
          </div>
        </div>

        {summary && (
          <>
            <Separator />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">{t('Intent', 'Intent')}</p>
                <p className="font-medium">{summary.intent}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('Confidence', 'Confidence')}</p>
                <p className="font-medium">{Math.round(summary.confidence * 100)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('Category', 'कैटेगरी')}</p>
                <p className="font-medium">{summary.category || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('Brand', 'ब्रांड')}</p>
                <p className="font-medium">{summary.brand || t('Unknown', 'Unknown')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('Size', 'साइज़')}</p>
                <p className="font-medium">{summary.size || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('Price', 'रेट')}</p>
                <p className="font-medium">{summary.price ? `₹${summary.price}` : '-'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={summary.needsClarification ? 'secondary' : 'default'} className="text-[10px]">
                {summary.needsClarification
                  ? t('Needs clarification', 'जानकारी चाहिए')
                  : t('Ready to execute', 'चलाने के लिए तैयार')}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {t('Rules parser (no credits)', 'Rules parser (क्रेडिट नहीं)')}
              </Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
