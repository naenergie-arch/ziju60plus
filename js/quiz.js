document.getElementById("quizForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const data = new FormData(e.target);
  const answers = {};
  for (const [key, value] of data.entries()) {
    answers[key] = parseInt(value, 10);
  }

  localStorage.setItem("ziju60_answers", JSON.stringify(answers));
  window.location.href = "result.html";
});
