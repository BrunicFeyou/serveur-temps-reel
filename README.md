# Pierre 🪨 Feuille 🧻 Ciseaux ✂️ - Jeu en temps réel

Ce projet a été réalisé par Aurore Dimech et Brunic Feyou.

## Description

Ce projet est un jeu multijoueur en ligne de Pierre-Feuille-Ciseaux, réalisé avec Vue.js, Socket.io et Express. Il permet de contre un ami, et comprend la reconnaissance de gestes avec une caméra grâce à un modèle IA Teachable Machine.

Vous pouvez trouver une version déployée en ligne [ici](https://serveur-temps-reel.onrender.com/)

## Installation et lancement du projet

### Prérequis

- Node.js (v16+ recommandé)
- npm

### Etapes

- Cloner le projet (`git clone https://github.com/BrunicFeyou/serveur-temps-reel`)
- Entrer dans le dossier du projet (`cd serveur-temps-reel`)
- Installer les dépendances du frontend (`cd client && npm i`)
- Installer les dépendances du backend (`cd ../server && npm i`)
- Lancer le serveur du backend (`node index.js`)
- Lancer le serveur du frontend (`cd ../client && npm run dev`)
- Ajouter l'URL donnée du serveur du backend dans le `.env` de votre frontend
- Ajouter l'URL donnée du serveur du frontend dans le `.env` de votre backend
- Aller sur l'URL donnée par le serveur du frontend
- Amusez-vous !

## Fonctionnalités
- **Jeu en temps réel** : Affrontez un autre joueur en ligne.
- **Deux modes de jeu** :
  - Jouez avec les boutons (pad)
  - Jouez avec la caméra (reconnaissance IA des gestes)
- **Scores en direct**
- **Interface moderne et responsive**
- **Code de salle à partager**


## Utilisation
- Cliquez sur "Lancez une partie" pour créer une salle et partagez le code avec un ami.
- Rejoignez une partie avec le code fourni.
- Choisissez votre mode de jeu : pad (boutons) ou caméra (IA).
- Jouez et suivez le score en direct !

## Technologies utilisées
- Vue.js 3
- Vite
- Socket.io
- Express
- TensorFlow.js (pour la reconnaissance IA)
