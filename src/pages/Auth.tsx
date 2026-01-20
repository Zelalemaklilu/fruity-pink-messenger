import { useState, useRef } from "react";
import { ArrowLeft, Mail, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { signUpWithEmail, signInWithEmail, isUsernameUnique } from "@/lib/supabaseAuth";
import { toast } from "sonner";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);
  const navigate = useNavigate();

  const handleEmailAuth = async () => {
    if (isSubmittingRef.current) {
      console.log("BLOCKED: Already submitting");
      return;
    }
    
    isSubmittingRef.current = true;
    setLoading(true);

    try {
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

        const normalizedUsername = username.toLowerCase().trim().replace(/\s/g, '');
        const isUnique = await isUsernameUnique(normalizedUsername);
        if (!isUnique) {
          toast.error("Username already taken. Please choose another.");
          isSubmittingRef.current = false;
          setLoading(false);
          return;
        }

        const { user, error } = await signUpWithEmail(
          email, 
          password, 
          normalizedUsername,
          email.split('@')[0]
        );
        
        if (error) {
          throw error;
        }

        if (user) {
          toast.success("Account created successfully!");
          navigate("/chats", { replace: true });
        }
      } else {
        const { user, error } = await signInWithEmail(email, password);
        
        if (error) {
          throw error;
        }

        if (user) {
          toast.success("Welcome back!");
          navigate("/chats", { replace: true });
        }
      }
    } catch (error: any) {
      isSubmittingRef.current = false;
      console.error("Auth error:", error);
      
      const message = error?.message || "Authentication failed";
      if (message.includes("already registered")) {
        toast.error("Email already in use. Please sign in.");
      } else if (message.includes("Invalid login")) {
        toast.error("Invalid email or password");
      } else {
        toast.error(message);
      }
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
      </div>
    </div>
  );
};

export default Auth;
