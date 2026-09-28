const { confirm } = window.__TAURI__.dialog;

let quizData = [];

let currentQuestion = 0;
let correctAnswers = 0;
let wrongAnswers = [];


// Elementos HTML

const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");

const quizTitle = document.getElementById("quiz-title");

const questionNumber = document.getElementById("question-number");
const score = document.getElementById("score");

const questionElement = document.getElementById("question");
const optionsElement = document.getElementById("options");

const startButton = document.getElementById("start-btn");
const nextButton = document.getElementById("next-btn");
const finishButton = document.getElementById("finish-btn");

const restartButton = document.getElementById("restart-btn");

// Cargar JSON

async function loadQuiz() {

    try {

        const response = await fetch("quiz.json");

        if (!response.ok) {
            throw new Error("No se pudo cargar quiz.json");
        }

        const data = await response.json();

        quizTitle.textContent = data[0].Title;

        quizData = data[1];

    } catch (error) {

        console.error(error);

        alert("No se pudo cargar el archivo quiz.json");

    }
}


// Mezclar un array

function shuffle(array) {

    const newArray = [...array];

    for (let i = newArray.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [newArray[i], newArray[j]] =
        [newArray[j], newArray[i]];

    }

    return newArray;
}


// Empezar quiz

startButton.addEventListener("click", startQuiz);


function startQuiz() {

    currentQuestion = 0;

    correctAnswers = 0;

    wrongAnswers = [];

    // Mezclar preguntas
    quizData = shuffle(quizData);

    startScreen.classList.add("hidden");

    resultScreen.classList.add("hidden");

    quizScreen.classList.remove("hidden");

    showQuestion();
}


// Mostrar pregunta

function showQuestion() {

    const questionData = quizData[currentQuestion];

    questionNumber.textContent =
        `Pregunta ${currentQuestion + 1} de ${quizData.length}`;

    score.textContent =
        `Correctas: ${correctAnswers}`;

    questionElement.textContent =
        questionData.Q;

    optionsElement.innerHTML = "";

    nextButton.classList.add("hidden");


    // Mezclar respuestas
    const shuffledOptions = shuffle(questionData.opciones);


    shuffledOptions.forEach((option, index) => {

        const button = document.createElement("button");

        button.classList.add("option");


        // Obtener el texto independientemente de si
        // originalmente era A, B, C o D

        const optionKey = Object.keys(option)
            .find(key => key !== "R");

        const optionText = option[optionKey];


        // Generar nuevamente A, B, C, D
        const newLetter =
            String.fromCharCode(65 + index);

        button.textContent = `${newLetter}. ${optionText}`;

        // Guardamos si esta opción es correcta
        button.dataset.correct = option.R;

        button.addEventListener("click", () => {

            selectAnswer(
                button,
                option,
                questionData,
                shuffledOptions
            );

        });

        optionsElement.appendChild(button);

    });
}


// Seleccionar respuesta

function selectAnswer(
    selectedButton,
    selectedOption,
    questionData,
    options
) {

    // Deshabilitar todas las respuestas

    const buttons =
        optionsElement.querySelectorAll(".option");

    buttons.forEach(button => {
        button.disabled = true;
    });


    // Obtener texto de la respuesta seleccionada

    const selectedKey =
        Object.keys(selectedOption)
            .find(key => key !== "R");

    const selectedText =
        selectedOption[selectedKey];


    // ¿Es correcta?

    if (selectedOption.R === true) {

        // La seleccionada es correcta
        selectedButton.classList.add("correct");

        correctAnswers++;

    } else {

        // La seleccionada es incorrecta
        selectedButton.classList.add("wrong");


        // Buscar respuesta correcta

        const correctOption =
            options.find(option => option.R === true);


        // Obtener texto de la correcta

        const correctKey =
            Object.keys(correctOption)
                .find(key => key !== "R");

        const correctText =
            correctOption[correctKey];


        // Buscar el botón correcto mediante data-correct
        // y NO mediante el texto

        buttons.forEach(button => {

            if (button.dataset.correct === "true") {

                button.classList.add("correct");

            }

        });


        // Guardar pregunta incorrecta

        wrongAnswers.push({

            question: questionData.Q,

            userAnswer: selectedText,

            correctAnswer: correctText

        });

    }


    score.textContent =
        `Correctas: ${correctAnswers}`;

    nextButton.classList.remove("hidden");
}


// Continuar

nextButton.addEventListener("click", () => {

    currentQuestion++;

    if (currentQuestion < quizData.length) {

        showQuestion();

    } else {

        showResults();

    }

});


// Mostrar resultados

function showResults() {

    quizScreen.classList.add("hidden");

    resultScreen.classList.remove("hidden");


    const totalAnswered =
        correctAnswers + wrongAnswers.length;

    const unanswered =
        quizData.length - totalAnswered;
    
    const incorrect =
        wrongAnswers.length;

    const percentage =
        totalAnswered > 0
            ? Math.round((correctAnswers / totalAnswered) * 100)
            : 0;

    document.getElementById("total-questions")
        .textContent = totalAnswered;

    document.getElementById("correct-answers")
        .textContent = correctAnswers;

    document.getElementById("wrong-answers")
        .textContent = incorrect;

    document.getElementById("percentage")
        .textContent = percentage;


    // Lista de preguntas incorrectas

    const wrongList =
        document.getElementById("wrong-list");

    wrongList.innerHTML = "";

    document.getElementById("unanswered-questions")
        .textContent = unanswered;


    if (wrongAnswers.length === 0) {

        wrongList.innerHTML =
            "<p>¡Todas las respuestas fueron correctas!</p>";

        return;
    }


    wrongAnswers.forEach((item, index) => {

        const div =
            document.createElement("div");

        div.classList.add("wrong-question");

        div.innerHTML = `

            <p>
                <strong>${index + 1}. ${item.question}</strong>
            </p>

            <p>
                Tu respuesta:
                <span class="user-answer">
                    ${item.userAnswer}
                </span>
            </p>

            <p>
                Respuesta correcta:
                <span class="correct-answer">
                    ${item.correctAnswer}
                </span>
            </p>

        `;

        wrongList.appendChild(div);

    });

}


// Reiniciar

restartButton.addEventListener("click", () => {

    resultScreen.classList.add("hidden");

    startScreen.classList.remove("hidden");

});

finishButton.addEventListener("click", finishQuiz);

async function finishQuiz() {

    const confirmed = await confirm(
        "Las preguntas que aún no hayas respondido no contarán.\n\n" +
        "¿Estás seguro de que quieres finalizar el quiz?",
        {
            title: "Finalizar quiz",
            kind: "warning"
        }
    );

    if (!confirmed) {
        return;
    }

    showResults();
}

// Cargar quiz al abrir la página

loadQuiz();