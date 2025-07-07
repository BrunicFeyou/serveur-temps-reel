
<script>
import { socket } from '../socket';

export default {
  data() {
    return {
      room: null,
      playerMove: null,
      opponentMove: null,
      waitingForOpponent: false,
      result: null,
    };
  },
  mounted() {
    socket.on('waiting', () => {
      this.waitingForOpponent = true;
    });
    socket.on('start-game', ({ room }) => {
      this.room = room;
      this.waitingForOpponent = false;
      this.result = null;
      this.playerMove = null;
      this.opponentMove = null;
    });
    socket.on('opponent-played', (move) => {
      this.opponentMove = move;
    });
    socket.on('result', ({ p1Move, p2Move, winner }) => {
      this.playerMove = p1Move; 
      this.opponentMove = p2Move;
      if (winner === 'draw') {
        this.result = 'draw';
      } else if (winner === 'player1') {
        this.result = 'win';
      } else {
        this.result = 'lose';
      }
      this.waitingForOpponent = false;
    });
  },
  methods: {
    play(move) {
      if (!this.room) return alert('Waiting for an opponent...');
      this.playerMove = move;
      this.waitingForOpponent = true;
      socket.emit('play', { move, room: this.room });
    }
  }
};
</script>

<template>
  <div>
    <h2>Choose your move:</h2>
    <button @click="play('rock')">🪨 Rock</button>
    <button @click="play('paper')">📄 Paper</button>
    <button @click="play('scissors')">✂️ Scissors</button>

    <p v-if="waitingForOpponent">Waiting for opponent...</p>

    <p v-if="result">
      You played: {{ playerMove }} <br />
      Opponent played: {{ opponentMove }} <br />
      Result: <strong>{{ resultText }}</strong>
    </p>
  </div>
</template>
