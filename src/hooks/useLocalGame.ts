import { useState, useCallback } from "react";

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  clue?: string;
  vote?: string;
  score: number;
}

type GamePhase = "lobby" | "clue" | "vote" | "reveal";

interface GameState {
  phase: GamePhase;
  players: Player[];
  hostId: string | null;
  chameleonId: string | null;
  secretWord: string | null;
  wordGrid: string[];
  wordPack: string | null;
  selectedWordPack: string | null;
  round: number;
}

// Word packs for the game
const WORD_PACKS = {
  Animals: [
    "Dog", "Cat", "Lion", "Tiger", "Bear", "Wolf", "Fox", "Deer",
    "Elephant", "Giraffe", "Zebra", "Monkey", "Panda", "Koala", "Kangaroo", "Penguin"
  ],
  Food: [
    "Pizza", "Burger", "Pasta", "Sushi", "Taco", "Salad", "Steak", "Soup",
    "Sandwich", "Rice", "Bread", "Cheese", "Apple", "Banana", "Orange", "Grape"
  ],
  Sports: [
    "Soccer", "Basketball", "Tennis", "Baseball", "Football", "Hockey", "Golf", "Boxing",
    "Swimming", "Running", "Cycling", "Skiing", "Surfing", "Volleyball", "Cricket", "Rugby"
  ],
  Movies: [
    "Action", "Comedy", "Drama", "Horror", "Thriller", "Romance", "Fantasy", "SciFi",
    "Western", "Musical", "Documentary", "Animation", "Mystery", "Adventure", "Crime", "War"
  ],
};

export const getWordPackNames = () => Object.keys(WORD_PACKS);

export const useLocalGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    phase: "lobby",
    players: [],
    hostId: null,
    chameleonId: null,
    secretWord: null,
    wordGrid: [],
    wordPack: null,
    selectedWordPack: null,
    round: 1,
  });

  const addPlayer = useCallback((name: string) => {
    setGameState((prev) => {
      const newPlayer: Player = {
        id: Math.random().toString(36).substring(2, 11),
        name,
        isHost: prev.players.length === 0,
        score: 0,
      };
      
      return {
        ...prev,
        players: [...prev.players, newPlayer],
        hostId: prev.hostId || newPlayer.id,
      };
    });
  }, []);

  const removePlayer = useCallback((playerId: string) => {
    setGameState((prev) => {
      const updatedPlayers = prev.players.filter((p) => p.id !== playerId);
      
      // If host was removed, assign new host
      let newHostId = prev.hostId;
      if (playerId === prev.hostId && updatedPlayers.length > 0) {
        updatedPlayers[0].isHost = true;
        newHostId = updatedPlayers[0].id;
      }
      
      return {
        ...prev,
        players: updatedPlayers,
        hostId: newHostId,
      };
    });
  }, []);

  const setWordPack = useCallback((packName: string) => {
    setGameState((prev) => ({
      ...prev,
      selectedWordPack: packName,
    }));
  }, []);

  const startRound = useCallback(() => {
    setGameState((prev) => {
      if (!prev.selectedWordPack) return prev;
      
      // Get selected word pack
      const words = WORD_PACKS[prev.selectedWordPack as keyof typeof WORD_PACKS];
      const secretWord = words[Math.floor(Math.random() * words.length)];
      
      // Choose random chameleon
      const chameleonId = prev.players[Math.floor(Math.random() * prev.players.length)].id;
      
      // Reset player clues and votes
      const resetPlayers = prev.players.map((p) => ({
        ...p,
        clue: undefined,
        vote: undefined,
      }));
      
      return {
        ...prev,
        phase: "clue",
        players: resetPlayers,
        chameleonId,
        secretWord,
        wordGrid: words,
        wordPack: prev.selectedWordPack,
      };
    });
  }, []);

  const submitClue = useCallback((playerId: string, clue: string) => {
    setGameState((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.id === playerId ? { ...p, clue } : p
      ),
    }));
  }, []);

  const goToVote = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      phase: "vote",
    }));
  }, []);

  const submitVote = useCallback((voterId: string, votedPlayerId: string) => {
    setGameState((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.id === voterId ? { ...p, vote: votedPlayerId } : p
      ),
    }));
  }, []);

  const goToReveal = useCallback(() => {
    setGameState((prev) => {
      // Calculate scores
      const voteCounts: { [key: string]: number } = {};
      prev.players.forEach((player) => {
        if (player.vote) {
          voteCounts[player.vote] = (voteCounts[player.vote] || 0) + 1;
        }
      });

      // Find most voted player
      let mostVotedId: string | null = null;
      let maxVotes = 0;
      Object.entries(voteCounts).forEach(([playerId, count]) => {
        if (count > maxVotes) {
          maxVotes = count;
          mostVotedId = playerId;
        }
      });

      // Award points
      const updatedPlayers = prev.players.map((p) => {
        let scoreGain = 0;
        
        // If chameleon was caught
        if (mostVotedId === prev.chameleonId) {
          // Non-chameleons who voted correctly get a point
          if (p.id !== prev.chameleonId && p.vote === prev.chameleonId) {
            scoreGain = 1;
          }
        } else {
          // Chameleon escaped, gets 2 points
          if (p.id === prev.chameleonId) {
            scoreGain = 2;
          }
        }
        
        return {
          ...p,
          score: p.score + scoreGain,
        };
      });

      return {
        ...prev,
        phase: "reveal",
        players: updatedPlayers,
      };
    });
  }, []);

  const nextRound = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      phase: "lobby",
      round: prev.round + 1,
      chameleonId: null,
      secretWord: null,
      wordGrid: [],
      wordPack: null,
      selectedWordPack: null,
    }));
  }, []);

  const resetGame = useCallback(() => {
    setGameState({
      phase: "lobby",
      players: [],
      hostId: null,
      chameleonId: null,
      secretWord: null,
      wordGrid: [],
      wordPack: null,
      selectedWordPack: null,
      round: 1,
    });
  }, []);

  return {
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
  };
};
