import { useState, useEffect } from "react";
import { ArrowLeft, Phone, Mail, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { initRecaptcha, sendOTP, signUpWithEmail, signInWithEmail } from "@/lib/firebaseAuth";
import { RecaptchaVerifier } from "firebase/auth";
import { toast } from "sonner";
import { AccountStore } from "@/lib/accountStore";

const Auth = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [syncContacts, setSyncContacts] = useState(true);
  const [loading, setLoading] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const verifier = initRecaptcha('recaptcha-container');
    if (verifier) {
      setRecaptchaVerifier(verifier);
    }
  }, []);

  const handlePhoneContinue = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter your phone number");
      return;
    }

    if (!recaptchaVerifier) {
      toast.error("reCAPTCHA not initialized. Please refresh the page.");
      return;
    }

    setLoading(true);
    
    try {
      const fullPhoneNumber = `+251${phoneNumber.replace(/\s/g, '')}`;
      localStorage.setItem('pendingPhoneNumber', fullPhoneNumber);
      
      await sendOTP(fullPhoneNumber, recaptchaVerifier);
      toast.success("Verification code sent!");
      navigate("/otp");
    } catch (error: any) {
      if (error.code === 'auth/invalid-phone-number') {
        toast.error("Invalid phone number format");
      } else if (error.code === 'auth/too-many-requests') {
        toast.error("Too many requests. Please try again later.");
      } else {
        toast.error("Failed to send verification code. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter email and password");
      return;
    }

    if (isSignUp) {
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const user = await signUpWithEmail(email, password);
        toast.success("Account created! Please verify your email.");
        navigate("/email-verification", { state: { email } });
      } else {
        const user = await signInWithEmail(email, password);
        if (!user.emailVerified) {
          toast.error("Please verify your email before signing in");
          navigate("/email-verification", { state: { email } });
          return;
        }
        
        // Create or find account for this email user
        const accounts = AccountStore.getAccounts();
        let existingAccount = accounts.find(acc => acc.phoneNumber === email);
        
        if (!existingAccount) {
          existingAccount = AccountStore.addAccount(email.split('@')[0], email);
        }
        
        AccountStore.switchAccount(existingAccount.id);
        
        toast.success("Signed in successfully!");
        navigate("/chats");
      }
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast.error("Email already in use. Please sign in.");
      } else if (error.code === 'auth/invalid-email') {
        toast.error("Invalid email address");
      } else if (error.code === 'auth/weak-password') {
        toast.error("Password is too weak");
      } else if (error.code === 'auth/user-not-found') {
        toast.error("No account found with this email");
      } else if (error.code === 'auth/wrong-password') {
        toast.error("Incorrect password");
      } else if (error.code === 'auth/invalid-credential') {
        toast.error("Invalid email or password");
      } else {
        toast.error("Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome to Zeshopp
          </h1>
          <p className="text-muted-foreground">
            Sign in or create an account to continue
          </p>
        </div>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4 mt-4">
            <Card className="p-4 space-y-4">
              <div className="flex justify-center gap-4 mb-2">
                <Button 
                  variant={isSignUp ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setIsSignUp(true)}
                >
                  Sign Up
                </Button>
                <Button 
                  variant={!isSignUp ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setIsSignUp(false)}
                >
                  Sign In
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Confirm Password
                  </label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              )}
            </Card>

            {!isSignUp && (
              <div className="text-center">
                <Button 
                  variant="link" 
                  className="text-primary"
                  onClick={() => navigate("/forgot-password")}
                >
                  Forgot Password?
                </Button>
              </div>
            )}

            <Button 
              onClick={handleEmailAuth}
              disabled={!email.trim() || !password.trim() || loading}
              className="w-full h-12 rounded-full bg-gradient-primary hover:opacity-90 transition-smooth shadow-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {isSignUp ? "Creating account..." : "Signing in..."}
                </>
              ) : (
                <>
                  <Mail className="h-5 w-5 mr-2" />
                  {isSignUp ? "Create Account" : "Sign In"}
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="phone" className="space-y-4 mt-4">
            <Card className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Country
                </label>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border bg-input">
                  <span className="text-sm">🇪🇹</span>
                  <span className="text-sm text-foreground">Ethiopia</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Phone Number
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-lg">
                    +251
                  </span>
                  <Input
                    type="tel"
                    placeholder="9 XX XXX XXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </Card>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="sync" 
                checked={syncContacts}
                onCheckedChange={(checked) => setSyncContacts(checked === true)}
              />
              <label htmlFor="sync" className="text-sm text-muted-foreground">
                Sync Contacts
              </label>
            </div>

            <Button 
              onClick={handlePhoneContinue}
              disabled={!phoneNumber.trim() || loading}
              className="w-full h-12 rounded-full bg-gradient-primary hover:opacity-90 transition-smooth shadow-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Phone className="h-5 w-5 mr-2" />
                  Continue
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </div>

      {/* reCAPTCHA container */}
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default Auth;