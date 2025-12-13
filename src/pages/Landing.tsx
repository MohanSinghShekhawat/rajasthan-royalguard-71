import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Building2, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types';

type AuthStep = 'select-role' | 'enter-phone' | 'verify-otp';

export default function Landing() {
  const [step, setStep] = useState<AuthStep>('select-role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithOTP, verifyOTP } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('enter-phone');
  };

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      toast({
        title: 'Invalid Phone',
        description: 'Please enter a valid 10-digit phone number',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
    
    const { error } = await signInWithOTP(formattedPhone);
    setLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send OTP. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'OTP Sent!',
      description: 'Please check your phone for the verification code.',
    });
    setStep('verify-otp');
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6 || !selectedRole) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter the 6-digit verification code',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
    
    const { error } = await verifyOTP(formattedPhone, otp, selectedRole);
    setLoading(false);

    if (error) {
      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid OTP. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Welcome!',
      description: 'You have successfully signed in.',
    });

    // Navigate based on role
    navigate(selectedRole === 'tourist' ? '/tourist' : '/admin');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="royal-gradient text-primary-foreground py-12 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary/20 backdrop-blur flex items-center justify-center">
              <Shield className="w-10 h-10" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Rajasthan Smart Tourism
          </h1>
          <p className="text-lg opacity-90 max-w-xl mx-auto">
            Your safety companion for exploring the Land of Kings
          </p>
        </div>
      </div>

      {/* Auth Section */}
      <div className="flex-1 container max-w-lg mx-auto px-4 py-8 -mt-8">
        {step === 'select-role' && (
          <div className="space-y-4 animate-in">
            <Card className="glass-card cursor-pointer hover:shadow-lg transition-all" onClick={() => handleRoleSelect('tourist')}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">I'm a Tourist</CardTitle>
                      <CardDescription>Access safety tools & travel assistance</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardHeader>
            </Card>

            <Card className="glass-card cursor-pointer hover:shadow-lg transition-all" onClick={() => handleRoleSelect('official')}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Government Official</CardTitle>
                      <CardDescription>Analytics & command center access</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardHeader>
            </Card>

            <p className="text-center text-sm text-muted-foreground pt-4">
              An initiative by the Government of Rajasthan
            </p>
          </div>
        )}

        {step === 'enter-phone' && (
          <Card className="glass-card animate-in">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
              </div>
              <CardTitle>Enter Your Phone Number</CardTitle>
              <CardDescription>
                We'll send you a verification code via SMS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-muted rounded-lg text-sm font-medium">
                    +91
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="flex-1"
                    maxLength={10}
                  />
                </div>
              </div>

              <Button 
                onClick={handleSendOTP} 
                className="w-full" 
                disabled={loading || phone.length !== 10}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </Button>

              <Button 
                variant="ghost" 
                onClick={() => setStep('select-role')}
                className="w-full"
              >
                Back
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'verify-otp' && (
          <Card className="glass-card animate-in">
            <CardHeader className="text-center">
              <CardTitle>Verify OTP</CardTitle>
              <CardDescription>
                Enter the 6-digit code sent to +91 {phone}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button 
                onClick={handleVerifyOTP} 
                className="w-full" 
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Continue'
                )}
              </Button>

              <div className="text-center">
                <Button 
                  variant="link" 
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="text-sm"
                >
                  Didn't receive code? Resend
                </Button>
              </div>

              <Button 
                variant="ghost" 
                onClick={() => setStep('enter-phone')}
                className="w-full"
              >
                Change Phone Number
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-muted-foreground border-t">
        <p>© 2024 Department of Tourism, Government of Rajasthan</p>
      </footer>
    </div>
  );
}
