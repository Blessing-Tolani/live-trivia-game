const express = require("express")
const path = require("path")
const http = require("http")
const socketio = require("socket.io")
const formatMessage = require("./utils/formatMessage")
const {
  addPlayer,
  removePlayer,
  getPlayersByRoom,
  getPlayer,
  points,
} = require("./utils/players")
const { Game, setGame, getGameAnswerOptions, noOfQuestions } = require("./utils/game")

const app = express()
const port = 8000

const publicDirectoryPath = path.join(__dirname, "../public")
app.use(express.static(publicDirectoryPath))

const server = http.createServer(app)
const io = socketio(server)

io.on("connection", (socket) => {
  console.log("Connection established")

  socket.on("join", ({ playerName, room }, callback) => {
    const { error, newPlayer } = addPlayer({ id: socket.id, playerName, room })

    if (error) return callback(error.message)
    if (newPlayer) {
      socket.join(newPlayer.room)
      socket.emit("message", formatMessage("Admin", "Welcome!"))
      socket.broadcast
        .to(newPlayer.room)
        .emit(
          "message",
          formatMessage("Admin", `${newPlayer.playerName} has joined the game!`)
        )

      io.in(newPlayer.room).emit("room", {
        room: newPlayer.room,
        players: getPlayersByRoom(newPlayer.room),
      })
      io.in(newPlayer.room).emit("showPoints", {
        points,
      })
      io.in(newPlayer.room).emit("questionCount", {noOfQuestions})
    }
  })

  socket.on("disconnect", () => {
    console.log("A player disconnected.")
    const disconnectedPlayer = removePlayer(socket.id)

    if (disconnectedPlayer) {
      const { playerName, room } = disconnectedPlayer
      io.in(room).emit(
        "message",
        formatMessage("Admin", `${playerName} just left the game!`)
      )
      io.in(room).emit("room", {
        room,
        players: getPlayersByRoom(room),
      })
    }
  })

  socket.on("sendMessage", (message, callback) => {
    const { error, player } = getPlayer(socket.id)
    if (error) return callback(error.message)
    if (player) {
      io.to(player.room).emit(
        "message",
        formatMessage(player.playerName, message)
      )
      callback()
    }
  })

  socket.on("getQuestion", async (data, callback) => {
    const { error, player } = getPlayer(socket.id)
    if (error) return callback(error.message)
    if (player) {
      const {noOfQuestions, game} = await setGame()
  
      io.to(player.room).emit("question", {
        playerName: player.playerName,
        ...game.prompt,
      })

      socket.emit("questionCount", {noOfQuestions})
    }

  })

  socket.on("sendAnswer", (answer, callback) => {
    const { error, player } = getPlayer(socket.id)
    if (error) return callback(error.message)
    if (player) {
      const { isRoundOver } = new Game({
        event: "sendAnswer",
        playerId: player.id,
        answer: answer,
        room: player.room,
      }).setGameStatus()
      const answers = getGameAnswerOptions()
      let doesAnswerMatchOptions = false

      for (let i = 0; i < answers.length; i++) {
        if (answers[i].toLocaleLowerCase() == answer.toLocaleLowerCase()) {
          doesAnswerMatchOptions = true
        }
      }

      if (doesAnswerMatchOptions) {
        io.to(player.room).emit("answer", {
          ...formatMessage(player.playerName, answer),
          isRoundOver,
        })
      } else {
        callback("Invalid answer")
      }

      callback()
    }
  })

  socket.on("getAnswer", (callback) => {
    const { error, player } = getPlayer(socket.id)
    if (error) return callback(error.message)
    if (player) {
      const { correctAnswer, submissions } = new Game({
        event: "getAnswer",
        playerId: player.id,
        room: player.room,
      }).getGameStatus()
      io.to(player.room).emit("correctAnswer", correctAnswer)
      const correctAnswersId = []
      for (let key in submissions) {
        if (submissions[key] === correctAnswer) {
          correctAnswersId.push(key)
          console.log(key)
        }
      }

      if (correctAnswersId.length) {
        for (let i = 0; i < correctAnswersId.length; i++) {
          const person = points.find(
            (item) => item.playerId === correctAnswersId[i]
          )
          person.point = person.point + 1
        }
      }

      socket.emit("showPoints", { points })
    }
  })
})

server.listen(port, () => {
  console.log(`Listening to port ${port}`)
})
