import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalGame, getWordPackNames } from "@/hooks/useLocalGame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Crown, Users, Trash2, UserPlus, Box } from "lucide-react";

const Game = () => {
  const navigate = useNavigate();
  const [playerNameInput, setPlayerNameInput] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [clueInput, setClueInput] = useState("");

  const {
    gameState,
    addPlayer,
    removePlayer,
    setWordPack,
    startRound,
    submitClue,
    goToVote,
    submitVote,
    goToReveal,
    nextRound,
    resetGame,
  } = useLocalGame();

  const wordPackNames = getWordPackNames();

  const handleAddPlayer = () => {
    if (playerNameInput.trim()) {
      addPlayer(playerNameInput.trim());
      setPlayerNameInput("");
      toast.success("Player added!");
    }
  };

  const handleStartRound = () => {
    if (gameState.players.length < 3) {
      toast.error("Need at least 3 players to start!");
      return;
    }
    if (!gameState.selectedWordPack) {
      toast.error("Please select a word pack!");
      return;
    }
    startRound();
  };

  const handleSubmitClue = (playerId: string) => {
    if (clueInput.trim()) {
      submitClue(playerId, clueInput.trim());
      setClueInput("");
      toast.success("Clue submitted!");
      
      // Check if all clues are in
      const allSubmitted = gameState.players.every((p) => 
        p.id === playerId ? true : p.clue !== undefined
      );
      if (allSubmitted) {
        setTimeout(() => {
          toast.info("All clues submitted! Ready to vote.");
        }, 500);
      }
    }
  };

  const handleVote = (voterId: string, votedPlayerId: string) => {
    submitVote(voterId, votedPlayerId);
    toast.success("Vote submitted!");
    
    // Check if all votes are in
    const allVoted = gameState.players.every((p) => 
      p.id === voterId ? true : p.vote !== undefined
    );
    if (allVoted) {
      setTimeout(() => {
        toast.info("All votes submitted! Ready to reveal.");
      }, 500);
    }
  };

  const handleGoToVote = () => {
    const allCluesSubmitted = gameState.players.every((p) => p.clue);
    if (!allCluesSubmitted) {
      toast.error("Wait for all players to submit clues!");
      return;
    }
    goToVote();
  };

  const handleReveal = () => {
    const allVotesSubmitted = gameState.players.every((p) => p.vote);
    if (!allVotesSubmitted) {
      toast.error("Wait for all players to vote!");
      return;
    }
    goToReveal();
  };

  const handleResetGame = () => {
    resetGame();
    navigate("/");
  };

  // Helper to check if a player has submitted their action
  const hasPlayerSubmitted = (playerId: string, phase: "clue" | "vote") => {
    const player = gameState.players.find((p) => p.id === playerId);
    if (!player) return false;
    return phase === "clue" ? !!player.clue : !!player.vote;
  };

  const cluesSubmitted = gameState.players.filter((p) => p.clue).length;
  const votesSubmitted = gameState.players.filter((p) => p.vote).length;
  const allCluesIn = cluesSubmitted === gameState.players.length;
  const allVotesIn = votesSubmitted === gameState.players.length;

  return (
    <div className="min-h-screen bg-gradient-game p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Drewmeleon
            </h1>
            <p className="text-sm text-muted-foreground">Round {gameState.round}</p>
          </div>
          <Button onClick={handleResetGame} variant="outline" size="sm">
            New Game
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
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {player.score}pts
                  </span>
                  {gameState.phase === "lobby" && (
                    <button
                      onClick={() => removePlayer(player.id)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Lobby Phase */}
        {gameState.phase === "lobby" && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Add Players
              </h3>
              <div className="flex gap-3">
                <Input
                  placeholder="Player name"
                  value={playerNameInput}
                  onChange={(e) => setPlayerNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()}
                />
                <Button onClick={handleAddPlayer}>Add</Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Box className="w-5 h-5" />
                Choose Word Pack
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {wordPackNames.map((packName) => (
                  <Button
                    key={packName}
                    onClick={() => setWordPack(packName)}
                    variant={gameState.selectedWordPack === packName ? "default" : "outline"}
                    className="h-auto py-6"
                  >
                    {packName}
                  </Button>
                ))}
              </div>
            </Card>

            <Card className="p-8 text-center space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Ready to Start?</h2>
                <p className="text-muted-foreground">
                  {gameState.players.length < 3
                    ? `Need at least 3 players (currently ${gameState.players.length})`
                    : !gameState.selectedWordPack
                    ? "Select a word pack to continue"
                    : `${gameState.players.length} players ready with ${gameState.selectedWordPack} pack!`}
                </p>
              </div>

              {gameState.players.length >= 3 && gameState.selectedWordPack && (
                <Button onClick={handleStartRound} size="lg" className="bg-gradient-primary">
                  Start Round
                </Button>
              )}
            </Card>
          </div>
        )}

        {/* Clue Phase */}
        {gameState.phase === "clue" && (
          <div className="space-y-6">
            {/* Player Selection for Pass-and-Play */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Who's Turn?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Pass the device to each player to see their role and submit their clue.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {gameState.players.map((player) => (
                  <Button
                    key={player.id}
                    onClick={() => setSelectedPlayerId(player.id)}
                    variant={selectedPlayerId === player.id ? "default" : "outline"}
                    className="h-auto py-4"
                  >
                    {player.name}
                    {hasPlayerSubmitted(player.id, "clue") && " ✓"}
                  </Button>
                ))}
              </div>
            </Card>

            {selectedPlayerId && (
              <>
                {/* Role Card */}
                <Card className="p-6">
                  <div className="text-center space-y-4">
                    {gameState.chameleonId === selectedPlayerId ? (
                      <>
                        <div className="text-2xl font-bold text-destructive">
                          You are the DREWMELEON 🦎
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
                        <p className="text-sm text-muted-foreground">
                          Give a clue related to this word, but don't be too obvious!
                        </p>
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
                          word === gameState.secretWord && gameState.chameleonId !== selectedPlayerId
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
                {!hasPlayerSubmitted(selectedPlayerId, "clue") ? (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Give Your Clue ({gameState.players.find(p => p.id === selectedPlayerId)?.name})
                    </h3>
                    <div className="flex gap-3">
                      <Input
                        placeholder="One word clue..."
                        value={clueInput}
                        onChange={(e) => setClueInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmitClue(selectedPlayerId)}
                      />
                      <Button onClick={() => handleSubmitClue(selectedPlayerId)}>Submit</Button>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-6 text-center">
                    <p className="text-muted-foreground">
                      ✓ Clue submitted! Pass to next player.
                    </p>
                  </Card>
                )}
              </>
            )}

            {/* All Clues Progress */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Clue Progress ({cluesSubmitted}/{gameState.players.length})
              </h3>
              {cluesSubmitted > 0 && (
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
              )}
              
              {allCluesIn && (
                <Button onClick={handleGoToVote} className="w-full mt-4 bg-gradient-primary">
                  All Clues In - Go to Voting
                </Button>
              )}
            </Card>
          </div>
        )}

        {/* Vote Phase */}
        {gameState.phase === "vote" && (
          <div className="space-y-6">
            {/* Player Selection */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Who's Turn to Vote?</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {gameState.players.map((player) => (
                  <Button
                    key={player.id}
                    onClick={() => setSelectedPlayerId(player.id)}
                    variant={selectedPlayerId === player.id ? "default" : "outline"}
                    className="h-auto py-4"
                  >
                    {player.name}
                    {hasPlayerSubmitted(player.id, "vote") && " ✓"}
                  </Button>
                ))}
              </div>
            </Card>

            {selectedPlayerId && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold text-center mb-6">
                  {gameState.players.find(p => p.id === selectedPlayerId)?.name}: Who is the Drewmeleon?
                </h2>

                {!hasPlayerSubmitted(selectedPlayerId, "vote") ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {gameState.players
                      .filter((p) => p.id !== selectedPlayerId)
                      .map((player) => (
                        <Button
                          key={player.id}
                          onClick={() => handleVote(selectedPlayerId, player.id)}
                          variant="outline"
                          className="h-auto py-4"
                        >
                          {player.name}
                        </Button>
                      ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">
                    ✓ Vote submitted! Pass to next player.
                  </p>
                )}
              </Card>
            )}

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

            {/* Vote Progress */}
            <Card className="p-6 text-center">
              <p className="text-muted-foreground mb-4">
                Votes: {votesSubmitted}/{gameState.players.length}
              </p>
              {allVotesIn && (
                <Button onClick={handleReveal} className="bg-gradient-primary">
                  All Votes In - Reveal Results
                </Button>
              )}
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
                <div className="text-xl mb-2">The Drewmeleon was:</div>
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

              <Button
                onClick={nextRound}
                size="lg"
                className="bg-gradient-primary"
              >
                Next Round
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;
