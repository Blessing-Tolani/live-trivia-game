const socket = io()
// const moment = require("moment")

const urlSearchParams = new URLSearchParams(window.location.search)
const playerName = urlSearchParams.get("playerName")

const room = urlSearchParams.get("room")

const mainHeadingTemplate = document.querySelector(
  "#main-heading-template"
).innerHTML

const welcomeHeadingHTML = Handlebars.compile(mainHeadingTemplate)

document.querySelector("main").insertAdjacentHTML(
  "afterBegin",
  welcomeHeadingHTML({
    playerName,
  })
)

socket.emit("join", { playerName, room }, (error) => {
  if (error) {
    alert(error)
    location.href("/")
  }
})

// socket.emit("disconnect", { playerName: "Blessing", room: "10" })

socket.on("message", ({ playerName, text, createdAt }) => {
  const chatMessages = document.querySelector(".chat__messages")
  const messageTemplate = document.querySelector("#message-template").innerHTML
  const template = Handlebars.compile(messageTemplate)

  const html = template({ playerName, text, createdAt })

  chatMessages.insertAdjacentHTML("afterBegin", html)
})

socket.on("room", ({ room, players }) => {
  // container the template will be attached
  const gameInfo = document.querySelector(".game-info")

  const sidebarTemplate = document.querySelector(
    "#game-info-template"
  ).innerHTML

  const template = Handlebars.compile(sidebarTemplate)

  gameInfo.innerHTML = template({ room, players })
})

const chatForm = document.querySelector(".chat__form")
chatForm.addEventListener("submit", (event) => {
  event.preventDefault()

  const chatFormInput = chatForm.querySelector(".chat__message")
  const chatFormButton = chatForm.querySelector(".chat__submit-btn")

  console.log("hey")
  chatFormButton.setAttribute("disabled", "disabled")
  const element = event.target.elements
  const message = event.target.elements.message.value

  console.log(element)
  console.log(message)

  socket.emit("sendMessage", message, (error) => {
    chatFormButton.removeAttribute("disabled")
    chatFormInput.value = ""
    chatFormInput.focus()

    if (error) return alert(error)
  })
})

const triviaQuestionButton = document.querySelector(".trivia__question-btn")
triviaQuestionButton.addEventListener("click", () => {
  socket.emit("getQuestion", null, (error) => {
    if (error) return alert(error)
  })
})

const decodeHTMLEntities = (text) => {
  const textArea = document.createElement("textarea")
  textArea.innerHTML = text
  return textArea.value
}

socket.on("question", ({ answers, playerName, question }) => {
  const triviaForm = document.querySelector(".trivia__form")
  const triviaQuestion = document.querySelector(".trivia__question")
  const triviaAnswers = document.querySelector(".trivia__answers")
  const triviaQuestionButton = document.querySelector(".trivia__question-btn")
  const triviaFormSubmitButton = triviaForm.querySelector(".trivia__submit-btn")

  const questionTemplate = document.querySelector(
    "#trivia-question-template"
  ).innerHTML

  triviaQuestion.innerHTML = ""
  triviaAnswers.innerHTML = ""

  triviaQuestionButton.setAttribute("disabled", "disabled")

  triviaFormSubmitButton.removeAttribute("disabled")

  const template = Handlebars.compile(questionTemplate)
  const html = template({
    playerName,
    createdAt: new Date().toDateString(),
    question: decodeHTMLEntities(question),
    answers,
  })

  triviaQuestion.insertAdjacentHTML("beforeend", html)
})
