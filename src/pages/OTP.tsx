import { useState, useRef, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

const OTP = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
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

  const handleVerify = () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter the complete verification code");
      return;
    }

    // For demo purposes, accept 123456 as correct code
    if (otpCode === "123456") {
      localStorage.setItem('authToken', 'verified');
      navigate("/chats");
    } else {
      setError("Invalid verification code. Please try again.");
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
          <p className="text-xs text-muted-foreground mt-4">
            Demo: Use code 123456
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
          disabled={otp.some(digit => !digit)}
          className="w-full h-12 rounded-full bg-gradient-primary hover:opacity-90 transition-smooth shadow-primary"
        >
          Verify Code
        </Button>
      </div>
    </div>
  );
};

export default OTP;