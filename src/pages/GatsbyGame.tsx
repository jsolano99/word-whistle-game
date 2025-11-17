import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [chameleonId, setChameleonId] = useState<string | null>(null);
  const [secretWord, setSecretWord] = useState<string | null>(null);
  const [wordGrid, setWordGrid] = useState<string[]>([]);
  const [currentPlayerClue, setCurrentPlayerClue] = useState("");
  const [drewmeleonGuess, setDrewmeleonGuess] = useState("");

  const addPlayer = () => {
    if (!playerName.trim()) {
      toast({
        title: "Invalid name",
        description: "Please enter a player name",
        variant: "destructive",
      });
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
  };

  const removePlayer = (playerId: string) => {
    setPlayers(players.filter((p) => p.id !== playerId));
  };

  const startRound = () => {
    if (players.length < 3) {
      toast({
        title: "Not enough players",
        description: "You need at least 3 players to start",
        variant: "destructive",
      });
      return;
    }

    const randomChameleon = players[Math.floor(Math.random() * players.length)];
    const shuffled = [...DREW_EDITION_PACK].sort(() => Math.random() - 0.5);
    const secret = shuffled[0];
    const grid = shuffled.slice(0, 16);

    setChameleonId(randomChameleon.id);
    setSecretWord(secret);
    setWordGrid(grid);
    setPhase("clue");
  };

  const submitClue = (playerId: string) => {
    if (!currentPlayerClue.trim()) {
      toast({
        title: "Invalid clue",
        description: "Please enter a clue",
        variant: "destructive",
      });
      return;
    }

    setPlayers(
      players.map((p) =>
        p.id === playerId ? { ...p, clue: currentPlayerClue.trim() } : p
      )
    );
    setCurrentPlayerClue("");
  };

  const goToVote = () => {
    if (players.some((p) => !p.clue)) {
      toast({
        title: "Not all clues submitted",
        description: "All players must submit their clues",
        variant: "destructive",
      });
      return;
    }
    setPhase("vote");
  };

  const submitVote = (voterId: string, votedForId: string) => {
    setPlayers(
      players.map((p) => (p.id === voterId ? { ...p, vote: votedForId } : p))
    );
  };

  const goToReveal = () => {
    if (players.some((p) => !p.vote)) {
      toast({
        title: "Not all votes submitted",
        description: "All players must vote",
        variant: "destructive",
      });
      return;
    }
    setPhase("reveal");
  };

  const drewmeleonGuessWord = () => {
    if (!drewmeleonGuess.trim()) {
      toast({
        title: "Invalid guess",
        description: "Drewmeleon must guess a word",
        variant: "destructive",
      });
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

    toast({
      title: correctGuess
        ? "Drewmeleon guessed correctly!"
        : "Drewmeleon guessed wrong!",
      description: `The secret word was: ${secretWord}`,
    });
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
    setPhase("lobby");
  };

  if (phase === "lobby") {
    return (
      <div className="min-h-screen bg-gradient-game flex items-center justify-center p-4">
        <Card className="p-8 md:p-12 w-full max-w-2xl space-y-6 shadow-card">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Drew Edition
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={returnToGatsbyMode}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter player name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPlayer()}
              />
              <Button onClick={addPlayer}>Add Player</Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Players ({players.length})</h3>
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <span>
                    {player.name} {player.isHost && "(Host)"}
                  </span>
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

            <Button
              onClick={startRound}
              className="w-full"
              size="lg"
              disabled={players.length < 3}
            >
              Start Round
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (phase === "clue") {
    return (
      <div className="min-h-screen bg-gradient-game p-4">
        <Card className="p-8 max-w-4xl mx-auto space-y-6 shadow-card">
          <h2 className="text-3xl font-bold text-center">Submit Clues</h2>

          <div className="grid grid-cols-4 gap-2 mb-6">
            {wordGrid.map((word, idx) => (
              <div
                key={idx}
                className="p-3 bg-muted rounded-lg text-center font-medium"
              >
                {word}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {players.map((player) => (
              <div key={player.id} className="flex items-center gap-2">
                <span className="w-32 font-medium">{player.name}:</span>
                {player.clue ? (
                  <span className="text-muted-foreground">✓ Clue submitted</span>
                ) : player.id === chameleonId ? (
                  <span className="text-muted-foreground italic">
                    You are the Drewmeleon! Submit any clue.
                  </span>
                ) : (
                  <>
                    <Input
                      placeholder={`Clue for "${secretWord}"`}
                      value={currentPlayerClue}
                      onChange={(e) => setCurrentPlayerClue(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && submitClue(player.id)
                      }
                    />
                    <Button onClick={() => submitClue(player.id)}>Submit</Button>
                  </>
                )}
              </div>
            ))}
          </div>

          <Button onClick={goToVote} className="w-full" size="lg">
            Go to Voting
          </Button>
        </Card>
      </div>
    );
  }

  if (phase === "vote") {
    return (
      <div className="min-h-screen bg-gradient-game p-4">
        <Card className="p-8 max-w-4xl mx-auto space-y-6 shadow-card">
          <h2 className="text-3xl font-bold text-center">Vote for the Drewmeleon</h2>

          <div className="space-y-4">
            {players.map((voter) => (
              <div key={voter.id} className="space-y-2">
                <span className="font-medium">{voter.name}'s vote:</span>
                {voter.vote ? (
                  <span className="text-muted-foreground ml-2">
                    ✓ Voted for {players.find((p) => p.id === voter.vote)?.name}
                  </span>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    {players
                      .filter((p) => p.id !== voter.id)
                      .map((candidate) => (
                        <Button
                          key={candidate.id}
                          variant="outline"
                          onClick={() => submitVote(voter.id, candidate.id)}
                        >
                          {candidate.name}
                        </Button>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button onClick={goToReveal} className="w-full" size="lg">
            Reveal Results
          </Button>
        </Card>
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
      </div>
    );
  }

  return null;
};

export default GatsbyGame;
