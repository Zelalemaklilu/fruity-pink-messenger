import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Phone, Mail, Loader2, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { initRecaptcha, sendOTP, atomicSignUpWithEmail, signInWithEmail } from "@/lib/firebaseAuth";
import { RecaptchaVerifier, sendEmailVerification } from "firebase/auth";
import { toast } from "sonner";
import { AccountStore } from "@/lib/accountStore";
import { auth } from "@/lib/firebase";
import { createAccount, getAccountsByoderId, isUsernameUnique } from "@/lib/firestoreService";

const Auth = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [syncContacts, setSyncContacts] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showResendOption, setShowResendOption] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const isSubmittingRef = useRef(false); // HARD LOCK to prevent duplicate submissions
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
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string };
        if (firebaseError.code === 'auth/invalid-phone-number') {
          toast.error("Invalid phone number format");
        } else if (firebaseError.code === 'auth/too-many-requests') {
          toast.error("Too many requests. Please try again later.");
        } else {
          toast.error("Failed to send verification code. Please try again.");
        }
      } else {
        toast.error("Failed to send verification code. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    // ===== HARD LOCK: FIRST LINE - Before ANY operations =====
    if (isSubmittingRef.current) {
      console.log("BLOCKED: Already submitting, ignoring click");
      return;
    }
    
    // LOCK IMMEDIATELY - before any validation or async operations
    isSubmittingRef.current = true;
    setLoading(true);
    console.log("HARD LOCK ENGAGED: Button disabled");

    try {
      // If user already exists in Firebase Auth, don't create another
      if (isSignUp && auth.currentUser) {
        console.log("User already exists in Firebase Auth, navigating to verification");
        navigate("/email-verification", { state: { email: auth.currentUser.email } });
        return;
      }

      if (!email.trim() || !password.trim()) {
        toast.error("Please enter email and password");
        isSubmittingRef.current = false;
        setLoading(false);
        return;
      }

      if (isSignUp) {
        if (!username.trim()) {
          toast.error("Please enter a username");
          isSubmittingRef.current = false;
          setLoading(false);
          return;
        }
        if (username.trim().length < 3) {
          toast.error("Username must be at least 3 characters");
          isSubmittingRef.current = false;
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          toast.error("Passwords do not match");
          isSubmittingRef.current = false;
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          toast.error("Password must be at least 6 characters");
          isSubmittingRef.current = false;
          setLoading(false);
          return;
        }

        // Check username uniqueness before proceeding
        const normalizedUsername = username.toLowerCase().trim().replace(/\s/g, '');
        const isUnique = await isUsernameUnique(normalizedUsername);
        if (!isUnique) {
          toast.error("Username already taken. Please choose another.");
          isSubmittingRef.current = false;
          setLoading(false);
          return;
        }
      }

      if (isSignUp) {
        // ===== ATOMIC SIGNUP: Auth + Firestore in one operation =====
        console.log("ATOMIC SIGNUP: Starting...");
        const normalizedUsername = username.toLowerCase().trim().replace(/\s/g, '');
        const user = await atomicSignUpWithEmail(email, password, normalizedUsername);
        
        // Store for reference (profile already created atomically)
        localStorage.setItem('pendingEmail', email);
        
        toast.success("Account created! Please verify your email.");
        navigate("/email-verification", { state: { email } });
      } else {
        const user = await signInWithEmail(email, password);
        if (!user.emailVerified) {
          toast.error("Please verify your email before signing in");
          setShowResendOption(true);
          // UNLOCK so user can retry
          isSubmittingRef.current = false;
          setLoading(false);
          return;
        }
        
        setShowResendOption(false);
        
        // Set auth tokens first - this is the critical part
        localStorage.setItem("authToken", user.uid);
        localStorage.setItem("firebaseUserId", user.uid);
        
        // SELF-HEALING PROFILE: Auto-create Firestore account if missing
        try {
          const existingAccounts = await getAccountsByoderId(user.uid);
          
          if (existingAccounts.length === 0) {
            // Profile is MISSING - Auto-recover by creating one
            console.log("Self-healing: Creating missing Firestore profile for user:", user.uid);
            
            const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
            const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 random digits
            const uniqueUsername = `${baseUsername}${randomSuffix}`;
            
            await createAccount({
              oderId: user.uid,
              username: uniqueUsername,
              email: email,
              name: `User ${email.split('@')[0]}`,
              phoneNumber: email,
              isActive: true
            });
            
            console.log("Self-healing: Profile auto-created successfully with username:", uniqueUsername);
          } else {
            console.log("Profile exists:", existingAccounts[0].username);
          }
        } catch (firestoreError) {
          // Log error but DON'T block sign-in - user is authenticated
          console.error("Self-healing profile creation failed (non-blocking):", firestoreError);
        }
        
        // Update local AccountStore
        const localAccounts = AccountStore.getAccounts();
        let localAccount = localAccounts.find(acc => acc.phoneNumber === email);
        
        if (!localAccount) {
          localAccount = AccountStore.addAccount(email.split('@')[0], email);
        }
        
        AccountStore.switchAccount(localAccount.id);

        // Final navigation is handled via React Router (no full page reloads)
        navigate("/chats", { replace: true });
      }
    } catch (error: unknown) {
      // UNLOCK on error so user can retry
      isSubmittingRef.current = false;
      console.log("SIGNUP ERROR: Button unlocked for retry");
      
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string };
        if (firebaseError.code === 'auth/email-already-in-use') {
          toast.error("Email already in use. Please sign in.");
        } else if (firebaseError.code === 'auth/invalid-email') {
          toast.error("Invalid email address");
        } else if (firebaseError.code === 'auth/weak-password') {
          toast.error("Password is too weak");
        } else if (firebaseError.code === 'auth/user-not-found') {
          toast.error("No account found with this email");
        } else if (firebaseError.code === 'auth/wrong-password') {
          toast.error("Incorrect password");
        } else if (firebaseError.code === 'auth/invalid-credential') {
          toast.error("Invalid email or password");
        } else {
          toast.error("Authentication failed. Please try again.");
        }
      } else {
        toast.error("Authentication failed. Please try again.");
      }
      setLoading(false);
    }
    // NOTE: We do NOT unlock on success - user navigates away
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) {
      toast.error("Please sign in first");
      return;
    }

    setResendLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success("Verification email sent!");
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string };
        if (firebaseError.code === 'auth/too-many-requests') {
          toast.error("Too many requests. Please wait before trying again.");
        } else {
          toast.error("Failed to send verification email");
        }
      } else {
        toast.error("Failed to send verification email");
      }
    } finally {
      setResendLoading(false);
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

              {isSignUp && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Username (unique)
                  </label>
                  <div className="flex items-center">
                    <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-lg border border-r-0 border-border h-10 flex items-center">
                      @
                    </span>
                    <Input
                      type="text"
                      placeholder="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                      className="rounded-l-none"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Others can find and message you with this username.
                  </p>
                </div>
              )}

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
              <div className="text-center space-y-2">
                <Button 
                  variant="link" 
                  className="text-primary"
                  onClick={() => navigate("/forgot-password")}
                >
                  Forgot Password?
                </Button>
                
                {showResendOption && (
                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      Email not verified yet?
                    </p>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={handleResendVerification}
                      disabled={resendLoading}
                      className="rounded-full"
                    >
                      {resendLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Resend verification email
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Button 
              onClick={handleEmailAuth}
              disabled={!email.trim() || !password.trim() || (isSignUp && !username.trim()) || loading}
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
