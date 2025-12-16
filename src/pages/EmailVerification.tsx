import { useState, useEffect } from "react";
import { ArrowLeft, Mail, RefreshCw, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { sendEmailVerification } from "firebase/auth";
import { toast } from "sonner";

const EmailVerification = () => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  useEffect(() => {
    // Check verification status periodically
    const interval = setInterval(async () => {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          toast.success("Email verified successfully!");
          navigate("/chats");
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleResendEmail = async () => {
    if (!auth.currentUser) {
      toast.error("No user found. Please sign up again.");
      return;
    }

    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success("Verification email sent!");
    } catch (error: any) {
      if (error.code === 'auth/too-many-requests') {
        toast.error("Too many requests. Please wait before trying again.");
      } else {
        toast.error("Failed to send verification email");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!auth.currentUser) {
      toast.error("No user found");
      return;
    }

    setChecking(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        toast.success("Email verified!");
        navigate("/chats");
      } else {
        toast.info("Email not verified yet. Please check your inbox.");
      }
    } catch (error) {
      toast.error("Failed to check verification status");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/auth")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center px-6 space-y-8">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
          <Mail className="h-10 w-10 text-primary" />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Verify your email
          </h1>
          <p className="text-muted-foreground">
            We've sent a verification link to
          </p>
          <p className="font-medium text-foreground">{email}</p>
        </div>

        <Card className="p-6 w-full max-w-sm space-y-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm text-muted-foreground">
              Check your email inbox and click the verification link
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm text-muted-foreground">
              After verification, you'll be automatically redirected
            </div>
          </div>
        </Card>

        <div className="w-full max-w-sm space-y-3">
          <Button 
            onClick={handleCheckVerification}
            disabled={checking}
            className="w-full h-12 rounded-full bg-gradient-primary hover:opacity-90 transition-smooth shadow-primary"
          >
            {checking ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              "I've verified my email"
            )}
          </Button>

          <Button 
            variant="outline"
            onClick={handleResendEmail}
            disabled={loading}
            className="w-full h-12 rounded-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5 mr-2" />
                Resend verification email
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;