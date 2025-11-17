import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface WinnerScreenProps {
  winnerName: string;
}

export const WinnerScreen = ({ winnerName }: WinnerScreenProps) => {
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
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50 overflow-hidden">
      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
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
      <Card className="p-12 max-w-2xl w-full mx-4 text-center space-y-8 shadow-card relative">
        {/* Laurel Wreath SVG */}
        <div className="relative inline-block">
          <svg
            width="200"
            height="200"
            viewBox="0 0 200 200"
            className="text-yellow-600"
            fill="currentColor"
          >
            {/* Left laurel branch */}
            <path d="M60 100 Q40 90, 35 75 Q32 65, 38 58 Q42 52, 48 55 Q52 57, 50 63 Q48 70, 55 75 Q62 80, 65 90 Q68 95, 60 100" />
            <path d="M65 110 Q48 105, 40 95 Q35 88, 38 80 Q42 74, 48 77 Q52 80, 50 86 Q48 93, 55 98 Q62 103, 68 108 Q70 112, 65 110" />
            <path d="M70 120 Q55 118, 45 110 Q40 105, 42 97 Q45 91, 51 93 Q55 95, 54 101 Q53 108, 60 113 Q67 118, 73 120 Q75 122, 70 120" />
            <path d="M75 130 Q62 130, 50 124 Q45 120, 46 112 Q49 106, 55 108 Q59 110, 58 116 Q58 123, 65 128 Q72 133, 78 133 Q80 134, 75 130" />
            
            {/* Right laurel branch */}
            <path d="M140 100 Q160 90, 165 75 Q168 65, 162 58 Q158 52, 152 55 Q148 57, 150 63 Q152 70, 145 75 Q138 80, 135 90 Q132 95, 140 100" />
            <path d="M135 110 Q152 105, 160 95 Q165 88, 162 80 Q158 74, 152 77 Q148 80, 150 86 Q152 93, 145 98 Q138 103, 132 108 Q130 112, 135 110" />
            <path d="M130 120 Q145 118, 155 110 Q160 105, 158 97 Q155 91, 149 93 Q145 95, 146 101 Q147 108, 140 113 Q133 118, 127 120 Q125 122, 130 120" />
            <path d="M125 130 Q138 130, 150 124 Q155 120, 154 112 Q151 106, 145 108 Q141 110, 142 116 Q142 123, 135 128 Q128 133, 122 133 Q120 134, 125 130" />
          </svg>
          
          {/* Winner Name in Center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="text-3xl font-bold text-yellow-600 max-w-[140px] break-words leading-tight">
              {winnerName}
            </h2>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Victory!
          </h1>
          <p className="text-2xl text-muted-foreground">
            nice you won, now go touch some grass.
          </p>
        </div>
      </Card>
    </div>
  );
};
