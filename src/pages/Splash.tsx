import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logoImage from "@/assets/zeshopp-logo.jpg";

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/auth");
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-8">
      <div className="text-center space-y-6 animate-in fade-in-0 duration-1000">
        <div className="relative mx-auto w-32 h-32 rounded-3xl overflow-hidden shadow-primary">
          <img 
            src={logoImage} 
            alt="Zeshopp Logo" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">
            Zeshopp Chat
          </h1>
          <p className="text-lg text-muted-foreground">
            Fast. Simple. Secure.
          </p>
        </div>

        <div className="mt-8">
          <div className="w-16 h-1 bg-gradient-primary rounded-full mx-auto animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default Splash;