import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Phone, X } from 'lucide-react';
import { Button } from './button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGeolocation } from '@/hooks/useGeolocation';

interface SOSButtonProps {
  className?: string;
}

export function SOSButton({ className }: SOSButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { latitude, longitude } = useGeolocation({ watch: true });

  const handlePress = () => {
    setIsPressed(true);
    // Show confirmation after short press
    setTimeout(() => {
      if (isPressed) {
        setShowConfirm(true);
      }
    }, 500);
  };

  const handleRelease = () => {
    setIsPressed(false);
  };

  const handleSendSOS = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to send an SOS alert',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase
        .from('sos_alerts')
        .insert({
          user_id: user.id,
          latitude,
          longitude,
          status: 'active',
        });

      if (error) throw error;

      toast({
        title: 'SOS Alert Sent!',
        description: 'Emergency services have been notified. Stay calm and stay where you are.',
      });

      setShowConfirm(false);
    } catch (error) {
      console.error('Error sending SOS:', error);
      toast({
        title: 'Error',
        description: 'Failed to send SOS alert. Please try again or call 112.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onMouseDown={handlePress}
        onMouseUp={handleRelease}
        onMouseLeave={handleRelease}
        onTouchStart={handlePress}
        onTouchEnd={handleRelease}
        className={cn(
          'relative w-20 h-20 rounded-full bg-destructive text-destructive-foreground',
          'flex items-center justify-center font-bold text-lg',
          'transition-all duration-200 shadow-lg',
          'hover:bg-destructive/90 active:scale-95',
          isPressed && 'scale-95 animate-pulse-ring',
          className
        )}
        aria-label="Emergency SOS Button"
      >
        <Phone className="w-8 h-8" />
        <span className="absolute -bottom-1 text-xs font-semibold">SOS</span>
      </button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Send Emergency SOS?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately alert emergency services and share your location.
              Only use this in a genuine emergency.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendSOS}
              disabled={sending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {sending ? 'Sending...' : 'Send SOS Now'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
