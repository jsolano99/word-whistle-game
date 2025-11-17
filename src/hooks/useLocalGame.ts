import { useState, useCallback, useEffect } from "react";

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

interface CustomWordPack {
  name: string;
  words: string[];
  isSaved?: boolean;
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

const CUSTOM_PACKS_KEY = "drewmeleon_custom_packs";
const GAME_STATE_KEY = "drewmeleon_game_state";

// Load custom packs from localStorage
const loadCustomPacks = (): CustomWordPack[] => {
  try {
    const stored = localStorage.getItem(CUSTOM_PACKS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save custom packs to localStorage
const saveCustomPacks = (packs: CustomWordPack[]) => {
  localStorage.setItem(CUSTOM_PACKS_KEY, JSON.stringify(packs));
};

// Load game state from localStorage
const loadGameState = (): GameState | null => {
  try {
    const stored = localStorage.getItem(GAME_STATE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// Save game state to localStorage
const saveGameState = (state: GameState) => {
  localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
};

export const getWordPackNames = (customPacks: CustomWordPack[] = []) => {
  const defaultPacks = Object.keys(WORD_PACKS);
  const customPackNames = customPacks.map((p) => p.name);
  return [...defaultPacks, ...customPackNames];
};

export const getAllWordPacks = (customPacks: CustomWordPack[] = []) => {
  const allPacks: { [key: string]: string[] } = { ...WORD_PACKS };
  customPacks.forEach((pack) => {
    allPacks[pack.name] = pack.words;
  });
  return allPacks;
};

export const useLocalGame = () => {
  const [customPacks, setCustomPacks] = useState<CustomWordPack[]>(loadCustomPacks());
  const savedGameState = loadGameState();
  const [gameState, setGameState] = useState<GameState>(savedGameState || {
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

  // Save custom packs whenever they change
  useEffect(() => {
    saveCustomPacks(customPacks);
  }, [customPacks]);

  // Save game state whenever it changes
  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

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
      
      // Get selected word pack from all packs
      const allPacks = getAllWordPacks(customPacks);
      const words = allPacks[prev.selectedWordPack];
      if (!words || words.length === 0) return prev;
      
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
  }, [customPacks]);

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

      // Award points based on new scoring rules
      const updatedPlayers = prev.players.map((p) => {
        let scoreGain = 0;
        
        // If chameleon was caught (most voted)
        if (mostVotedId === prev.chameleonId) {
          // Players who correctly identified the Drewmeleon get 1 point each
          if (p.id !== prev.chameleonId && p.vote === prev.chameleonId) {
            scoreGain = 1;
          }
          // Note: Drewmeleon guessing the word correctly would be implemented in a separate phase
          // For now, this handles the voting outcome only
        } else {
          // Drewmeleon successfully blended in, gets 2 points
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

  const resetScores = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      phase: "lobby",
      round: 1,
      chameleonId: null,
      secretWord: null,
      wordGrid: [],
      wordPack: null,
      selectedWordPack: null,
      players: prev.players.map((p) => ({
        ...p,
        score: 0,
        clue: undefined,
        vote: undefined,
      })),
    }));
  }, []);

  const resetGame = useCallback(() => {
    // Remove unsaved custom packs
    setCustomPacks((prev) => prev.filter((p) => p.isSaved));
    
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
    localStorage.removeItem(GAME_STATE_KEY);
  }, []);

  // Custom pack management
  const addCustomPack = useCallback((name: string, words: string[], isSaved = false) => {
    setCustomPacks((prev) => {
      // Check if pack name already exists
      if (prev.some((p) => p.name === name)) {
        return prev;
      }
      return [...prev, { name, words, isSaved }];
    });
  }, []);

  const saveCustomPack = useCallback((name: string) => {
    setCustomPacks((prev) => 
      prev.map((p) => p.name === name ? { ...p, isSaved: true } : p)
    );
  }, []);

  const deleteCustomPack = useCallback((name: string) => {
    setCustomPacks((prev) => prev.filter((p) => p.name !== name));
    // If deleted pack was selected, clear selection
    setGameState((prev) => 
      prev.selectedWordPack === name ? { ...prev, selectedWordPack: null } : prev
    );
  }, []);

  const bulkDeleteCustomPacks = useCallback((names: string[]) => {
    setCustomPacks((prev) => prev.filter((p) => !names.includes(p.name)));
    // If any deleted pack was selected, clear selection
    setGameState((prev) => 
      names.includes(prev.selectedWordPack || "") ? { ...prev, selectedWordPack: null } : prev
    );
  }, []);

  const isCustomPack = useCallback((packName: string) => {
    return customPacks.some((p) => p.name === packName);
  }, [customPacks]);

  return {
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
    resetScores,
    resetGame,
    addCustomPack,
    saveCustomPack,
    deleteCustomPack,
    bulkDeleteCustomPacks,
    isCustomPack,
  };
};
