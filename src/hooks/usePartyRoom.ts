import { useEffect, useState, useCallback } from "react";
import PartySocket from "partysocket";

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
  isChameleon?: boolean;
  isHost?: boolean;
  playerId?: string;
}

const PARTYKIT_HOST = import.meta.env.VITE_PARTYKIT_HOST || "localhost:1999";

export const usePartyRoom = (roomCode: string) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [socket, setSocket] = useState<PartySocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!roomCode) return;

    const ws = new PartySocket({
      host: PARTYKIT_HOST,
      room: roomCode,
    });

    ws.addEventListener("open", () => {
      console.log("Connected to room:", roomCode);
      setConnected(true);
    });

    ws.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      console.log("Received:", data);

      if (data.type === "init" || data.type === "update") {
        setGameState(data.state);
      }
    });

    ws.addEventListener("close", () => {
      console.log("Disconnected from room");
      setConnected(false);
    });

    ws.addEventListener("error", (error) => {
      console.error("WebSocket error:", error);
    });

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [roomCode]);

  const send = useCallback(
    (data: any) => {
      if (socket && connected) {
        socket.send(JSON.stringify(data));
      }
    },
    [socket, connected]
  );

  const joinGame = useCallback(
    (name: string) => {
      send({ type: "join", name });
    },
    [send]
  );

  const startRound = useCallback(() => {
    send({ type: "startRound" });
  }, [send]);

  const submitClue = useCallback(
    (clue: string) => {
      send({ type: "submitClue", clue });
    },
    [send]
  );

  const goVote = useCallback(() => {
    send({ type: "goVote" });
  }, [send]);

  const submitVote = useCallback(
    (votedPlayerId: string) => {
      send({ type: "submitVote", votedPlayerId });
    },
    [send]
  );

  const reveal = useCallback(() => {
    send({ type: "reveal" });
  }, [send]);

  const nextRound = useCallback(() => {
    send({ type: "nextRound" });
  }, [send]);

  return {
    gameState,
    connected,
    joinGame,
    startRound,
    submitClue,
    goVote,
    submitVote,
    reveal,
    nextRound,
  };
};
