import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePartyRoom } from "@/hooks/usePartyRoom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Copy, Crown, Users } from "lucide-react";

const Room = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [clueInput, setClueInput] = useState("");

  const {
    gameState,
    connected,
    joinGame,
    startRound,
    submitClue,
    submitVote,
    nextRound,
  } = usePartyRoom(code || "");

  useEffect(() => {
    if (!code) {
      navigate("/");
    }
  }, [code, navigate]);

  const handleJoin = () => {
    if (playerName.trim()) {
      joinGame(playerName);
      setHasJoined(true);
    }
  };

  const handleCopyLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied!");
  };

  const handleSubmitClue = () => {
    if (clueInput.trim()) {
      submitClue(clueInput);
      setClueInput("");
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-game flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <div className="animate-pulse">Connecting to room...</div>
        </Card>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-gradient-game flex items-center justify-center p-4">
        <Card className="p-8 w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Chameleon
            </h1>
            <p className="text-muted-foreground">Room: {code}</p>
          </div>

          <div className="space-y-4">
            <div>
              <Input
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                className="text-lg"
              />
            </div>

            <Button onClick={handleJoin} className="w-full" size="lg">
              Join Game
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!gameState) {
    return null;
  }

  const currentPlayer = gameState.players.find((p) => p.id === gameState.playerId);
  const hasSubmittedClue = currentPlayer?.clue !== undefined;
  const hasSubmittedVote = currentPlayer?.vote !== undefined;

  return (
    <div className="min-h-screen bg-gradient-game p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Chameleon
            </h1>
            <p className="text-sm text-muted-foreground">Round {gameState.round}</p>
          </div>
          <Button onClick={handleCopyLink} variant="outline" size="sm">
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
        </div>

        {/* Players List */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5" />
            <h2 className="text-xl font-semibold">
              Players ({gameState.players.length})
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {gameState.players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted"
              >
                <div className="flex items-center gap-2">
                  {player.isHost && <Crown className="w-4 h-4 text-accent" />}
                  <span className="font-medium">{player.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {player.score}pts
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Lobby Phase */}
        {gameState.phase === "lobby" && (
          <Card className="p-8 text-center space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Waiting to Start</h2>
              <p className="text-muted-foreground">
                {gameState.players.length < 3
                  ? "Need at least 3 players to start"
                  : "Ready to play!"}
              </p>
            </div>

            {gameState.isHost && gameState.players.length >= 3 && (
              <Button onClick={startRound} size="lg" className="bg-gradient-primary">
                Start Round
              </Button>
            )}
          </Card>
        )}

        {/* Clue Phase */}
        {gameState.phase === "clue" && (
          <div className="space-y-6">
            {/* Role Card */}
            <Card className="p-6">
              <div className="text-center space-y-4">
                {gameState.isChameleon ? (
                  <>
                    <div className="text-2xl font-bold text-destructive">
                      You are the CHAMELEON 🦎
                    </div>
                    <p className="text-muted-foreground">
                      You don't know the secret word. Give a vague clue to blend in!
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-muted-foreground">Secret Word:</div>
                    <div className="text-3xl font-bold bg-gradient-secondary bg-clip-text text-transparent">
                      {gameState.secretWord}
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Word Grid */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-center">
                {gameState.wordPack} Theme
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {gameState.wordGrid.map((word, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg text-center text-sm font-medium transition-all ${
                      word === gameState.secretWord && !gameState.isChameleon
                        ? "bg-gradient-secondary text-secondary-foreground shadow-soft"
                        : "bg-muted"
                    }`}
                  >
                    {word}
                  </div>
                ))}
              </div>
            </Card>

            {/* Clue Submission */}
            {!hasSubmittedClue ? (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Give Your Clue</h3>
                <div className="flex gap-3">
                  <Input
                    placeholder="One word clue..."
                    value={clueInput}
                    onChange={(e) => setClueInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmitClue()}
                  />
                  <Button onClick={handleSubmitClue}>Submit</Button>
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">
                  Waiting for others... ({gameState.cluesSubmitted}/
                  {gameState.players.length})
                </p>
              </Card>
            )}

            {/* All Clues */}
            {gameState.cluesSubmitted > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Clues Given</h3>
                <div className="space-y-2">
                  {gameState.players
                    .filter((p) => p.clue)
                    .map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted"
                      >
                        <span className="font-medium">{player.name}:</span>
                        <span className="text-lg">{player.clue}</span>
                      </div>
                    ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Vote Phase */}
        {gameState.phase === "vote" && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-center mb-6">
                Who is the Chameleon?
              </h2>

              {!hasSubmittedVote ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {gameState.players
                    .filter((p) => p.id !== gameState.playerId)
                    .map((player) => (
                      <Button
                        key={player.id}
                        onClick={() => submitVote(player.id)}
                        variant="outline"
                        className="h-auto py-4"
                      >
                        {player.name}
                      </Button>
                    ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">
                  Vote submitted! ({gameState.votesSubmitted}/
                  {gameState.players.length})
                </p>
              )}
            </Card>

            {/* Clues Review */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Review Clues</h3>
              <div className="space-y-2">
                {gameState.players
                  .filter((p) => p.clue)
                  .map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted"
                    >
                      <span className="font-medium">{player.name}:</span>
                      <span className="text-lg">{player.clue}</span>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        )}

        {/* Reveal Phase */}
        {gameState.phase === "reveal" && (
          <div className="space-y-6">
            <Card className="p-8 text-center space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-4">Round Over!</h2>
                <div className="text-xl mb-2">The secret word was:</div>
                <div className="text-4xl font-bold bg-gradient-secondary bg-clip-text text-transparent mb-4">
                  {gameState.secretWord}
                </div>
                <div className="text-xl mb-2">The chameleon was:</div>
                <div className="text-3xl font-bold text-destructive">
                  {gameState.players.find((p) => p.id === gameState.chameleonId)
                    ?.name || "Unknown"}
                </div>
              </div>

              {/* Vote Results */}
              <div className="space-y-2">
                <h3 className="font-semibold">Votes:</h3>
                {gameState.players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted"
                  >
                    <span>{player.name}</span>
                    <span>
                      voted for{" "}
                      {gameState.players.find((p) => p.id === player.vote)
                        ?.name || "no one"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Scores */}
              <div>
                <h3 className="font-semibold mb-2">Scores:</h3>
                <div className="space-y-2">
                  {gameState.players
                    .sort((a, b) => b.score - a.score)
                    .map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted"
                      >
                        <span className="font-medium">{player.name}</span>
                        <span className="text-xl font-bold">{player.score}</span>
                      </div>
                    ))}
                </div>
              </div>

              {gameState.isHost && (
                <Button
                  onClick={nextRound}
                  size="lg"
                  className="bg-gradient-primary"
                >
                  Next Round
                </Button>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Room;
