<template>
  <div class="game">
    <h1>🪨 Rock Paper Scissors ✂️</h1>
    <div v-if="!gameStarted">
      <button @click="createGame">Create Game</button>
      <div class="join-section">
        <input v-model="joinCode" placeholder="Enter Game Code" />
        <button @click="joinGame">Join Game</button>
      </div>
      <p v-if="roomCode">Share this code with your friend: <strong>{{ roomCode }}</strong></p>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
    <div v-else>
      <p>You are playing in room: <strong>{{ roomCode }}</strong></p>
      <div class="scoreboard">
        <span>Your score: <strong>{{ scores.you }}</strong></span>
        <span>Opponent score: <strong>{{ scores.opponent }}</strong></span>
      </div>
      <h2>Choose your move:</h2>
      <button @click="play('rock')">🪨 Rock</button>
      <button @click="play('paper')">📄 Paper</button>
      <button @click="play('scissors')">✂️ Scissors</button>
      <p v-if="opponentMove">Opponent played: {{ opponentMove }}</p>
      <p v-if="roundResult" class="round-result">{{ roundResult }}</p>
    </div>
  </div>
</template>

<script>
import { socket } from '../socket';

export default {
  data() {
    return {
      roomCode: '',
      joinCode: '',
      opponentMove: '',
      gameStarted: false,
      error: '',
      scores: { you: 0, opponent: 0 },
      roundResult: '',
    };
  },
  mounted() {
    socket.on('game-created', (code) => {
      this.roomCode = code;
    });

    socket.on('game-start', ({ roomCode }) => {
      this.roomCode = roomCode;
      this.gameStarted = true;
      this.error = '';
      this.scores = { you: 0, opponent: 0 };
      this.roundResult = '';
      this.opponentMove = '';
    });

    socket.on('opponent-played', (payload) => {
      if (typeof payload === 'object' && payload !== null) {
        this.opponentMove = payload.move;
        this.scores = payload.scores;
        if (payload.winner === 'draw') {
          this.roundResult = "It's a draw!";
        } else if (payload.winner === 'you') {
          this.roundResult = 'You win this round!';
        } else {
          this.roundResult = 'Opponent wins this round!';
        }
      } else {
        // fallback for old server
        this.opponentMove = payload;
      }
    });

    socket.on('error-message', (msg) => {
      this.error = msg;
    });
  },
  methods: {
    createGame() {
      this.error = '';
      socket.emit('create-game');
    },
    joinGame() {
      if (!this.joinCode.trim()) {
        this.error = 'Please enter a valid game code';
        return;
      }
      socket.emit('join-game', this.joinCode.trim());
    },
    play(move) {
      if (!this.roomCode) return;
      socket.emit('play', { roomCode: this.roomCode, move });
    }
  }
};
</script>

<style scoped>
.game {
  max-width: 500px;
  margin: auto;
  text-align: center;
  font-family: Arial, sans-serif;
}

button {
  margin: 5px;
  padding: 10px 20px;
  font-size: 16px;
}

input {
  padding: 8px;
  font-size: 14px;
  margin-right: 10px;
}

.join-section {
  margin-top: 20px;
}

.error {
  color: red;
  margin-top: 10px;
}

.scoreboard {
  display: flex;
  justify-content: space-around;
  margin-bottom: 10px;
}

.round-result {
  font-weight: bold;
  margin-top: 10px;
}
</style>
