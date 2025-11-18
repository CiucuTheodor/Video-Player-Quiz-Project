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

const quizManagement = {
    quizzes: [],
    videoElement: null,
    shownQuizzes: new Set(),

    init() {
        this.videoElement = document.getElementById('test');
        if (!this.videoElement) {
            console.error('Video element not found!');
            return;
        }
        
        this.loadQuizzes();
        this.setupFormListener();
        this.setupVideoListener();
        this.renderQuizList();
    },

    setupFormListener() {
        const form = document.getElementById('add-quiz-form');
        if (!form) {
            console.error('Form not found!');
            return;
        }
        
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
                console.log('Video time:', currentTime, 'seconds | Quizzes at times:', this.quizzes.map(q => q.time));
                this.checkForQuiz(currentTime);
            }
        });

        this.videoElement.addEventListener('seeked', () => {
            this.shownQuizzes.clear();
            console.log('Quizzes reset due to seeking');
        });
        
        console.log('Video listener setup complete. Total quizzes:', this.quizzes.length);
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

        if (isNaN(time) || time < 0) {
            alert('Please enter a valid time in seconds.');
            return;
        }

        if (!question) {
            alert('Please enter a question.');
            return;
        }

        if (options.some(opt => !opt)) {
            alert('Please fill in all 4 answer options.');
            return;
        }

        const existingIndex = this.quizzes.findIndex(q => q.time === time);
        if (existingIndex !== -1) {
            if (!confirm(`A quiz already exists at ${time} seconds. Replace it?`)) {
                return;
            }
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
        
        alert(`✅ Quiz added successfully at ${time} seconds!\n\nPlay the video and it will pause at ${time}s to show the quiz.`);
        console.log('Quiz added:', quiz);
    },

    deleteQuiz(id) {
        if (confirm('Are you sure you want to delete this quiz?')) {
            this.quizzes = this.quizzes.filter(q => q.id !== id);
            this.saveQuizzes();
            this.renderQuizList();
            console.log('Quiz deleted:', id);
        }
    },

    checkForQuiz(currentTime) {
        const quiz = this.quizzes.find(q => q.time === currentTime);
        
        if (quiz) {
            console.log('✅ QUIZ FOUND at', currentTime, 'seconds!');
            if (!this.shownQuizzes.has(quiz.id)) {
                console.log('🎬 SHOWING QUIZ NOW!');
                this.showQuiz(quiz);
                this.shownQuizzes.add(quiz.id);
            } else {
                console.log('⚠️ Quiz already shown');
            }
        }
    },

    showQuiz(quiz) {
        this.videoElement.pause();
        console.log('Showing quiz:', quiz);

        const overlay = document.getElementById('quiz-overlay');
        const questionText = document.getElementById('question-text');
        const answerOptions = document.getElementById('answer-options');
        const feedbackText = document.getElementById('feedback-text');

        if (!overlay || !questionText || !answerOptions) {
            console.error('Quiz overlay elements not found!');
            return;
        }

        questionText.textContent = quiz.question;
        answerOptions.innerHTML = '';
        feedbackText.textContent = '';
        feedbackText.style.color = '';

        quiz.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.style.marginBottom = '10px';
            optionDiv.innerHTML = `
                <input type="radio" name="quiz-answer" value="${index}" id="answer-${index}" style="margin-right: 10px;">
                <label for="answer-${index}" style="color: white; font-size: 18px; cursor: pointer;">
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
        
        if (!selectedAnswer) {
            alert('Please select an answer!');
            return;
        }

        const answerIndex = parseInt(selectedAnswer.value);
        const feedbackText = document.getElementById('feedback-text');
        const overlay = document.getElementById('quiz-overlay');

        if (answerIndex === quiz.correctAnswer) {
            feedbackText.textContent = '✓ Correct! Well done!';
            feedbackText.style.color = 'lightgreen';
            feedbackText.style.fontSize = '20px';
            feedbackText.style.fontWeight = 'bold';
        } else {
            feedbackText.textContent = `✗ Incorrect. The correct answer was: ${quiz.options[quiz.correctAnswer]}`;
            feedbackText.style.color = 'red';
            feedbackText.style.fontSize = '18px';
            feedbackText.style.fontWeight = 'bold';
        }

        setTimeout(() => {
            overlay.style.display = 'none';
            this.videoElement.play();
        }, 3000);
    },

    renderQuizList() {
        const container = document.getElementById('quiz-list-container');
        
        if (!container) {
            console.error('Quiz list container not found!');
            return;
        }
        
        if (this.quizzes.length === 0) {
            container.innerHTML = '<p style="color: gray; text-align: center;">No quizzes added yet.</p>';
            return;
        }

        container.innerHTML = this.quizzes.map(quiz => `
            <div class="quiz-item">
                <div class="quiz-item-header">
                    <span class="quiz-item-time">⏱️ ${quiz.time}s</span>
                    <button class="quiz-item-delete" onclick="quizManagement.deleteQuiz(${quiz.id})">Delete</button>
                </div>
                <div class="quiz-item-question"><strong>Q:</strong> ${quiz.question}</div>
                <ul class="quiz-item-options">
                    ${quiz.options.map((opt, idx) => `
                        <li class="${idx === quiz.correctAnswer ? 'correct-option' : ''}">
                            ${String.fromCharCode(65 + idx)}) ${opt}
                            ${idx === quiz.correctAnswer ? ' ✓' : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `).join('');
    },

    saveQuizzes() {
        const quizzesData = this.quizzes.map(q => ({
            id: q.id,
            time: q.time,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer
        }));
        localStorage.setItem('videoQuizzes', JSON.stringify(quizzesData));
        console.log('Quizzes saved to localStorage');
    },

    loadQuizzes() {
        const saved = localStorage.getItem('videoQuizzes');
        if (saved) {
            this.quizzes = JSON.parse(saved);
            console.log('Loaded quizzes from localStorage:', this.quizzes);
        } else {
            console.log('No saved quizzes found');
        }
    }
};

function dosomething() {
    if (quizManagement.currentQuiz) {
        quizManagement.submitAnswer(quizManagement.currentQuiz);
    }
}
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing quiz management...');
    quizManagement.init();
});
