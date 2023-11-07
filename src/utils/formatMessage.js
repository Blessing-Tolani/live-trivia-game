const formatMessage = (playerName, text) => {
  return {
    playerName,
    text,
    createdAt: new Date().getTime(),
  }
}

module.exports = formatMessage
