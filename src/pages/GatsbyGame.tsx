import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BugReportWidget } from "@/components/BugReportWidget";
import { Trash2, ArrowLeft, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  clue?: string;
  vote?: string;
  score: number;
}

type GamePhase = "lobby" | "clue" | "vote" | "reveal";

const DREW_EDITION_PACK = [
  "Shanghai", "New York", "Toronto", "Bell", "Google", "Meta", "Fibe", "Jasper",
  "Aesop Soap", "Lumos House", "Fried Chicken", "Omakase", "Dunking", "Arm Day", "Bunny", "Twitter"
];

const GatsbyGame = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [chameleonId, setChameleonId] = useState<string | null>(null);
  const [secretWord, setSecretWord] = useState<string | null>(null);
  const [wordGrid, setWordGrid] = useState<string[]>([]);
  const [clueInput, setClueInput] = useState("");
  const [drewmeleonGuess, setDrewmeleonGuess] = useState("");

  const addPlayer = () => {
    if (!playerName.trim()) {
      toast.error("Please enter a player name");
      return;
    }

    const nameExists = players.some((p) => p.name.toLowerCase() === playerName.trim().toLowerCase());
    if (nameExists) {
      toast.error("This name is already taken. Please choose a unique name.");
      return;
    }

    const newPlayer: Player = {
      id: Math.random().toString(36).substring(2, 11),
      name: playerName.trim(),
      isHost: players.length === 0,
      score: 0,
    };

    setPlayers([...players, newPlayer]);
    setPlayerName("");
    toast.success("Player added!");
  };

  const removePlayer = (playerId: string) => {
    setPlayers(players.filter((p) => p.id !== playerId));
    toast.success("Player removed");
  };

  const startRound = () => {
    if (players.length < 3) {
      toast.error("Need at least 3 players to start!");
      return;
    }

    const randomChameleon = players[Math.floor(Math.random() * players.length)];
    const shuffled = [...DREW_EDITION_PACK].sort(() => Math.random() - 0.5);
    const secret = shuffled[0];
    const grid = shuffled.slice(0, 16);

    setChameleonId(randomChameleon.id);
    setSecretWord(secret);
    setWordGrid(grid);
    setSelectedPlayerId(null);
    setPhase("clue");
  };

  const submitClue = (playerId: string) => {
    if (!clueInput.trim()) {
      toast.error("Please enter a clue");
      return;
    }

    setPlayers(
      players.map((p) =>
        p.id === playerId ? { ...p, clue: clueInput.trim() } : p
      )
    );
    setClueInput("");
    toast.success("Clue submitted!");

    // Check if all clues are in
    const allSubmitted = players.every((p) => (p.id === playerId ? true : p.clue !== undefined));
    if (allSubmitted) {
      toast.success("All clues submitted!");
    }
  };

  const goToVote = () => {
    if (players.some((p) => !p.clue)) {
      toast.error("All players must submit their clues first!");
      return;
    }
    setSelectedPlayerId(null);
    setPhase("vote");
  };

  const submitVote = (voterId: string, votedForId: string) => {
    setPlayers(
      players.map((p) => (p.id === voterId ? { ...p, vote: votedForId } : p))
    );
    toast.success("Vote submitted!");

    // Check if all votes are in
    const allVoted = players.every((p) => (p.id === voterId ? true : p.vote !== undefined));
    if (allVoted) {
      toast.success("All votes are in!");
    }
  };

  const goToReveal = () => {
    if (players.some((p) => !p.vote)) {
      toast.error("All players must vote first!");
      return;
    }
    setPhase("reveal");
  };

  const drewmeleonGuessWord = () => {
    if (!drewmeleonGuess.trim()) {
      toast.error("Please enter a guess");
      return;
    }

    const voteCounts: { [key: string]: number } = {};
    players.forEach((p) => {
      if (p.vote) voteCounts[p.vote] = (voteCounts[p.vote] || 0) + 1;
    });

    const maxVotes = Math.max(...Object.values(voteCounts));
    const mostVotedIds = Object.keys(voteCounts).filter(
      (id) => voteCounts[id] === maxVotes
    );

    const correctGuess =
      drewmeleonGuess.trim().toLowerCase() === secretWord?.toLowerCase();

    setPlayers(
      players.map((p) => {
        let points = 0;

        if (p.id === chameleonId) {
          if (correctGuess) {
            points = 2;
          } else if (mostVotedIds.includes(p.id)) {
            points = 0;
          } else {
            points = 1;
          }
        } else {
          if (mostVotedIds.includes(chameleonId!)) {
            points = correctGuess ? 0 : 2;
          } else {
            points = 0;
          }
        }

        return { ...p, score: p.score + points };
      })
    );

    toast.success(correctGuess
      ? "Drewmeleon guessed correctly!"
      : `Drewmeleon guessed wrong! The word was: ${secretWord}`);
  };

  const returnToGatsbyMode = () => {
    navigate("/?gatsby=true");
  };

  const resetRound = () => {
    setPlayers(players.map((p) => ({ ...p, clue: undefined, vote: undefined })));
    setChameleonId(null);
    setSecretWord(null);
    setWordGrid([]);
    setDrewmeleonGuess("");
    setSelectedPlayerId(null);
    setPhase("lobby");
  };

  const hasPlayerSubmitted = (playerId: string, phaseType: "clue" | "vote") => {
    const player = players.find((p) => p.id === playerId);
    if (!player) return false;
    return phaseType === "clue" ? !!player.clue : !!player.vote;
  };

  const cluesSubmitted = players.filter((p) => p.clue).length;
  const votesSubmitted = players.filter((p) => p.vote).length;
  const allCluesIn = cluesSubmitted === players.length;
  const allVotesIn = votesSubmitted === players.length;

  if (phase === "lobby") {
    return (
      <div className="min-h-screen bg-gradient-game p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Drew Edition
              </h1>
              <p className="text-sm text-muted-foreground">Word Pack: Drew Edition</p>
            </div>
            <Button onClick={returnToGatsbyMode} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Players Card */}
          <Card className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Players ({players.length})</h3>
            </div>

            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Enter player name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                className="text-sm md:text-base"
              />
              <Button onClick={addPlayer} className="text-sm md:text-base whitespace-nowrap">
                Add
              </Button>
            </div>

            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm md:text-base break-words">{player.name}</span>
                    {player.isHost && <span className="text-xs text-muted-foreground">(Host)</span>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePlayer(player.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-8 text-center space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Ready to Start?</h2>
              <p className="text-muted-foreground">
                {players.length < 3
                  ? `Need at least 3 players (currently ${players.length})`
                  : `${players.length} players ready with Drew Edition pack!`}
              </p>
            </div>

            {players.length >= 3 && (
              <Button onClick={startRound} size="lg" className="bg-gradient-primary">
                Start Round
              </Button>
            )}
          </Card>
        </div>

        <BugReportWidget />
      </div>
    );
  }

  if (phase === "clue") {
    return (
      <div className="min-h-screen bg-gradient-game p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Drew Edition
              </h1>
              <p className="text-sm text-muted-foreground">Clue Phase</p>
            </div>
            <Button onClick={returnToGatsbyMode} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Player Selection for Pass-and-Play */}
          <Card className="p-4 md:p-6">
            <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-3 md:mb-4">Who's Turn?</h3>
            <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
              Pass the device to each player to see their role and submit their clue.
            </p>
            <p className="text-xs md:text-sm mb-3 md:mb-4">
              <strong>Once you're done, deselect your name and pass it to the next player.</strong>
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
              {players.map((player) => (
                <Button
                  key={player.id}
                  onClick={() => setSelectedPlayerId(selectedPlayerId === player.id ? null : player.id)}
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
                  {chameleonId === selectedPlayerId ? (
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
                        {secretWord}
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
                  Drew Edition Theme
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {wordGrid.map((word, idx) => (
                    <div
                      key={idx}
                      className={`p-1.5 md:p-2 rounded-lg text-center font-medium transition-all overflow-hidden flex items-center justify-center min-h-[3rem] md:min-h-[3.5rem] ${
                        word === secretWord && chameleonId !== selectedPlayerId
                          ? "bg-gradient-secondary text-secondary-foreground shadow-soft"
                          : "bg-muted"
                      }`}
                    >
                      <span
                        className={`${
                          word.length > 8 ? "text-[0.65rem] md:text-xs" : "text-xs md:text-sm"
                        } break-words hyphens-auto leading-tight`}
                        style={{ wordBreak: "break-word" }}
                      >
                        {word}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Clue Submission */}
              {!hasPlayerSubmitted(selectedPlayerId, "clue") ? (
                <Card className="p-4 md:p-6">
                  <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-3 md:mb-4 break-words">
                    Give Your Clue ({players.find((p) => p.id === selectedPlayerId)?.name})
                  </h3>
                  <div className="flex gap-2 md:gap-3">
                    <Input
                      placeholder="One word clue..."
                      value={clueInput}
                      onChange={(e) => setClueInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && submitClue(selectedPlayerId)}
                      className="text-sm md:text-base"
                    />
                    <Button
                      onClick={() => submitClue(selectedPlayerId)}
                      className="text-sm md:text-base whitespace-nowrap"
                    >
                      Submit
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="p-4 md:p-6">
                  <p className="text-center text-sm md:text-base text-muted-foreground">
                    ✓ Clue submitted! Deselect your name and pass to next player.
                  </p>
                </Card>
              )}
            </>
          )}

          {/* Clues Submitted Progress */}
          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-base md:text-lg lg:text-xl font-semibold">Clues Progress</h3>
              <span className="text-sm md:text-base font-medium">
                {cluesSubmitted}/{players.length}
              </span>
            </div>

            {players.some((p) => p.clue) && (
              <div className="space-y-2">
                {players
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
              <Button
                onClick={goToVote}
                className="w-full mt-3 md:mt-4 bg-gradient-primary text-sm md:text-base"
              >
                All Clues In - Go to Voting
              </Button>
            )}
          </Card>
        </div>

        <BugReportWidget />
      </div>
    );
  }

  if (phase === "vote") {
    return (
      <div className="min-h-screen bg-gradient-game p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Drew Edition
              </h1>
              <p className="text-sm text-muted-foreground">Voting Phase</p>
            </div>
            <Button onClick={returnToGatsbyMode} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Player Selection */}
          <Card className="p-4 md:p-6">
            <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-3 md:mb-4">Who's Turn to Vote?</h3>
            <p className="text-xs md:text-sm mb-3 md:mb-4">
              <strong>Once you see your role press your name and pass it to the next player.</strong>
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
              {players.map((player) => (
                <Button
                  key={player.id}
                  onClick={() => setSelectedPlayerId(selectedPlayerId === player.id ? null : player.id)}
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
                {players.find((p) => p.id === selectedPlayerId)?.name}: Who is the Drewmeleon?
              </h2>

              {!hasPlayerSubmitted(selectedPlayerId, "vote") ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                  {players
                    .filter((p) => p.id !== selectedPlayerId)
                    .map((player) => (
                      <Button
                        key={player.id}
                        onClick={() => submitVote(selectedPlayerId, player.id)}
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
              {players
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
          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base md:text-lg font-semibold">Votes Progress</h3>
              <span className="text-sm md:text-base font-medium">
                {votesSubmitted}/{players.length}
              </span>
            </div>

            {allVotesIn && (
              <Button
                onClick={goToReveal}
                className="w-full mt-3 bg-gradient-primary text-sm md:text-base"
              >
                All Votes In - Reveal Results
              </Button>
            )}
          </Card>
        </div>

        <BugReportWidget />
      </div>
    );
  }

  if (phase === "reveal") {
    const chameleon = players.find((p) => p.id === chameleonId);

    return (
      <div className="min-h-screen bg-gradient-game p-4">
        <Card className="p-8 max-w-4xl mx-auto space-y-6 shadow-card">
          <h2 className="text-3xl font-bold text-center">Round Results</h2>

          <div className="text-center space-y-2">
            <p className="text-xl">
              The Drewmeleon was: <strong>{chameleon?.name}</strong>
            </p>
            <p className="text-lg">
              Secret word: <strong>{secretWord}</strong>
            </p>
          </div>

          {!players.find((p) => p.id === chameleonId)?.clue && (
            <div className="space-y-2">
              <label className="font-medium">Drewmeleon's guess:</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Guess the secret word"
                  value={drewmeleonGuess}
                  onChange={(e) => setDrewmeleonGuess(e.target.value)}
                />
                <Button onClick={drewmeleonGuessWord}>Submit</Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Scores:</h3>
            {players
              .sort((a, b) => b.score - a.score)
              .map((player) => (
                <div
                  key={player.id}
                  className="flex justify-between p-3 bg-muted rounded-lg"
                >
                  <span>{player.name}</span>
                  <span className="font-bold">{player.score} points</span>
                </div>
              ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={returnToGatsbyMode} className="flex-1" size="lg">
              Return to Gatsby Mode
            </Button>
            <Button onClick={resetRound} variant="outline" className="flex-1" size="lg">
              Play Again
            </Button>
          </div>
        </Card>

        <BugReportWidget />
      </div>
    );
  }

  return null;
};

export default GatsbyGame;
