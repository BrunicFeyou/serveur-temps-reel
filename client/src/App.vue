<template>
  <div id="app">
    <h1>Pierre 🪨 Feuille 🧻 Ciseaux ✂️ </h1>
    
    <Game />
  </div>
</template>

<script>
import Game from './components/Game.vue';

export default {
  components: { Game },
  mounted() {
    document.title = 'Pierre Feuille Ciseaux - Jeu en ligne';
  }
};
</script>
