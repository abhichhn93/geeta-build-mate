import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Mic, MicOff, Volume2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import {
  isSpeechRecognitionSupported,
  createSpeechRecognition,
} from '@/lib/voice';
import {
  parseCommand,
  validateParsedCommand,
  saveDraftCard,
} from '@/lib/ai-parser';
import type { DraftCardRender, CanonicalParsedJSON } from '@/lib/ai-parser/types';
import { DraftCard } from './DraftCard';
import { supabase } from '@/integrations/supabase/client';

interface SmartVoiceAssistantProps {
  className?: string;
  adminOnly?: boolean;
}

export function SmartVoiceAssistant({ className, adminOnly = false }: SmartVoiceAssistantProps) {
  const { language } = useLanguage();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const t = (en: string, hi: string) => language === 'hi' ? hi : en;
  
  const [isListening, setIsListening] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<DraftCardRender | null>(null);
  const [currentParsed, setCurrentParsed] = useState<CanonicalParsedJSON | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const recognitionRef = useRef<ReturnType<typeof createSpeechRecognition> | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleVoiceResult = useCallback(async (text: string) => {
    setIsListening(false);
    setIsProcessing(true);
    
    try {
      // Try regex parsing first
      const { parsed, confidence } = parseCommand(text);
      
      let finalParsed = parsed;
      let parseSource: 'REGEX_RULE' | 'LLM_FALLBACK' = 'REGEX_RULE';
      let finalConfidence = confidence;
      
      // If low confidence, try LLM fallback
      if (confidence < 0.5) {
        try {
          const { data, error } = await supabase.functions.invoke('ai-command-parser', {
            body: { rawInput: text },
          });
          
          if (data?.success && data?.parsed) {
            finalParsed = data.parsed;
            parseSource = 'LLM_FALLBACK';
            finalConfidence = 0.75; // LLM gives medium-high confidence
          }
        } catch (llmError) {
          console.error('LLM fallback failed:', llmError);
          // Continue with regex result
        }
      }
      
      // Validate and generate clarifications
      const validationResult = await validateParsedCommand(
        finalParsed,
        text,
        parseSource,
        finalConfidence,
        language as 'en' | 'hi'
      );
      
      // Save draft to database if user is logged in
      let cardId = '';
      if (user?.id) {
        const savedId = await saveDraftCard(
          user.id,
          text,
          finalParsed,
          parseSource,
          finalConfidence,
          validationResult.status,
          validationResult.clarifications
        );
        cardId = savedId || '';
      }
      
      // Update render data with card ID
      const renderData: DraftCardRender = {
        ...validationResult.renderData,
        card_id: cardId,
      };
      
      setCurrentDraft(renderData);
      setCurrentParsed(finalParsed);
      setShowDraftDialog(true);
      
    } catch (error) {
      console.error('Voice processing error:', error);
      toast.error(t('Failed to process command', 'कमांड प्रोसेस नहीं हुई'));
    } finally {
      setIsProcessing(false);
    }
  }, [language, user, t]);

  const handleVoiceError = useCallback((errorMsg: string) => {
    setIsListening(false);
    
    if (errorMsg === 'not-allowed') {
      toast.error(t('Microphone access denied', 'माइक्रोफोन एक्सेस अस्वीकृत'));
    } else if (errorMsg === 'no-speech') {
      toast.info(t('No speech detected', 'कोई बोली नहीं मिली'));
    } else {
      toast.error(t('Voice error: ', 'वॉइस त्रुटि: ') + errorMsg);
    }
  }, [t]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      toast.error(t('Voice not supported in this browser', 'इस ब्राउज़र में वॉइस सपोर्ट नहीं है'));
      return;
    }

    // Abort any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // ignore
      }
    }

    setIsListening(true);

    const recognition = createSpeechRecognition(
      (text) => {
        // Clear timeout since we got a result
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        handleVoiceResult(text);
      },
      (error) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        handleVoiceError(error);
      },
      () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setIsListening(false);
      },
      'hi-IN'
    );

    if (recognition) {
      recognitionRef.current = recognition;
      
      try {
        recognition.start();
        
        // Set a 10 second timeout - auto stop if user doesn't speak
        timeoutRef.current = setTimeout(() => {
          toast.info(t('Listening timed out. Tap mic to try again.', 'सुनना समाप्त। फिर से माइक दबाएं।'));
          stopListening();
        }, 10000);
        
      } catch (err) {
        setIsListening(false);
        toast.error(t('Failed to start voice', 'वॉइस शुरू नहीं हुई'));
      }
    } else {
      setIsListening(false);
    }
  }, [handleVoiceResult, handleVoiceError, t, stopListening]);

  // Don't render if adminOnly and user is not admin - MUST be after all hooks
  if (adminOnly && !isAdmin) {
    return null;
  }

  const handleConfirm = async () => {
    if (!currentDraft || !currentParsed) return;
    
    setIsProcessing(true);
    
    try {
      // Execute the confirmed action based on intent
      if (currentParsed.intent === 'UPDATE_RATE' && currentParsed.items[0]) {
        const item = currentParsed.items[0];
        const today = new Date().toISOString().split('T')[0];
        const category = item.category || 'sariya';
        const brand = item.brand || '';
        const size = item.size?.replace('mm', '') || null;
        const price = currentParsed.financials?.amount || 0;
        const unit = category === 'cement' ? 'bag' : 'kg';
        
        // First check if rate exists for today
        let query = supabase
          .from('daily_rates')
          .select('id')
          .eq('category', category)
          .ilike('brand', brand)
          .eq('rate_date', today);
        
        if (size) {
          query = query.eq('size', size);
        } else {
          query = query.is('size', null);
        }
        
        const { data: existing } = await query.maybeSingle();
        
        let error;
        if (existing) {
          // Update existing rate
          const result = await supabase
            .from('daily_rates')
            .update({ price, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
          error = result.error;
        } else {
          // Insert new rate
          const result = await supabase
            .from('daily_rates')
            .insert({
              category,
              brand,
              size,
              price,
              unit,
              rate_date: today,
            });
          error = result.error;
        }
        
        if (error) throw error;
        
        toast.success(t(
          `Rate updated: ${brand} ${size || ''} → ₹${price}`,
          `रेट अपडेट: ${brand} ${size || ''} → ₹${price}`
        ));
        
        queryClient.invalidateQueries({ queryKey: ['daily_rates'] });
      }
      
      if (currentParsed.intent === 'CHECK_RATE' && currentParsed.items[0]) {
        const item = currentParsed.items[0];
        const today = new Date().toISOString().split('T')[0];
        
        const { data: rates } = await supabase
          .from('daily_rates')
          .select('*')
          .eq('rate_date', today)
          .ilike('brand', `%${item.brand || ''}%`)
          .eq('category', item.category || 'sariya');
        
        if (rates && rates.length > 0) {
          const rateList = rates.map(r => `${r.brand} ${r.size || ''}: ₹${r.price}/${r.unit}`).join('\n');
          toast.success(t(`Rates:\n${rateList}`, `रेट:\n${rateList}`));
        } else {
          toast.info(t('No rates found', 'कोई रेट नहीं मिला'));
        }
      }
      
      if (currentParsed.intent === 'CHECK_STOCK' && currentParsed.items[0]) {
        const item = currentParsed.items[0];
        
        // Query product stocks
        const { data: products } = await supabase
          .from('products')
          .select(`
            *,
            brands(name),
            categories(name_en, name_hi)
          `)
          .ilike('name_en', `%${item.brand || ''}%`);
        
        if (products && products.length > 0) {
          const stockInfo = products.slice(0, 3).map(p => 
            `${p.name_en}: ${p.stock_qty || 0} ${p.unit}`
          ).join('\n');
          toast.success(t(`Stock:\n${stockInfo}`, `स्टॉक:\n${stockInfo}`));
        } else {
          toast.info(t('No products found', 'कोई प्रोडक्ट नहीं मिला'));
        }
      }
      
      // Update draft status to CONFIRMED
      if (currentDraft.card_id) {
        await supabase
          .from('draft_cards')
          .update({ status: 'CONFIRMED', updated_at: new Date().toISOString() })
          .eq('id', currentDraft.card_id);
      }
      
    } catch (error) {
      console.error('Confirm error:', error);
      toast.error(t('Action failed', 'कार्रवाई विफल'));
    } finally {
      setIsProcessing(false);
      setShowDraftDialog(false);
      setCurrentDraft(null);
      setCurrentParsed(null);
    }
  };

  const handleReject = async () => {
    if (currentDraft?.card_id) {
      await supabase
        .from('draft_cards')
        .update({ status: 'REJECTED', updated_at: new Date().toISOString() })
        .eq('id', currentDraft.card_id);
    }
    
    setShowDraftDialog(false);
    setCurrentDraft(null);
    setCurrentParsed(null);
    toast.info(t('Command cancelled', 'कमांड रद्द'));
  };

  const handleResolveClarification = (reasonCode: string, value: string) => {
    // Update the parsed data with the clarification
    if (currentParsed && currentParsed.items[0]) {
      const updatedParsed = { ...currentParsed };
      
      if (reasonCode === 'MISSING_BRAND') {
        updatedParsed.items[0].brand = value;
      } else if (reasonCode === 'MISSING_SIZE') {
        updatedParsed.items[0].size = value;
      }
      
      setCurrentParsed(updatedParsed);
    }
  };

  return (
    <>
      {/* Floating Smart Mic Button */}
      <div className="fixed bottom-20 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 px-4 pointer-events-none">
        <div className="flex justify-end">
          <Button
            size="lg"
            className={`pointer-events-auto h-14 w-14 rounded-full shadow-lg relative ${
              isListening 
                ? 'bg-destructive hover:bg-destructive/90 animate-pulse' 
                : isProcessing
                ? 'bg-amber-500 hover:bg-amber-500/90'
                : 'bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70'
            } ${className}`}
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Sparkles className="h-6 w-6 animate-spin" />
            ) : isListening ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
            
            {/* AI indicator dot */}
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
          </Button>
        </div>
      </div>

      {/* Listening Indicator */}
      {isListening && (
        <div className="fixed bottom-36 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 px-4 pointer-events-none">
          <div className="flex justify-end">
            <Card className="w-44 shadow-lg animate-in slide-in-from-right pointer-events-auto">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-primary animate-pulse" />
                  <div>
                    <p className="text-sm font-medium">
                      {t('Listening...', 'सुन रहा हूँ...')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('Speak your command', 'कमांड बोलें')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && !showDraftDialog && (
        <div className="fixed bottom-36 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 px-4 pointer-events-none">
          <div className="flex justify-end">
            <Card className="w-44 shadow-lg animate-in slide-in-from-right pointer-events-auto">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
                  <div>
                    <p className="text-sm font-medium">
                      {t('Processing...', 'प्रोसेसिंग...')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('AI is thinking', 'AI सोच रहा है')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Draft Card Dialog */}
      <Dialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <DialogContent className="max-w-md p-0 gap-0">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {t('Draft Card', 'ड्राफ्ट कार्ड')}
            </DialogTitle>
          </DialogHeader>
          
          {currentDraft && (
            <DraftCard
              draft={currentDraft}
              onConfirm={handleConfirm}
              onReject={handleReject}
              onResolveClarification={handleResolveClarification}
              isProcessing={isProcessing}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
