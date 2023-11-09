const { getPlayersByRoom } = require("./players.js")
const fetch = require('node-fetch');

const game = {
  prompt: {
    answers: "",
    question: "",
    createdAt: "",
  },
  status: {
    submissions: {},
    correctAnswer: "",
    isRoundOver: false,
  },
}

class Game {
  constructor({ event, playerId, answer, room }) {
    this.event = event
    this.playerId = playerId
    if(answer){
      this.answer = answer
    }
    this.room = room
  }

  getGameStatus() {
    const { correctAnswer, isRoundOver } = game.status

    if (this.event === "getAnswer" && isRoundOver) {
      return { correctAnswer }
    }
  }

  setGameStatus() {
    if (this.event === "sendAnswer") {
      const { submissions } = game.status

      if (!submissions[`${this.playerId}`]) {
        submissions[`${this.playerId}`] = this.answer
      }
      game.status.isRoundOver =
        Object.keys(submissions).length === getPlayersByRoom(this.room).length
    }
    const status = game.status
    return status;
  }
}

const setGame = async () => {
  try {
    const response = await fetch("https://opentdb.com/api.php?amount=1&category=18")
    const data = await response.json();
    const {
      correct_answer,
      incorrect_answers,
      question,
    } = data.results[0];
    game.status.submissions = {}
    game.status.correctAnswer = correct_answer
       game.prompt = {
        answers: shuffle([correct_answer, ...incorrect_answers]),
        question,
      };
      return game;
  }
  catch (error) {
    console.log(error);
  }
}

// Shuffles an array.
const shuffle = (array) => {
  for (let end = array.length - 1; end > 0; end--) {
    let random = Math.floor(Math.random() * (end + 1))
    ;[array[end], array[random]] = [array[random], array[end]]
  }
  return array
}

module.exports = {
  Game,
  setGame,
}
