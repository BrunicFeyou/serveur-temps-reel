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
      <button @click="startCamera">📷 Play with Camera</button>
      <div v-if="showCamera" class="camera-section">
        <video ref="video" autoplay playsinline width="224" height="224"></video>
        <button @click="predictMove">Predict Move</button>
        <button @click="stopCamera">Close Camera</button>
        <p v-if="predictedMove">Predicted: {{ predictedMove }}</p>
        <button v-if="predictedMove" @click="validatePredictedMove">Validate</button>
      </div>
      <canvas ref="canvas" width="224" height="224" style="display:none;"></canvas>
      <p v-if="playerMove">You played: {{ playerMove }}</p>
      <p v-if="opponentMove">Opponent played: {{ opponentMove }}</p>
      <p v-if="roundResult" class="round-result">{{ roundResult }}</p>
    </div>
  </div>
</template>

<script>
import { socket } from '../socket';
let model = null;

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
      showCamera: false,
      predictedMove: '',
      playerMove: '',
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
      this.playerMove = '';
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
      this.playerMove = move;
      socket.emit('play', { roomCode: this.roomCode, move });
    },
    async startCamera() {
      this.showCamera = true;
      this.predictedMove = '';
      if (!model) {
        // Lazy-load tfjs and the model
        const tf = await import('@tensorflow/tfjs');
        model = await tf.loadLayersModel('/model/model.json');
      }
      await this.$nextTick();
      const video = this.$refs.video;
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: { width: 224, height: 224 } });
        video.srcObject = this.stream;
      }
    },
    stopCamera() {
      this.showCamera = false;
      this.predictedMove = '';
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
    },
    async predictMove() {
      const tf = await import('@tensorflow/tfjs');
      const video = this.$refs.video;
      const canvas = this.$refs.canvas;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, 224, 224);
      const imageData = ctx.getImageData(0, 0, 224, 224);
      let input = tf.browser.fromPixels(imageData).expandDims(0).toFloat().div(255);
      const prediction = await model.predict(input).data();
      const classes = ['rock', 'paper', 'scissors'];
      const maxIdx = prediction.indexOf(Math.max(...prediction));
      const move = classes[maxIdx];
      this.predictedMove = move;
      // Do not send the move yet, wait for user to validate
    },
    validatePredictedMove() {
      if (this.predictedMove) {
        this.play(this.predictedMove); // play() will set playerMove
        this.stopCamera();
        this.predictedMove = '';
      }
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

.camera-section {
  margin: 10px 0;
}
</style>
