const players = []
const points = []

// add a new player
const addPlayer = ({ id, playerName, room }) => {
  if (!playerName || !room) {
    return {
      error: new Error("Please enter a player name and room!"),
    }
  }

  playerName = playerName.trim()
  room = room.trim()

  const existingPlayer = players.length
    ? players.find(
        (player) => player.playerName.toLowerCase() === playerName.toLowerCase()
      )
    : null
  if (existingPlayer) {
    return {
      error: new Error("Player name is in use"),
    }
  }

  const newPlayer = { id, playerName, room }
  players.push(newPlayer)

  if (!points.find((item) => item.playerName === playerName)) {
    const newPlayerPoint = { playerName, playerId: id, point: 0 }
    points.push(newPlayerPoint)
  }
  return { newPlayer }
}

// get a player by id
const getPlayer = (id) => {
  const player = players.find((player) => player.id === id)
  if (!player) {
    return {
      error: new Error("Player not found!"),
    }
  }

  return { player }
}

// Get all players in a room
const getPlayersByRoom = (room) => {
  const playersByRoom = players.filter((player) => player.room === room)
  return playersByRoom.length
    ? playersByRoom
    : {
        error: new Error("No player in this room!"),
      }
}

//Remove a player by ID
const removePlayer = (id) => {
  players.find((player, index) => {
    if (player.id === id) {
      players.splice(index, 1)
      return { playerName: player.playerName, room: player.room }
    }
  })
  return {
    error: new Error("Player not found!"),
  }
}

module.exports = {
  addPlayer,
  removePlayer,
  getPlayersByRoom,
  getPlayer,
  points,
}
