import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import chameleonLogo from "@/assets/chameleon-logo.jpg";
import drewPhoto from "@/assets/drew-photo.png";
import dogPhoto from "@/assets/dog-photo.png";

const Index = () => {
  const navigate = useNavigate();
  const [imageIndex, setImageIndex] = useState(0);
  
  const images = [chameleonLogo, drewPhoto, dogPhoto];

  const handleCreateRoom = () => {
    navigate("/game");
  };

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
              onClick={() => setImageIndex((prev) => (prev + 1) % 3)}
            />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Drewmeleon
          </h1>
          <p className="text-muted-foreground text-lg">
            Find the impostor among you
          </p>
        </div>

        {/* Create Room */}
        <div className="space-y-3">
          <Button
            onClick={handleCreateRoom}
            size="lg"
            className="w-full bg-gradient-primary hover:opacity-90 transition-opacity text-lg py-6"
          >
            Create New Game
          </Button>
        </div>


        {/* How to Play */}
        <Card className="p-4 bg-muted border-none">
          <h3 className="font-semibold mb-2 text-center">How to Play</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• One player is secretly the Drewmeleon</li>
            <li>• Everyone gives a one-word clue</li>
            <li>• Vote for who you think is the Drewmeleon</li>
            <li>• The Drewmeleon tries to blend in!</li>
          </ul>
        </Card>
      </Card>
    </div>
  );
};

export default Index;
