import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BugReportWidget } from "@/components/BugReportWidget";
import chameleonLogo from "@/assets/chameleon-logo.jpg";
import drewPhoto from "@/assets/drew-photo.png";
import dogPhoto from "@/assets/dog-photo.png";
import absoluteCinema from "@/assets/absolute-cinema.png";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [imageIndex, setImageIndex] = useState(0);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [isGatsbyMode, setIsGatsbyMode] = useState(false);
  const [isSelfDestructed, setIsSelfDestructed] = useState(false);
  const [isExploding, setIsExploding] = useState(false);

  const images = [chameleonLogo, drewPhoto, dogPhoto];

  // Check if we should be in Gatsby Mode from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("gatsby") === "true") {
      setIsGatsbyMode(true);
      setImageIndex(2);
    }
  }, [location]);

  // Check for active session whenever the page is visited
  useEffect(() => {
    const checkActiveSession = () => {
      try {
        const stored = localStorage.getItem("drewmeleon_game_state");
        if (stored) {
          const gameState = JSON.parse(stored);
          const totalPoints = gameState.players.reduce((sum: number, player: any) => sum + (player.score || 0), 0);
          const isActive = totalPoints > 0 && gameState.players.length > 0;
          setHasActiveSession(isActive);
        } else {
          setHasActiveSession(false);
        }
      } catch {
        setHasActiveSession(false);
      }
    };

    checkActiveSession();
  }, [location]);

  const handleCreateRoom = () => {
    navigate("/game");
  };

  const handleLogoClick = () => {
    const nextIndex = (imageIndex + 1) % 3;
    setImageIndex(nextIndex);

    // Enter Gatsby Mode when clicking to dog picture (index 2)
    if (nextIndex === 2) {
      setIsGatsbyMode(true);
    }
  };

  const handleGatsbyLogoClick = () => {
    // Exit Gatsby Mode and return to home screen
    setIsGatsbyMode(false);
    setImageIndex(0);
  };

  const handleSelfDestruct = () => {
    setIsExploding(true);

    // White explosion screen
    setTimeout(() => {
      // Fade to black
      const explosionEl = document.getElementById("explosion-screen");
      if (explosionEl) {
        explosionEl.style.backgroundColor = "black";
      }
    }, 500);

    // Show absolute cinema
    setTimeout(() => {
      setIsSelfDestructed(true);
      setIsExploding(false);
    }, 1500);
  };

  const handlePlayClick = () => {
    navigate("/gatsby-game");
  };

  const handleSettingsClick = () => {
    navigate("/gatsby-settings");
  };

  // If self-destructed, show absolute cinema screen
  if (isSelfDestructed) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-black">
        <img src={absoluteCinema} alt="Absolute Cinema" className="w-full h-full object-cover" />
      </div>
    );
  }

  // Explosion animation overlay
  if (isExploding) {
    return (
      <div id="explosion-screen" className="fixed inset-0 w-screen h-screen bg-white transition-colors duration-1000" />
    );
  }

  // If in Gatsby Mode, show special screen
  if (isGatsbyMode) {
    return (
      <div className="min-h-screen bg-gradient-game flex items-center justify-center p-4">
        <Card className="p-8 md:p-12 w-full max-w-md space-y-8 shadow-card">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center mb-4">
              <img
                src={dogPhoto}
                alt="Great Gatsby Mode"
                className="w-24 h-24 rounded-full object-cover cursor-pointer transition-transform hover:scale-105"
                onClick={handleGatsbyLogoClick}
              />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">Great Gatsby Mode</h1>
            <p className="text-muted-foreground text-lg"> 30 Years Old Edition</p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Button
              onClick={handlePlayClick}
              size="lg"
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity text-lg py-6"
            >
              Play
            </Button>
            <Button size="lg" variant="outline" className="w-full text-lg py-6" onClick={handleSettingsClick}>
              Settings
            </Button>
          </div>

          {/* Super Self Destruct Button */}
          <div className="pt-4">
            <Button
              onClick={handleSelfDestruct}
              size="lg"
              variant="destructive"
              className="w-full text-lg py-6 bg-destructive hover:bg-destructive/90"
            >
              💣 Super Self Destruct Button
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-game flex items-center justify-center p-4">
      <Card className="p-8 md:p-12 w-full max-w-md space-y-8 shadow-card">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-4">
            <img
              src={images[imageIndex]}
              alt="Drewmeleon Logo"
              className="w-24 h-24 rounded-full object-cover cursor-pointer transition-transform hover:scale-105"
              onClick={handleLogoClick}
            />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">Drewmeleon</h1>
          <p className="text-muted-foreground text-lg">Find the impostor among you</p>
        </div>

        {/* Create Room */}
        <div className="space-y-3">
          <Button
            onClick={handleCreateRoom}
            size="lg"
            className="w-full bg-gradient-primary hover:opacity-90 transition-opacity text-lg py-6"
          >
            {hasActiveSession ? "Return to Current Session" : "Create New Game"}
          </Button>
        </div>

        {/* How to Play */}
        <Card className="p-4 bg-muted border-none">
          <h3 className="font-semibold mb-2 text-center">How to Play</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Everyone knows the secret word, besides the Drewmeleon</li>
            <li>• Give a one-word clue about the secret word</li>
            <li>• One player is secretly the Drewmeleon</li>
            <li>• The Drewmeleon must blend in to win</li>
            <li>• Vote who you think the Drewmeleon is</li>
          </ul>
        </Card>

        {/* Scoring */}
        <Card className="p-4 bg-muted border-none">
          <h3 className="font-semibold mb-2 text-center">Scoring</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• First player to get to 6 points wins</li>
            <li>• If the Drewmeleon successfully blends in, they receive 2 points</li>
            <li>• If players correctly discover the Drewmeleon, they receive 1 point each</li>
            <li>• If the Drewmeleon successfully guesses the word, they receive 1 point</li>
          </ul>
        </Card>
      </Card>

      <BugReportWidget />
    </div>
  );
};

export default Index;
