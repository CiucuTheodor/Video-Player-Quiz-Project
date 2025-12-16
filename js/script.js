const canvas = document.getElementById('backgroundCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const balls = [
    { x: 100, y: 100, radius: 25, dx: 3, dy: 2, color: 'orange' },
    { x: 300, y: 200, radius: 30, dx: 2, dy: 3, color: 'lightblue' },
    { x: 500, y: 150, radius: 20, dx: 4, dy: 2, color: 'limegreen' },
    { x: 600, y: 300, radius: 50, dx: 6, dy: 3, color: 'red' },
    { x: 200, y: 50, radius: 70, dx: 3, dy: 3, color: 'violet' }
];

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    balls.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.closePath();

        ball.x += ball.dx;
        ball.y += ball.dy;

        if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
            ball.dx *= -1;
        }
        if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
            ball.dy *= -1;
        }
    });

    requestAnimationFrame(animate);
}

animate();

const audioManager = {
    audioContext: null,

    init() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
    },

    playCorrect() {
        const now = this.audioContext.currentTime;
        this.playNote(523.25, now, 0.15);
        this.playNote(659.25, now + 0.1, 0.15);
        this.playNote(783.99, now + 0.2, 0.3);
    },

    playWrong() {
        const now = this.audioContext.currentTime;
        this.playBuzz(200, now, 0.15);
        this.playBuzz(150, now + 0.15, 0.25);
    },

    playNote(frequency, startTime, duration) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    },

    playBuzz(frequency, startTime, duration) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sawtooth';
        oscillator.frequency.value = frequency;

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    },

    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
};

const quizManagement = {
    quizzes: [],
    videoElement: null,
    shownQuizzes: new Set(),

    init() {
        this.videoElement = document.getElementById('test');
        if (!this.videoElement) return;

        this.loadQuizzes();
        this.setupFormListener();
        this.setupVideoListener();
        this.renderQuizList();
    },

    setupFormListener() {
        const form = document.getElementById('add-quiz-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addQuiz();
        });
    },

    setupVideoListener() {
        if (!this.videoElement) return;

        let lastTime = -1;

        this.videoElement.addEventListener('timeupdate', () => {
            const currentTime = Math.floor(this.videoElement.currentTime);
            if (currentTime !== lastTime) {
                lastTime = currentTime;
                this.checkForQuiz(currentTime);
            }
        });

        this.videoElement.addEventListener('seeked', () => {
            this.shownQuizzes.clear();
        });
    },

    addQuiz() {
        const time = parseInt(document.getElementById('quiz-time').value);
        const question = document.getElementById('quiz-question-input').value.trim();

        const options = [
            document.getElementById('option-0').value.trim(),
            document.getElementById('option-1').value.trim(),
            document.getElementById('option-2').value.trim(),
            document.getElementById('option-3').value.trim()
        ];

        const correctAnswer = parseInt(document.querySelector('input[name="correct-answer"]:checked').value);

        if (isNaN(time) || time < 0) return;
        if (!question) return;
        if (options.some(opt => !opt)) return;

        const existingIndex = this.quizzes.findIndex(q => q.time === time);
        if (existingIndex !== -1) {
            if (!confirm(`A quiz already exists at ${time} seconds. Replace it?`)) return;
            this.quizzes.splice(existingIndex, 1);
        }

        const quiz = {
            id: Date.now(),
            time,
            question,
            options,
            correctAnswer
        };

        this.quizzes.push(quiz);
        this.quizzes.sort((a, b) => a.time - b.time);
        this.saveQuizzes();
        this.renderQuizList();

        document.getElementById('add-quiz-form').reset();
        document.getElementById('correct-0').checked = true;
    },

    deleteQuiz(id) {
        if (confirm('Are you sure you want to delete this quiz?')) {
            this.quizzes = this.quizzes.filter(q => q.id !== id);
            this.saveQuizzes();
            this.renderQuizList();
        }
    },

    checkForQuiz(currentTime) {
        const quiz = this.quizzes.find(q => q.time === currentTime);
        if (quiz && !this.shownQuizzes.has(quiz.id)) {
            this.showQuiz(quiz);
            this.shownQuizzes.add(quiz.id);
        }
    },

    showQuiz(quiz) {
        this.videoElement.pause();

        const overlay = document.getElementById('quiz-overlay');
        const questionText = document.getElementById('question-text');
        const answerOptions = document.getElementById('answer-options');
        const feedbackText = document.getElementById('feedback-text');

        if (!overlay || !questionText || !answerOptions) return;

        questionText.textContent = quiz.question;
        answerOptions.innerHTML = '';
        feedbackText.textContent = '';
        feedbackText.style.color = '';

        quiz.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.style.marginBottom = '10px';
            optionDiv.innerHTML = `
                <input type="radio" name="quiz-answer" value="${index}" id="answer-${index}">
                <label for="answer-${index}">
                    ${String.fromCharCode(65 + index)}) ${option}
                </label>
            `;
            answerOptions.appendChild(optionDiv);
        });

        overlay.style.display = 'block';
        this.currentQuiz = quiz;
    },

    submitAnswer(quiz) {
        const selectedAnswer = document.querySelector('input[name="quiz-answer"]:checked');
        if (!selectedAnswer) return;

        const answerIndex = parseInt(selectedAnswer.value);
        const feedbackText = document.getElementById('feedback-text');
        const overlay = document.getElementById('quiz-overlay');

        if (answerIndex === quiz.correctAnswer) {
            feedbackText.textContent = '✓ Correct! Well done!';
            feedbackText.style.color = 'lightgreen';
            audioManager.playCorrect();
        } else {
            feedbackText.textContent = `✗ Incorrect. The correct answer was: ${quiz.options[quiz.correctAnswer]}`;
            feedbackText.style.color = 'red';
            audioManager.playWrong();
        }

        setTimeout(() => {
            overlay.style.display = 'none';
            this.videoElement.play();
        }, 3000);
    },

    renderQuizList() {
        const container = document.getElementById('quiz-list-container');
        if (!container) return;

        if (this.quizzes.length === 0) {
            container.innerHTML = '<p>No quizzes added yet.</p>';
            return;
        }

        container.innerHTML = this.quizzes.map(quiz => `
            <div class="quiz-item">
                <div>
                    <span>${quiz.time}s</span>
                    <button onclick="quizManagement.deleteQuiz(${quiz.id})">Delete</button>
                </div>
                <div>${quiz.question}</div>
            </div>
        `).join('');
    },

    saveQuizzes() {
        localStorage.setItem('videoQuizzes', JSON.stringify(this.quizzes));
    },

    loadQuizzes() {
        const saved = localStorage.getItem('videoQuizzes');
        if (saved) this.quizzes = JSON.parse(saved);
    }
};

function dosomething() {
    if (quizManagement.currentQuiz) {
        quizManagement.submitAnswer(quizManagement.currentQuiz);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    audioManager.init();

    document.addEventListener('click', () => {
        audioManager.resume();
    }, { once: true });

    quizManagement.init();
});
