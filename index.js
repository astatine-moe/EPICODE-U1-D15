let score = 0,
    amountOfQuestions = 5,
    difficulty = "easy",
    answerSelected = false,
    userQuestions = [],
    questionNumber = 0;

const loader = document.querySelector("#loader");
const startQuizHolder = document.querySelector("#start-quiz-holder");
const questionTitle = document.querySelector(".quiz-card__question");
const nextButton = document.querySelector("#next-btn");
const modal = document.querySelector(".score-modal");
const closeModal = document.querySelector("#close-modal");
const resetButton = document.querySelector("#reset-quiz");

const shuffle = (array) => {
    //https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
    let currentIndex = array.length,
        temporaryValue,
        randomIndex;

    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
};

const setProgress = () => {
    const progress = document.querySelector(".progress");
    const progressText = document.querySelector("#complete");
    const percent = (questionNumber / amountOfQuestions) * 100;

    progress.setAttribute("value", percent);
    progressText.innerText = `${percent}%`;
};

const disabledOptions = () => {
    const options = document.querySelectorAll(".option");

    options.forEach((option) => {
        option.classList.add("disabled");
    });
};

const clickChoice = (e, question) => {
    //when user clicks on an option
    if (!answerSelected) {
        disabledOptions();
        answerSelected = true;

        const optionIndex = e.target.getAttribute("data-option-index");

        e.target.classList.add("selected");

        //loop through options and add correct class to correct answer
        const options = document.querySelectorAll(".option");

        options.forEach((option) => {
            if (
                question.options[option.getAttribute("data-option-index")] ==
                question.correct_answer
            ) {
                option.classList.add("correct");
            } else {
                option.classList.add("incorrect");
            }
        });

        if (question.options[optionIndex] == question.correct_answer) {
            score++;
        }

        //unlock next button
        nextButton.removeAttribute("disabled");

        questionNumber++;
    }
};

const loadOptions = (question, trueFalse = false) => {
    let container;
    if (trueFalse) {
        document.querySelector(".multi").classList.add("hidden");
        container = document.querySelector(".true-false");
    } else {
        document.querySelector(".true-false").classList.add("hidden");
        container = document.querySelector(".multi");
    }

    container.classList.remove("hidden");

    container.innerHTML = "";

    for (let i = 0; i < question.options.length; i++) {
        const option = document.createElement("div");
        option.classList.add("option");
        option.setAttribute("data-option-index", i);
        option.innerHTML = question.options[i];

        option.addEventListener("click", function (e) {
            clickChoice(e, question);
        });

        container.appendChild(option);
    }
};

//Fetch quesstions using fetch api
const fetchQuestions = async (amount, difficulty) => {
    const response = await fetch(
        `https://opentdb.com/api.php?amount=${amount}&category=18&difficulty=${difficulty}`
    );
    const data = await response.json();
    return data.results;
};

//fade out function for loader
const fadeOut = (element, time = 10) => {
    return new Promise((resolve, reject) => {
        // Get the opacity of the element
        let opacity = 1;

        // Set the interval timer to 50ms
        let timer = setInterval(function () {
            if (opacity <= 0.1) {
                clearInterval(timer);
                element.style.display = "none";
                resolve();
            }

            element.style.opacity = opacity;
            element.style.filter = "alpha(opacity=" + opacity * 100 + ")";
            opacity -= opacity * 0.1;
        }, time);
    });
};

const resetQuiz = () => {
    //reset quiz
    let hideEles = [".multi", ".true-false"];

    hideEles.forEach((ele) => {
        document.querySelector(ele).classList.add("hidden");
    });
    startQuizHolder.style.display = "block";
    startQuizHolder.style.opacity = 1;

    userQuestions = [];
    questionNumber = 0;
    questionTitle.innerHTML = "";
    setProgress();
};

/*
    Question amount handler
*/
const amountRange = document.getElementById("amount"),
    amountLabel = document.getElementById("amount-label");
amountRange.addEventListener("input", function (e) {
    amountOfQuestions = this.value;
    amountLabel.innerText = amountOfQuestions;
});

/*
    Difficulty handler
*/
const difficultySelect = document.getElementById("difficulty");
difficultySelect.addEventListener("change", function (e) {
    difficulty = this.value;
});

//when the user clicks the next button
nextButton.addEventListener("click", async () => {
    if (answerSelected) {
        answerSelected = false;
        nextButton.setAttribute("disabled", true);
        nextQuestion();
    } else return; //if no answer selected, do nothing
});

const nextQuestion = async () => {
    setProgress();
    if (questionNumber < amountOfQuestions) {
        const question = userQuestions[questionNumber];

        questionTitle.innerHTML = question.question;

        loadOptions(question, question.type == "boolean");
    } else {
        //end of quiz, show score in modal, and reset quiz
        resetQuiz();

        const percent = (score / amountOfQuestions) * 100;

        modal.style.display = "flex";
        const scoreText = `${score} / ${amountOfQuestions} (${Math.round(
            percent
        )}%)`;

        const scoreContainer = document.querySelector("#score");

        scoreContainer.classList.remove("good", "bad", "okay");
        if (percent >= 70) {
            scoreContainer.classList.add("good");
        } else if (percent >= 50) {
            scoreContainer.classList.add("okay");
        } else {
            scoreContainer.classList.add("bad");
        }

        document.querySelector("#score").innerText = scoreText;

        score = 0;
    }
};

const startButton = document.getElementById("start-quiz");
startButton.addEventListener("click", async () => {
    await fadeOut(startQuizHolder);
    loader.style.display = "block";

    fetchQuestions(amountOfQuestions, difficulty).then(async (questions) => {
        await fadeOut(loader);

        for (let i = 0; i < questions.length; i++) {
            questions[i].options = [
                ...questions[i].incorrect_answers,
                questions[i].correct_answer,
            ];
            if (questions[i].type == "boolean") {
                questions[i].options = ["True", "False"];
            } else {
                questions[i].options = shuffle(questions[i].options);
            }
        }

        userQuestions = questions;

        nextQuestion();
    });
});

//modal handler
closeModal.addEventListener("click", () => {
    modal.style.display = "none";
});

resetButton.addEventListener("click", resetQuiz);
