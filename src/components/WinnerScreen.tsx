import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import laurelWreath from "@/assets/laurel-wreath.png";

interface WinnerScreenProps {
  winnerNames: string[];
  onFindNewWinner: () => void;
}

export const WinnerScreen = ({ winnerNames, onFindNewWinner }: WinnerScreenProps) => {
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number }>>([]);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Generate confetti particles
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
    }));
    setConfetti(particles);

    // Stop confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center overflow-hidden">
      {/* Confetti - Topmost Layer */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50">
          {confetti.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-2 h-2 bg-yellow-500 rounded-full animate-fall"
              style={{
                left: `${particle.left}%`,
                top: "-10px",
                animationDelay: `${particle.delay}s`,
                animationDuration: "3s",
              }}
            />
          ))}
        </div>
      )}

      {/* Winner Card */}
      <Card className="p-12 max-w-2xl w-full mx-4 text-center space-y-6 shadow-card relative z-10">
        {/* Laurel Wreath Image */}
        <div className="flex justify-center">
          <img 
            src={laurelWreath} 
            alt="Laurel Wreath" 
            className="w-64 h-64 object-contain"
          />
        </div>

        {/* Winner Names Below Wreath */}
        <div className="-mt-8 space-y-2">
          {winnerNames.map((name, index) => (
            <h2 key={index} className="text-6xl font-bold text-yellow-600">
              {name}
            </h2>
          ))}
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {winnerNames.length > 1 ? "It's a Tie!" : "Victory!"}
          </h1>
          <p className="text-2xl text-muted-foreground">
            {winnerNames.length > 1 
              ? "nice you all tied, now go touch some grass or attend an Andrew's Mixer ;)"
              : "nice you won, now go touch some grass or attend an Andrew's Mixer ;)"}
          </p>
        </div>

        <Button
          onClick={onFindNewWinner}
          size="lg"
          className="mt-6"
        >
          Find New Winner
        </Button>
      </Card>
    </div>
  );
};
