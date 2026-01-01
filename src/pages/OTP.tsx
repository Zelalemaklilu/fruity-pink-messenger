import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { verifyOTP } from "@/lib/firebaseAuth";
import { createAccount, getAccountsByoderId } from "@/lib/firestoreService";
import { toast } from "sonner";

const OTP = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleInputChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      setError("");

      // Auto focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter the complete verification code");
      return;
    }

    setLoading(true);
    
    try {
      const user = await verifyOTP(otpCode);
      
      if (user) {
        // Check if user already has an account
        const existingAccounts = await getAccountsByoderId(user.uid);
        
        if (existingAccounts.length === 0) {
          // Create default account for new user
          const phoneNumber = localStorage.getItem('pendingPhoneNumber') || user.phoneNumber || '';
          const defaultUsername = `user${Date.now().toString().slice(-8)}`;
          
          await createAccount({
            oderId: user.uid,
            username: defaultUsername,
            name: 'Primary Account',
            phoneNumber: phoneNumber,
            isActive: true
          });
        }
        
        localStorage.setItem('authToken', 'verified');
        localStorage.setItem('firebaseUserId', user.uid);
        localStorage.removeItem('pendingPhoneNumber');
        
        toast.success("Successfully verified!");
        window.location.href = '/chats';
      }
    } catch (error: unknown) {
      console.error('Verification error:', error);
      
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string };
        if (firebaseError.code === 'auth/invalid-verification-code') {
          setError("Invalid verification code. Please try again.");
        } else if (firebaseError.code === 'auth/code-expired') {
          setError("Code expired. Please request a new one.");
        } else {
          setError("Verification failed. Please try again.");
        }
      } else {
        setError("Verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/auth")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Enter Code
          </h1>
          <p className="text-muted-foreground">
            We've sent a verification code to your phone number.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex justify-center space-x-3">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-xl font-bold rounded-xl border-2 focus:border-primary"
              />
            ))}
          </div>

          {error && (
            <p className="text-destructive text-sm text-center">{error}</p>
          )}

          <div className="text-center space-y-2">
            <Button 
              variant="ghost" 
              className="text-primary hover:text-primary/80"
              onClick={() => navigate("/auth")}
            >
              Resend Code
            </Button>
            <p className="text-xs text-muted-foreground">
              Or call me instead
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Button 
          onClick={handleVerify}
          disabled={otp.some(digit => !digit) || loading}
          className="w-full h-12 rounded-full bg-gradient-primary hover:opacity-90 transition-smooth shadow-primary"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify Code"
          )}
        </Button>
      </div>
    </div>
  );
};

export default OTP;
