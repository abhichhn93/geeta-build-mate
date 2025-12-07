import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Mic, MicOff, Volume2, X, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';
import { useUpdateDailyRate } from '@/hooks/useDailyRates';
import {
  parseVoiceCommand,
  isSpeechRecognitionSupported,
  createSpeechRecognition,
  VoiceCommand,
} from '@/lib/voice';

interface VoiceAssistantProps {
  className?: string;
}

export function VoiceAssistant({ className }: VoiceAssistantProps) {
  const { t } = useLanguage();
  const updateRate = useUpdateDailyRate();
  
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [parsedCommand, setParsedCommand] = useState<VoiceCommand | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVoiceResult = useCallback((text: string) => {
    setRecognizedText(text);
    const command = parseVoiceCommand(text);
    setParsedCommand(command);
    
    if (command.type !== 'unknown') {
      setShowConfirmDialog(true);
    } else {
      toast.error(t('Could not understand command', 'कमांड समझ नहीं आया'));
    }
    
    setIsListening(false);
  }, [t]);

  const handleVoiceError = useCallback((errorMsg: string) => {
    setError(errorMsg);
    setIsListening(false);
    
    if (errorMsg === 'not-allowed') {
      toast.error(t('Microphone access denied', 'माइक्रोफोन एक्सेस अस्वीकृत'));
    } else if (errorMsg === 'no-speech') {
      toast.info(t('No speech detected', 'कोई बोली नहीं मिली'));
    } else {
      toast.error(t('Voice error: ', 'वॉइस त्रुटि: ') + errorMsg);
    }
  }, [t]);

  const startListening = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      toast.error(t('Voice not supported in this browser', 'इस ब्राउज़र में वॉइस सपोर्ट नहीं है'));
      return;
    }

    setError(null);
    setRecognizedText('');
    setParsedCommand(null);
    setIsListening(true);

    const recognition = createSpeechRecognition(
      handleVoiceResult,
      handleVoiceError,
      () => setIsListening(false),
      'hi-IN' // Hindi primary, also understands Hinglish
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

  const executeCommand = async () => {
    if (!parsedCommand) return;

    try {
      if (parsedCommand.type === 'update_rate') {
        // Update rate in database
        await updateRate.mutateAsync({
          category: parsedCommand.category || 'Sariya',
          brand: parsedCommand.brand || 'Unknown',
          size: parsedCommand.size,
          price: parsedCommand.price!,
          unit: 'kg',
        });
        
        toast.success(
          t(
            `Rate updated: ${parsedCommand.brand} ${parsedCommand.size || ''} → ₹${parsedCommand.price}`,
            `रेट अपडेट: ${parsedCommand.brand} ${parsedCommand.size || ''} → ₹${parsedCommand.price}`
          )
        );
      }
      // Add more command handlers here (stock update, WhatsApp reminder, etc.)
      
      setShowConfirmDialog(false);
      setParsedCommand(null);
      setRecognizedText('');
    } catch (err) {
      toast.error(t('Failed to execute command', 'कमांड चलाने में त्रुटि'));
    }
  };

  const getCommandDescription = () => {
    if (!parsedCommand) return '';
    
    switch (parsedCommand.type) {
      case 'update_rate':
        return t(
          `Update rate for ${parsedCommand.brand || 'Unknown'} ${parsedCommand.size || ''} to ₹${parsedCommand.price}`,
          `${parsedCommand.brand || 'Unknown'} ${parsedCommand.size || ''} का रेट ₹${parsedCommand.price} करें`
        );
      case 'filter_category':
        return t(
          `Show ${parsedCommand.category} products`,
          `${parsedCommand.category} प्रोडक्ट्स दिखाएं`
        );
      case 'add_item':
        return t(
          `Add ${parsedCommand.quantity} ${parsedCommand.unit} of ${parsedCommand.brand || 'item'}`,
          `${parsedCommand.quantity} ${parsedCommand.unit} ${parsedCommand.brand || 'आइटम'} जोड़ें`
        );
      default:
        return t('Unknown command', 'अज्ञात कमांड');
    }
  };

  return (
    <>
      {/* Floating Mic Button */}
      <Button
        size="lg"
        className={`fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg ${
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

      {/* Listening Indicator */}
      {isListening && (
        <div className="fixed bottom-36 right-4 z-50">
          <Card className="w-48 shadow-lg animate-in slide-in-from-right">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Volume2 className="h-5 w-5 text-primary animate-pulse" />
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {t('Listening...', 'सुन रहा हूँ...')}
                </span>
              </div>
            </CardContent>
          </Card>
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
              {t('Confirm the action below', 'नीचे दी गई कार्रवाई की पुष्टि करें')}
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
            
            {/* Parsed Action */}
            {parsedCommand && (
              <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {parsedCommand.type === 'update_rate' && t('Rate Update', 'रेट अपडेट')}
                    {parsedCommand.type === 'filter_category' && t('Filter', 'फ़िल्टर')}
                    {parsedCommand.type === 'add_item' && t('Add Item', 'आइटम जोड़ें')}
                  </Badge>
                </div>
                <p className="text-sm">{getCommandDescription()}</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setParsedCommand(null);
              }}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-1" />
              {t('Cancel', 'रद्द करें')}
            </Button>
            <Button
              onClick={executeCommand}
              disabled={updateRate.isPending}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-1" />
              {t('Confirm', 'पुष्टि करें')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
