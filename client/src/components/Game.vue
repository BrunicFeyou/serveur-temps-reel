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
      <!-- <h2>Choisi ton action</h2> -->
      <div class="actions">
        <button class="button_action" @click="play('rock')">🪨 Pierre</button>
        <button class="button_action" @click="play('paper')">📄 Feuille</button>
        <button class="button_action" @click="play('scissors')">✂️ Ciseaux</button>
      </div>
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

</style>
