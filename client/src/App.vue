<template>
  <div id="app">
    <h1>Rock Paper Scissors - Vue + Socket.IO</h1>
    <Game />
  </div>
</template>

<script>
import Game from './components/Game.vue';

export default {
  components: { Game }
};
</script>
