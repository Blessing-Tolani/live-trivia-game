const https = require("https")
const { getPlayersByRoom } = require("./players.js")

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
    this.answer = answer
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

      if (!submissions[`${playerId}`]) {
        submissions[`${playerId}`] = answer
      }
      game.status.isRoundOver =
        Object.keys(submissions).length === getPlayersByRoom(room).length
    }
    const status = game.status
    return { status }
  }
}

const setGame = (callback) => {
  const url = "https://opentdb.com/api.php?amount=1&category=18"
  let data = ""

  const request = https.request(url, (response) => {
    response.on("data", (chunk) => {
      data += chunk.toString()
    })
    response.on("end", () => {
      const { correct_answer, incorrect_answers, question } =
        JSON.parse(data).results[0]
      game.status.submissions = {}
      game.status.correctAnswer = correct_answer
      game.prompt = {
        answers: shuffle([correct_answer, ...incorrect_answers]),
        question,
      }
      return game
    })
  })

  request.on("error", (error) => {
    console.error("An error", error)
  })

  request.end()
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
