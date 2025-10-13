import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import chameleonLogo from "@/assets/chameleon-logo.jpg";

const Index = () => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateRoom = () => {
    const code = generateRoomCode();
    navigate(`/room/${code}`);
  };

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      navigate(`/room/${roomCode.toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-game flex items-center justify-center p-4">
      <Card className="p-8 md:p-12 w-full max-w-md space-y-8 shadow-card">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-4">
            <img 
              src={chameleonLogo} 
              alt="Chameleon Logo" 
              className="w-24 h-24 rounded-full object-cover"
            />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Chameleon
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

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-card text-muted-foreground">or</span>
          </div>
        </div>

        {/* Join Room */}
        <div className="space-y-3">
          <Input
            placeholder="Enter room code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
            className="text-center text-lg tracking-wider uppercase"
            maxLength={6}
          />
          <Button
            onClick={handleJoinRoom}
            variant="outline"
            size="lg"
            className="w-full text-lg py-6"
            disabled={!roomCode.trim()}
          >
            Join Game
          </Button>
        </div>

        {/* How to Play */}
        <Card className="p-4 bg-muted border-none">
          <h3 className="font-semibold mb-2 text-center">How to Play</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• One player is secretly the Chameleon</li>
            <li>• Everyone gives a one-word clue</li>
            <li>• Vote for who you think is the Chameleon</li>
            <li>• The Chameleon tries to blend in!</li>
          </ul>
        </Card>
      </Card>
    </div>
  );
};

export default Index;
