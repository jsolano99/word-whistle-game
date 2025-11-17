import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalGame, getWordPackNames } from "@/hooks/useLocalGame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Crown, Users, Trash2, UserPlus, Box, Plus, X } from "lucide-react";
import { z } from "zod";
import { BugReportWidget } from "@/components/BugReportWidget";

const customPackSchema = z.object({
  name: z.string().trim().min(1, "Pack name is required").max(30, "Pack name must be less than 30 characters"),
  words: z.array(z.string().trim().min(1).max(50)).min(8, "At least 8 words are required").max(20, "Maximum 20 words allowed"),
});

const Game = () => {
  const navigate = useNavigate();
  const [playerNameInput, setPlayerNameInput] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [clueInput, setClueInput] = useState("");
  const [isCustomPackDialogOpen, setIsCustomPackDialogOpen] = useState(false);
  const [customPackName, setCustomPackName] = useState("");
  const [customPackWords, setCustomPackWords] = useState<string[]>([""]);

  const {
    gameState,
    customPacks,
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
    addCustomPack,
    deleteCustomPack,
    isCustomPack,
  } = useLocalGame();

  const wordPackNames = getWordPackNames(customPacks);

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

  const handleAddWordField = () => {
    if (customPackWords.length < 20) {
      setCustomPackWords([...customPackWords, ""]);
    }
  };

  const handleRemoveWordField = (index: number) => {
    if (customPackWords.length > 1) {
      setCustomPackWords(customPackWords.filter((_, i) => i !== index));
    }
  };

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...customPackWords];
    newWords[index] = value;
    setCustomPackWords(newWords);
  };

  const handleCreateCustomPack = () => {
    try {
      const trimmedWords = customPackWords
        .map((w) => w.trim())
        .filter((w) => w.length > 0);
      
      const validated = customPackSchema.parse({
        name: customPackName,
        words: trimmedWords,
      });

      addCustomPack(validated.name, validated.words);
      toast.success(`Custom pack "${validated.name}" created!`);
      
      // Reset form
      setCustomPackName("");
      setCustomPackWords([""]);
      setIsCustomPackDialogOpen(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const handleDeleteCustomPack = (packName: string) => {
    deleteCustomPack(packName);
    toast.success(`Deleted "${packName}" pack`);
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
        <Card className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <Users className="w-4 h-4 md:w-5 md:h-5" />
            <h2 className="text-lg md:text-xl lg:text-2xl font-semibold">
              Players ({gameState.players.length})
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
            {gameState.players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-muted gap-1"
              >
                <div className="flex items-center gap-1 md:gap-2 min-w-0">
                  {player.isHost && <Crown className="w-3 h-3 md:w-4 md:h-4 text-accent flex-shrink-0" />}
                  <span className="font-medium text-sm md:text-base truncate">{player.name}</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                  <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                    {player.score}pts
                  </span>
                  {gameState.phase === "lobby" && (
                    <button
                      onClick={() => removePlayer(player.id)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
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
            <Card className="p-4 md:p-6">
              <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-3 md:mb-4 flex items-center gap-2">
                <UserPlus className="w-4 h-4 md:w-5 md:h-5" />
                Add Players
              </h3>
              <div className="flex gap-2 md:gap-3">
                <Input
                  placeholder="Player name"
                  value={playerNameInput}
                  onChange={(e) => setPlayerNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()}
                  className="text-sm md:text-base"
                />
                <Button onClick={handleAddPlayer} className="text-sm md:text-base whitespace-nowrap">Add</Button>
              </div>
            </Card>

            <Card className="p-4 md:p-6">
              <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-3 md:mb-4 flex items-center gap-2">
                <Box className="w-4 h-4 md:w-5 md:h-5" />
                Choose Word Pack
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                {wordPackNames.map((packName) => (
                  <div key={packName} className="relative">
                    <Button
                      onClick={() => setWordPack(packName)}
                      variant={gameState.selectedWordPack === packName ? "default" : "outline"}
                      className="h-auto py-4 md:py-6 w-full text-xs md:text-sm break-words"
                    >
                      {packName}
                    </Button>
                    {isCustomPack(packName) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomPack(packName);
                        }}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                <Dialog open={isCustomPackDialogOpen} onOpenChange={setIsCustomPackDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-auto py-4 md:py-6 border-dashed text-xs md:text-sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Custom
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Custom Word Pack</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Pack Name</label>
                        <Input
                          placeholder="e.g., Tech, Countries, Colors..."
                          value={customPackName}
                          onChange={(e) => setCustomPackName(e.target.value)}
                          maxLength={30}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium">Words (8-20 required)</label>
                          <span className="text-xs text-muted-foreground">
                            {customPackWords.filter((w) => w.trim()).length} / 20
                          </span>
                        </div>
                        <div className="space-y-2">
                          {customPackWords.map((word, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                placeholder={`Word ${index + 1}`}
                                value={word}
                                onChange={(e) => handleWordChange(index, e.target.value)}
                                maxLength={50}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveWordField(index)}
                                disabled={customPackWords.length <= 1}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          {customPackWords.length < 20 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleAddWordField}
                              className="w-full"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Word
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCustomPackDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateCustomPack}>
                        Create Pack
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
            <Card className="p-4 md:p-6">
              <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-3 md:mb-4">Who's Turn?</h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                Pass the device to each player to see their role and submit their clue.
              </p>
              <p className="text-xs md:text-sm mb-3 md:mb-4">
                <strong>Once you see your role press your name and pass it to the next player.</strong>
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                {gameState.players.map((player) => (
                  <Button
                    key={player.id}
                    onClick={() => setSelectedPlayerId(player.id)}
                    variant={selectedPlayerId === player.id ? "default" : "outline"}
                    className="h-auto py-3 md:py-4 text-sm md:text-base break-words"
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
                <Card className="p-4 md:p-6">
                  <div className="text-center space-y-3 md:space-y-4">
                    {gameState.chameleonId === selectedPlayerId ? (
                      <>
                        <div className="text-xl md:text-2xl lg:text-3xl font-bold text-destructive break-words">
                          You are the DREWMELEON 🦎
                        </div>
                        <p className="text-sm md:text-base text-muted-foreground">
                          You don't know the secret word. Give a vague clue to blend in!
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-xs md:text-sm text-muted-foreground">Secret Word:</div>
                        <div className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-secondary bg-clip-text text-transparent break-words">
                          {gameState.secretWord}
                        </div>
                        <p className="text-sm md:text-base text-muted-foreground">
                          Give a clue related to this word, but don't be too obvious!
                        </p>
                      </>
                    )}
                  </div>
                </Card>

                {/* Word Grid */}
                <Card className="p-4 md:p-6">
                  <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-3 md:mb-4 text-center break-words">
                    {gameState.wordPack} Theme
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {gameState.wordGrid.map((word, idx) => (
                      <div
                        key={idx}
                        className={`p-2 md:p-3 rounded-lg text-center text-xs md:text-sm font-medium transition-all break-words ${
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
                  <Card className="p-4 md:p-6">
                    <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-3 md:mb-4 break-words">
                      Give Your Clue ({gameState.players.find(p => p.id === selectedPlayerId)?.name})
                    </h3>
                    <div className="flex gap-2 md:gap-3">
                      <Input
                        placeholder="One word clue..."
                        value={clueInput}
                        onChange={(e) => setClueInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmitClue(selectedPlayerId)}
                        className="text-sm md:text-base"
                      />
                      <Button onClick={() => handleSubmitClue(selectedPlayerId)} className="text-sm md:text-base whitespace-nowrap">Submit</Button>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-4 md:p-6 text-center">
                    <p className="text-sm md:text-base text-muted-foreground">
                      ✓ Clue submitted! Pass to next player.
                    </p>
                  </Card>
                )}
              </>
            )}

            {/* All Clues Progress */}
            <Card className="p-4 md:p-6">
              <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-3 md:mb-4">
                Clue Progress ({cluesSubmitted}/{gameState.players.length})
              </h3>
              {cluesSubmitted > 0 && (
                <div className="space-y-2">
                  {gameState.players
                    .filter((p) => p.clue)
                    .map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-muted gap-2"
                      >
                        <span className="font-medium text-sm md:text-base break-words">{player.name}:</span>
                        <span className="text-base md:text-lg font-semibold break-words">{player.clue}</span>
                      </div>
                    ))}
                </div>
              )}
              
              {allCluesIn && (
                <Button onClick={handleGoToVote} className="w-full mt-3 md:mt-4 bg-gradient-primary text-sm md:text-base">
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
            <Card className="p-4 md:p-6">
              <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-3 md:mb-4">Who's Turn to Vote?</h3>
              <p className="text-xs md:text-sm mb-3 md:mb-4">
                <strong>Once you see your role press your name and pass it to the next player.</strong>
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                {gameState.players.map((player) => (
                  <Button
                    key={player.id}
                    onClick={() => setSelectedPlayerId(player.id)}
                    variant={selectedPlayerId === player.id ? "default" : "outline"}
                    className="h-auto py-3 md:py-4 text-sm md:text-base break-words"
                  >
                    {player.name}
                    {hasPlayerSubmitted(player.id, "vote") && " ✓"}
                  </Button>
                ))}
              </div>
            </Card>

            {selectedPlayerId && (
              <Card className="p-4 md:p-6">
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-center mb-4 md:mb-6 break-words">
                  {gameState.players.find(p => p.id === selectedPlayerId)?.name}: Who is the Drewmeleon?
                </h2>

                {!hasPlayerSubmitted(selectedPlayerId, "vote") ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                    {gameState.players
                      .filter((p) => p.id !== selectedPlayerId)
                      .map((player) => (
                        <Button
                          key={player.id}
                          onClick={() => handleVote(selectedPlayerId, player.id)}
                          variant="outline"
                          className="h-auto py-3 md:py-4 text-sm md:text-base break-words"
                        >
                          {player.name}
                        </Button>
                      ))}
                  </div>
                ) : (
                  <p className="text-center text-sm md:text-base text-muted-foreground">
                    ✓ Vote submitted! Pass to next player.
                  </p>
                )}
              </Card>
            )}

            {/* Clues Review */}
            <Card className="p-4 md:p-6">
              <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-3 md:mb-4">Review Clues</h3>
              <div className="space-y-2">
                {gameState.players
                  .filter((p) => p.clue)
                  .map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-muted gap-2"
                    >
                      <span className="font-medium text-sm md:text-base break-words">{player.name}:</span>
                      <span className="text-base md:text-lg font-semibold break-words">{player.clue}</span>
                    </div>
                  ))}
              </div>
            </Card>

            {/* Vote Progress */}
            <Card className="p-4 md:p-6 text-center">
              <p className="text-sm md:text-base text-muted-foreground mb-3 md:mb-4">
                Votes: {votesSubmitted}/{gameState.players.length}
              </p>
              {allVotesIn && (
                <Button onClick={handleReveal} className="bg-gradient-primary text-sm md:text-base">
                  All Votes In - Reveal Results
                </Button>
              )}
            </Card>
          </div>
        )}

        {/* Reveal Phase */}
        {gameState.phase === "reveal" && (
          <div className="space-y-4 md:space-y-6">
            <Card className="p-4 md:p-6 lg:p-8 text-center space-y-4 md:space-y-6">
              <div>
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-3 md:mb-4">Round Over!</h2>
                <div className="text-base md:text-lg lg:text-xl mb-2">The secret word was:</div>
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-secondary bg-clip-text text-transparent mb-3 md:mb-4 break-words">
                  {gameState.secretWord}
                </div>
                <div className="text-base md:text-lg lg:text-xl mb-2">The Drewmeleon was:</div>
                <div className="text-xl md:text-2xl lg:text-3xl font-bold text-destructive break-words">
                  {gameState.players.find((p) => p.id === gameState.chameleonId)
                    ?.name || "Unknown"}
                </div>
              </div>

              {/* Vote Results */}
              <div className="space-y-2">
                <h3 className="font-semibold text-base md:text-lg">Votes:</h3>
                {gameState.players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-muted gap-2 text-sm md:text-base"
                  >
                    <span className="break-words">{player.name}</span>
                    <span className="text-right break-words">
                      voted for{" "}
                      {gameState.players.find((p) => p.id === player.vote)
                        ?.name || "no one"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Scores */}
              <div>
                <h3 className="font-semibold mb-2 text-base md:text-lg">Scores:</h3>
                <div className="space-y-2">
                  {gameState.players
                    .sort((a, b) => b.score - a.score)
                    .map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-muted gap-2"
                      >
                        <span className="font-medium text-sm md:text-base break-words">{player.name}</span>
                        <span className="text-lg md:text-xl font-bold">{player.score}</span>
                      </div>
                    ))}
                </div>
              </div>

              <Button
                onClick={nextRound}
                size="lg"
                className="bg-gradient-primary text-sm md:text-base w-full md:w-auto"
              >
                Next Round
              </Button>
            </Card>
          </div>
        )}
      </div>
      <BugReportWidget />
    </div>
  );
};

export default Game;
