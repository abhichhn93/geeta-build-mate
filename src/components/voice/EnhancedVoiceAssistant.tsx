import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, X, Check, MessageSquare, TrendingUp, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';
import { useQueryClient } from '@tanstack/react-query';
import {
  isSpeechRecognitionSupported,
  createSpeechRecognition,
} from '@/lib/voice';
import {
  ParsedCommand,
  parseMultiCommand,
  executeRateUpdate,
  executeRateQuery,
  executePaymentReminder,
} from '@/lib/voice-commands';

interface EnhancedVoiceAssistantProps {
  className?: string;
}

export function EnhancedVoiceAssistant({ className }: EnhancedVoiceAssistantProps) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const t = (en: string, hi: string) => language === 'hi' ? hi : en;
  
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [commands, setCommands] = useState<ParsedCommand[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);
  const [selectionOptions, setSelectionOptions] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [pendingCommand, setPendingCommand] = useState<ParsedCommand | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVoiceResult = useCallback((text: string) => {
    setRecognizedText(text);
    const parsed = parseMultiCommand(text);
    setCommands(parsed);
    
    const hasValidCommand = parsed.some(c => c.type !== 'unknown');
    if (hasValidCommand) {
      setShowConfirmDialog(true);
    } else {
      toast.error(t('Sorry, samajh nahi aaya. Please speak again.', 'क्षमा करें, समझ नहीं आया। कृपया फिर से बोलें।'));
    }
    
    setIsListening(false);
  }, [language]);

  const handleVoiceError = useCallback((errorMsg: string) => {
    setIsListening(false);
    
    if (errorMsg === 'not-allowed') {
      toast.error(t('Microphone access denied', 'माइक्रोफोन एक्सेस अस्वीकृत'));
    } else if (errorMsg === 'no-speech') {
      toast.info(t('No speech detected', 'कोई बोली नहीं मिली'));
    } else {
      toast.error(t('Voice error: ', 'वॉइस त्रुटि: ') + errorMsg);
    }
  }, [language]);

  const startListening = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      toast.error(t('Voice not supported in this browser', 'इस ब्राउज़र में वॉइस सपोर्ट नहीं है'));
      return;
    }

    setRecognizedText('');
    setCommands([]);
    setIsListening(true);

    const recognition = createSpeechRecognition(
      handleVoiceResult,
      handleVoiceError,
      () => setIsListening(false),
      'hi-IN'
    );

    if (recognition) {
      try {
        recognition.start();
      } catch (err) {
        setIsListening(false);
        toast.error(t('Failed to start voice', 'वॉइस शुरू नहीं हुई'));
      }
    }
  }, [handleVoiceResult, handleVoiceError, t]);

  const executeAllCommands = async () => {
    setIsProcessing(true);
    
    for (const cmd of commands) {
      if (cmd.type === 'unknown') continue;
      
      try {
        let result;
        
        if (cmd.type === 'update_rate') {
          result = await executeRateUpdate(cmd);
        } else if (cmd.type === 'query_rate') {
          result = await executeRateQuery(cmd);
        } else if (cmd.type === 'payment_reminder') {
          result = await executePaymentReminder(cmd);
        }
        
        if (result) {
          if (result.needsSelection && result.options) {
            setPendingCommand(cmd);
            setSelectionOptions(result.options);
            setShowConfirmDialog(false);
            setShowSelectionDialog(true);
            setIsProcessing(false);
            return;
          }
          
          if (result.success) {
            toast.success(language === 'hi' ? result.messageHi : result.message);
            
            // Open WhatsApp for reminder
            if (cmd.type === 'payment_reminder' && result.data?.waUrl) {
              window.open(result.data.waUrl, '_blank');
            }
          } else {
            toast.error(language === 'hi' ? result.messageHi : result.message);
          }
        }
      } catch (err) {
        toast.error(t('Command failed', 'कमांड विफल'));
      }
    }
    
    // Refresh rates data
    queryClient.invalidateQueries({ queryKey: ['daily_rates'] });
    
    setIsProcessing(false);
    setShowConfirmDialog(false);
    setCommands([]);
    setRecognizedText('');
  };

  const handleSelectionConfirm = async () => {
    if (!selectedOption || !pendingCommand) return;
    
    setIsProcessing(true);
    
    const selected = selectionOptions.find(o => o.id === selectedOption);
    if (!selected) return;
    
    try {
      if (pendingCommand.type === 'update_rate') {
        // Update the selected rate
        const { error } = await (await import('@/integrations/supabase/client')).supabase
          .from('daily_rates')
          .update({ price: pendingCommand.price, updated_at: new Date().toISOString() })
          .eq('id', selected.id);
        
        if (error) throw error;
        
        toast.success(t(
          `Rate updated: ${selected.brand} ${selected.size || ''} → ₹${pendingCommand.price}`,
          `रेट अपडेट: ${selected.brand} ${selected.size || ''} → ₹${pendingCommand.price}`
        ));
      } else if (pendingCommand.type === 'payment_reminder') {
        // Send reminder to selected customer
        const amount = pendingCommand.amount || selected.current_balance || 0;
        const message = `Geeta Traders – Payment Reminder\n\nNamaste ${selected.name} ji,\n${amount > 0 ? `Aapka ₹${amount.toLocaleString('en-IN')} ka payment abhi baki hai.` : 'Aapka payment reminder.'}\nKripya jaldi se jama kar dein.\n\n– Geeta Traders, Mohammadabad Gohna`;
        
        const phone = selected.phone?.replace(/[^0-9]/g, '') || '';
        if (phone) {
          const waUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
          window.open(waUrl, '_blank');
          toast.success(t(`Opening WhatsApp for ${selected.name}`, `${selected.name} के लिए WhatsApp खोल रहे हैं`));
        } else {
          toast.error(t('No phone number', 'फोन नंबर नहीं है'));
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['daily_rates'] });
    } catch (err) {
      toast.error(t('Failed to complete action', 'कार्रवाई पूरी नहीं हुई'));
    }
    
    setIsProcessing(false);
    setShowSelectionDialog(false);
    setPendingCommand(null);
    setSelectionOptions([]);
    setSelectedOption('');
  };

  const getCommandIcon = (type: string) => {
    switch (type) {
      case 'update_rate': return <TrendingUp className="h-4 w-4" />;
      case 'query_rate': return <HelpCircle className="h-4 w-4" />;
      case 'payment_reminder': return <MessageSquare className="h-4 w-4" />;
      default: return null;
    }
  };

  const getCommandLabel = (cmd: ParsedCommand) => {
    switch (cmd.type) {
      case 'update_rate':
        return t(
          `Update ${cmd.brand} ${cmd.size || ''} → ₹${cmd.price}`,
          `${cmd.brand} ${cmd.size || ''} का रेट ₹${cmd.price} करें`
        );
      case 'query_rate':
        return t(
          `Get rate for ${cmd.brand} ${cmd.size || ''}`,
          `${cmd.brand} ${cmd.size || ''} का रेट जानें`
        );
      case 'payment_reminder':
        return t(
          `Send reminder to ${cmd.customerName}${cmd.amount ? ` for ₹${cmd.amount}` : ''}`,
          `${cmd.customerName} को${cmd.amount ? ` ₹${cmd.amount} का` : ''} रिमाइंडर भेजें`
        );
      default:
        return t('Unknown command', 'अज्ञात कमांड');
    }
  };

  return (
    <>
      {/* Floating Mic Button - positioned within max-w-lg container */}
      <div className="fixed bottom-20 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 px-4 pointer-events-none">
        <div className="flex justify-end">
          <Button
            size="lg"
            className={`pointer-events-auto h-14 w-14 rounded-full shadow-lg ${
              isListening 
                ? 'bg-destructive hover:bg-destructive/90 animate-pulse' 
                : 'bg-primary hover:bg-primary/90'
            } ${className}`}
            onClick={isListening ? () => setIsListening(false) : startListening}
          >
            {isListening ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Listening Indicator */}
      {isListening && (
        <div className="fixed bottom-36 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 px-4 pointer-events-none">
          <div className="flex justify-end">
            <Card className="w-40 shadow-lg animate-in slide-in-from-right pointer-events-auto">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-primary animate-pulse" />
                  <span className="text-sm font-medium">
                    {t('Listening...', 'सुन रहा हूँ...')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" />
              {t('Voice Command', 'वॉइस कमांड')}
            </DialogTitle>
            <DialogDescription>
              {t('Confirm the actions below', 'नीचे दी गई कार्रवाइयों की पुष्टि करें')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            {/* Recognized Text */}
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground mb-1">
                {t('You said:', 'आपने कहा:')}
              </p>
              <p className="text-sm font-medium">"{recognizedText}"</p>
            </div>
            
            {/* Parsed Commands */}
            <div className="space-y-2">
              {commands.map((cmd, idx) => (
                <div 
                  key={idx}
                  className={`rounded-lg border p-3 ${
                    cmd.type === 'unknown' 
                      ? 'border-destructive/30 bg-destructive/5' 
                      : 'border-primary/20 bg-primary/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {getCommandIcon(cmd.type)}
                    <Badge variant={cmd.type === 'unknown' ? 'destructive' : 'secondary'} className="text-xs">
                      {cmd.type === 'update_rate' && t('Rate Update', 'रेट अपडेट')}
                      {cmd.type === 'query_rate' && t('Rate Query', 'रेट पूछें')}
                      {cmd.type === 'payment_reminder' && t('Reminder', 'रिमाइंडर')}
                      {cmd.type === 'unknown' && t('Unknown', 'अज्ञात')}
                    </Badge>
                  </div>
                  <p className="text-sm mt-1">{getCommandLabel(cmd)}</p>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setCommands([]);
              }}
              className="flex-1"
              disabled={isProcessing}
            >
              <X className="h-4 w-4 mr-1" />
              {t('Cancel', 'रद्द करें')}
            </Button>
            <Button
              onClick={executeAllCommands}
              disabled={isProcessing || !commands.some(c => c.type !== 'unknown')}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-1" />
              {isProcessing ? t('Processing...', 'प्रोसेसिंग...') : t('Confirm', 'पुष्टि करें')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Selection Dialog (for multiple matches) */}
      <Dialog open={showSelectionDialog} onOpenChange={setShowSelectionDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {t('Select One', 'एक चुनें')}
            </DialogTitle>
            <DialogDescription>
              {t('Multiple matches found. Please select:', 'कई मैच मिले। कृपया चुनें:')}
            </DialogDescription>
          </DialogHeader>
          
          <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
            {selectionOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted">
                <RadioGroupItem value={option.id} id={option.id} />
                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                  {option.name || `${option.brand} ${option.size || ''}`}
                  {option.phone && <span className="text-muted-foreground ml-2">({option.phone})</span>}
                  {option.price && <span className="text-muted-foreground ml-2">₹{option.price}</span>}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowSelectionDialog(false);
                setPendingCommand(null);
                setSelectionOptions([]);
                setSelectedOption('');
              }}
              className="flex-1"
              disabled={isProcessing}
            >
              {t('Cancel', 'रद्द करें')}
            </Button>
            <Button
              onClick={handleSelectionConfirm}
              disabled={!selectedOption || isProcessing}
              className="flex-1"
            >
              {isProcessing ? t('Processing...', 'प्रोसेसिंग...') : t('Confirm', 'पुष्टि करें')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
