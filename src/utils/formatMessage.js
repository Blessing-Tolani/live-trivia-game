const {format} = require('date-fns')

const formatMessage = (playerName, text) => {
  return {
    playerName,
    text,
    createdAt: format(new Date(), 'hh:mm a'),
  }
}

module.exports = formatMessage
