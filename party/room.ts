import type * as Party from "partykit/server";

// Word packs for the game
const WORD_PACKS = [
  {
    name: "Animals",
    words: [
      "Lion", "Tiger", "Bear", "Wolf", "Fox", "Deer", "Rabbit", "Squirrel",
      "Elephant", "Giraffe", "Zebra", "Monkey", "Panda", "Koala", "Kangaroo", "Penguin"
    ]
  },
  {
    name: "Food",
    words: [
      "Pizza", "Burger", "Pasta", "Sushi", "Tacos", "Salad", "Soup", "Sandwich",
      "Ice Cream", "Cake", "Cookie", "Donut", "Waffle", "Pancake", "Muffin", "Brownie"
    ]
  },
  {
    name: "Sports",
    words: [
      "Soccer", "Basketball", "Tennis", "Baseball", "Football", "Hockey", "Golf", "Swimming",
      "Running", "Cycling", "Skiing", "Surfing", "Boxing", "Wrestling", "Volleyball", "Cricket"
    ]
  },
  {
    name: "Cities",
    words: [
      "Paris", "London", "Tokyo", "New York", "Rome", "Sydney", "Dubai", "Barcelona",
      "Amsterdam", "Berlin", "Vienna", "Prague", "Bangkok", "Istanbul", "Cairo", "Mumbai"
    ]
  }
];

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  clue?: string;
  vote?: string;
  score: number;
}

interface GameState {
  phase: "lobby" | "clue" | "vote" | "reveal";
  players: Player[];
  hostId: string | null;
  chameleonId: string | null;
  secretWord: string | null;
  wordGrid: string[];
  wordPack: string | null;
  cluesSubmitted: number;
  votesSubmitted: number;
  round: number;
}

export default class RoomServer implements Party.Server {
  gameState: GameState;

  constructor(public room: Party.Room) {
    this.gameState = {
      phase: "lobby",
      players: [],
      hostId: null,
      chameleonId: null,
      secretWord: null,
      wordGrid: [],
      wordPack: null,
      cluesSubmitted: 0,
      votesSubmitted: 0,
      round: 0
    };
  }

  onConnect(connection: Party.Connection) {
    console.log(`Player ${connection.id} connected`);
    
    // Send initial state to the new connection
    this.sendToConnection(connection, {
      type: "init",
      state: this.getStateForPlayer(connection.id)
    });
  }

  onMessage(message: string, sender: Party.Connection) {
    const data = JSON.parse(message);
    console.log(`Received message from ${sender.id}:`, data);

    switch (data.type) {
      case "join":
        this.handleJoin(sender.id, data.name);
        break;
      case "startRound":
        this.handleStartRound();
        break;
      case "submitClue":
        this.handleSubmitClue(sender.id, data.clue);
        break;
      case "goVote":
        this.handleGoVote();
        break;
      case "submitVote":
        this.handleSubmitVote(sender.id, data.votedPlayerId);
        break;
      case "reveal":
        this.handleReveal();
        break;
      case "nextRound":
        this.handleNextRound();
        break;
    }
  }

  handleJoin(playerId: string, name: string) {
    // Check if player already exists
    const existingPlayer = this.gameState.players.find(p => p.id === playerId);
    if (existingPlayer) {
      existingPlayer.name = name;
    } else {
      // First player becomes host
      const isHost = this.gameState.players.length === 0;
      if (isHost) {
        this.gameState.hostId = playerId;
      }

      this.gameState.players.push({
        id: playerId,
        name,
        isHost,
        score: 0
      });
    }

    this.broadcast();
  }

  handleStartRound() {
    if (this.gameState.players.length < 3) {
      return; // Need at least 3 players
    }

    // Pick random word pack
    const pack = WORD_PACKS[Math.floor(Math.random() * WORD_PACKS.length)];
    this.gameState.wordPack = pack.name;
    this.gameState.wordGrid = [...pack.words];

    // Pick random secret word from the grid
    const secretIndex = Math.floor(Math.random() * pack.words.length);
    this.gameState.secretWord = pack.words[secretIndex];

    // Pick random chameleon
    const chameleonIndex = Math.floor(Math.random() * this.gameState.players.length);
    this.gameState.chameleonId = this.gameState.players[chameleonIndex].id;

    // Reset clues and votes
    this.gameState.players.forEach(p => {
      delete p.clue;
      delete p.vote;
    });
    this.gameState.cluesSubmitted = 0;
    this.gameState.votesSubmitted = 0;

    this.gameState.phase = "clue";
    this.gameState.round++;

    this.broadcast();
  }

  handleSubmitClue(playerId: string, clue: string) {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (player && !player.clue) {
      player.clue = clue;
      this.gameState.cluesSubmitted++;
      
      // Auto-advance when all clues submitted
      if (this.gameState.cluesSubmitted === this.gameState.players.length) {
        this.gameState.phase = "vote";
      }

      this.broadcast();
    }
  }

  handleGoVote() {
    this.gameState.phase = "vote";
    this.broadcast();
  }

  handleSubmitVote(playerId: string, votedPlayerId: string) {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (player && !player.vote) {
      player.vote = votedPlayerId;
      this.gameState.votesSubmitted++;

      // Auto-advance when all votes submitted
      if (this.gameState.votesSubmitted === this.gameState.players.length) {
        this.gameState.phase = "reveal";
      }

      this.broadcast();
    }
  }

  handleReveal() {
    // Calculate scores
    const voteCounts: Record<string, number> = {};
    this.gameState.players.forEach(player => {
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
    if (mostVotedId === this.gameState.chameleonId) {
      // Players caught the chameleon
      this.gameState.players.forEach(player => {
        if (player.id !== this.gameState.chameleonId) {
          player.score += 1;
        }
      });
    } else {
      // Chameleon won
      const chameleon = this.gameState.players.find(p => p.id === this.gameState.chameleonId);
      if (chameleon) {
        chameleon.score += 2;
      }
    }

    this.gameState.phase = "reveal";
    this.broadcast();
  }

  handleNextRound() {
    this.handleStartRound();
  }

  getStateForPlayer(playerId: string) {
    const isChameleon = playerId === this.gameState.chameleonId;
    
    return {
      ...this.gameState,
      // Hide secret word from chameleon
      secretWord: isChameleon ? null : this.gameState.secretWord,
      // Add client-specific info
      isChameleon,
      isHost: playerId === this.gameState.hostId,
      playerId
    };
  }

  sendToConnection(connection: Party.Connection, data: any) {
    connection.send(JSON.stringify(data));
  }

  broadcast() {
    // Send personalized state to each player
    this.room.getConnections().forEach(connection => {
      this.sendToConnection(connection, {
        type: "update",
        state: this.getStateForPlayer(connection.id)
      });
    });
  }

  onClose(connection: Party.Connection) {
    console.log(`Player ${connection.id} disconnected`);
    
    // Remove player
    this.gameState.players = this.gameState.players.filter(p => p.id !== connection.id);
    
    // If host left, assign new host
    if (connection.id === this.gameState.hostId && this.gameState.players.length > 0) {
      this.gameState.hostId = this.gameState.players[0].id;
      this.gameState.players[0].isHost = true;
    }

    this.broadcast();
  }
}
