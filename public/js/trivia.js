const socket = io()
const urlSearchParams = new URLSearchParams(window.location.search)
const playerName = urlSearchParams.get("playerName")
const room = urlSearchParams.get("room")

const getTime = () => {
  function addZero(i) {
    if (i < 10) {
      i = "0" + i
    }
    return i
  }

  const date = new Date()
  let h = addZero(date.getHours())
  let m = addZero(date.getMinutes())
  let s = addZero(date.getSeconds())
  let time = h + ":" + m + ":" + s
  return time
}

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
    window.location.href = "/"
    alert(error)
  }
})

const messageTemplate = document.querySelector("#message-template").innerHTML
const gameInfo = document.querySelector(".game-info")
const pointInfo = document.querySelector(".point-info")
const questionNo = document.querySelector(".question-no")

socket.on("message", ({ playerName, text, createdAt }) => {
  const chatMessages = document.querySelector(".chat__messages")
  const template = Handlebars.compile(messageTemplate)

  const html = template({ playerName, text, createdAt })

  chatMessages.insertAdjacentHTML("afterBegin", html)
})

socket.on("room", ({ room, players }) => {
  // container the template will be attached

  const sidebarTemplate = document.querySelector(
    "#game-info-template"
  ).innerHTML
  const template = Handlebars.compile(sidebarTemplate)
  gameInfo.insertAdjacentHTML("afterbegin", template({ room, players }))
})

socket.on("showPoints", ({ points }) => {
  const pointBarTemplate = document.querySelector(
    "#point-info-template"
  ).innerHTML

  const pointTemplate = Handlebars.compile(pointBarTemplate)
  pointInfo.innerHTML =  pointTemplate({ points })
})

socket.on("questionCount", ({noOfQuestions}) => {
  const questionNoTemplate = document.querySelector(
    "#question-no-template"
  ).innerHTML

  const  template = Handlebars.compile(questionNoTemplate)
  questionNo.innerHTML =   template({ noOfQuestions })
})

const chatForm = document.querySelector(".chat__form")
chatForm.addEventListener("submit", (event) => {
  event.preventDefault()

  const chatFormInput = chatForm.querySelector(".chat__message")
  const chatFormButton = chatForm.querySelector(".chat__submit-btn")

  chatFormButton.setAttribute("disabled", "disabled")
  const message = event.target.elements.message.value

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

const triviaForm = document.querySelector(".trivia__form")
const triviaFormSubmitButton = triviaForm.querySelector(".trivia__submit-btn")
const triviaAnswers = document.querySelector(".trivia__answers")
const triviaRevealAnswerButton = document.querySelector(".trivia__answer-btn")

socket.on("question", ({ answers, playerName, question }) => {
  const triviaQuestion = document.querySelector(".trivia__question")
  const triviaAnswers = document.querySelector(".trivia__answers")
  const triviaQuestionButton = document.querySelector(".trivia__question-btn")

  const questionTemplate = document.querySelector(
    "#trivia-question-template"
  ).innerHTML

  triviaQuestion.innerHTML = ""
  triviaAnswers.innerHTML = ""
  triviaQuestionButton.setAttribute("disabled", "disabled")
  triviaFormSubmitButton.removeAttribute("disabled")

  const time = getTime()
  const template = Handlebars.compile(questionTemplate)

  const html = template({
    playerName,
    createdAt: new Date().toDateString() + " " + time,
    question: decodeHTMLEntities(question),
    answers,
  })

  triviaQuestion.insertAdjacentHTML("beforeend", html)
})

triviaForm.addEventListener("submit", (event) => {
  event.preventDefault()
  triviaFormSubmitButton.setAttribute("disabled", "disabled")
  const answer = event.target.elements.answer.value

  socket.emit("sendAnswer", answer, (error) => {
    triviaFormSubmitButton.removeAttribute("disabled")
    event.target.elements.answer.value = ""
    if (error) return alert(error)
  })
})

socket.on("answer", ({ playerName, isRoundOver, createdAt, text }) => {
  const template = Handlebars.compile(messageTemplate)
  const html = template({ playerName, text, createdAt })
  triviaAnswers.insertAdjacentHTML("afterBegin", html)
  if (isRoundOver) {
    triviaRevealAnswerButton.removeAttribute("disabled")
  }
})

triviaRevealAnswerButton.addEventListener("click", () => {
  triviaFormSubmitButton.setAttribute("disabled", "disabled")
  socket.emit("getAnswer", (error) => {
    if (error) return alert(error)
  })
})

socket.on("correctAnswer", (text) => {
  const answerTemplate = document.querySelector(
    "#trivia-answer-template"
  ).innerHTML
  const template = Handlebars.compile(answerTemplate)
  const html = template({ text })
  triviaAnswers.insertAdjacentHTML("beforeend", html)
  triviaRevealAnswerButton.setAttribute("disabled", "disabled")
  triviaQuestionButton.removeAttribute("disabled")
})
