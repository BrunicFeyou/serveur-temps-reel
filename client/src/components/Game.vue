<template>
  <div class="game">
    <div class="start-component" v-if="!gameStarted">
      <h2>Bienvenue dans ce jeu interactif !</h2>
      <h6>Réaliser en Vue + WebSocket.io</h6>
      <div class="join-section">
        <input v-model="joinCode" placeholder="Enter Game Code" />
        <button class="btn-join" @click="joinGame">Rejoindre la partie</button>
      </div>
      <button class="btn-start" @click="createGame">Lancez une partie</button>
      <p v-if="roomCode">Partagez ce code avec un ami: <strong>{{ roomCode }}</strong></p>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
    <div class="party-section" v-else>
      <div class="scoreboard">
        <div  class="score">
          <span>Votre score <strong class="all score1">{{ scores.you }}</strong></span>
          <div class="profil-score"></div>
        </div>
        <div class="score">
          <span>Score adverse <strong class="all score2">{{ scores.opponent }}</strong></span>
          <div class="profil-score"></div>
        </div>
      </div>

      <h3 class="replayMessage">{{replayMessage}}</h3>
      <div class="actions">
        <button class="button_action" @click="play('rock')">🪨 Pierre</button>
        <button class="button_action" @click="play('paper')">📄 Feuille</button>
        <button class="button_action" @click="play('scissors')">✂️ Ciseaux</button>
      </div>
      <button @click="startCamera">📷 Jouer avec la caméra</button>
      <div v-if="showCamera" class="camera-section">
        <video ref="video" autoplay playsinline width="224" height="224"></video>
        <button @click="predictMove">Enregistrer</button>
        <button @click="stopCamera">Fermer la caméra</button>
        <p v-if="predictedMove">Ton coup sera {{ predictedMove }}</p>
        <button v-if="predictedMove" @click="validatePredictedMove">Validé</button>
      </div>
      <canvas ref="canvas" width="224" height="224" style="display:none;"></canvas>
      <p v-if="playerMove">Tu as joué {{ playerMove }}</p>
      <p v-if="opponentMove">Le joueur adverse a joué {{ opponentMove }}</p>

      <p v-if="roundResult" class="round-result">{{ roundResult }}</p>
      <div class="header">
        <p class="number_room">Vous êtes entrain de jouer dans la salle <strong class="number">{{ roomCode }}</strong></p>
      </div>
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
      replayMessage: '',
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
      this.replayMessage = 'La partie a commencé ! Faites votre choix.';
      this.playerMove = '';
    });
    socket.on('opponent-played', (payload) => {
      if (typeof payload === 'object' && payload !== null) {
        this.replayMessage = '';
        this.opponentMove = payload.move;
        this.scores = payload.scores;
        if (payload.winner === 'draw') {
          this.roundResult = "Égalité !";
        } else if (payload.winner === 'you') {
          this.roundResult = 'Vous gagnez cette manche !';
        } else {
          this.roundResult = 'Votre adversaire gagne cette manche !';
        }
        setTimeout(() => {
          this.opponentMove = '';
          this.roundResult = '';
          this.replayMessage = 'Faites votre choix pour la prochaine manche !';
        }, 3000); 
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
  /* max-width: 500px; */
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
  color: #ED4524; ;
}

.btn-start {
  color: rgba(247, 87, 87, 0.914);
  border: none;
  text-align: center;
  text-decoration: none;
  /* border: 1px solid rgba(0, 0, 0, 0.36); */
  font-size: 16px;
  margin-top: 10px;
  cursor: pointer;
  margin-top: 32px;
}

.btn-start:hover {
  background-color: rgba(247, 87, 87, 0.914);
  color: white;
  border:none;
}

.btn-join {
  color: green;
  border: none;
  text-align: center;
  text-decoration: none;
  font-size: 16px;
  margin-top: 10px;
  cursor: pointer;
}

.btn-join:hover {
  background-color: green;
  color: white;
  border:none;
}

.start-component{
  background: #b8b8b838;
  box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px; 
  border-radius: 10px;
  padding: 2rem;
}

.party-section {
  background: #b8b8b838;
  border-radius: 10px;
  box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px; 
  padding: 2rem;
  display: flex;
  flex-direction: column; 
}

.actions{
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}
.header {
  margin-bottom: 20px;
}

.number{
  color: #ED4524;
}
.number_room {
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 1rem;
}

.all {
  color: #ED4524; 
}

.score{
  display: flex;
  align-items: center; 
  gap: 10px;
  justify-items: center;
}
.profil-score{
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #ED4524;
  /* margin-top: 10px; */
}
.replayMessage {
  width: 100%;
}
.button_action {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  /* color: white; */
  border: none;
  border-radius: 5px;

}
.button_action:hover {
   background-color: #ED4524;
  color: white;
}

.camera-section {
  margin: 10px 0;
}
</style>
