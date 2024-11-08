import { Quiz } from './quiz.js';
import { SUBJECTS } from './config.js';

export class QuizUI {
    constructor() {
        this.quiz = new Quiz();
        this.initializeElements();
        this.setupEventListeners();
        this.populateSubjects();
    }

    initializeElements() {
        this.elements = {
            setupContainer: document.getElementById('setup-container'),
            quizContainer: document.getElementById('quiz-container'),
            questionText: document.getElementById('question-text'),
            optionsContainer: document.getElementById('options-container'),
            nextButton: document.getElementById('next-btn'),
            nextButtonContainer: document.getElementById('next-button-container'),
            scoreContainer: document.getElementById('score-container'),
            restartButton: document.getElementById('restart-btn'),
            timerElement: document.getElementById('timer'),
            loader: document.getElementById('loader'),
            subjectSelect: document.getElementById('subject-select'),
            subTopicSelect: document.getElementById('subtopic-select'),
            questionsSelect: document.getElementById('questions-select'),
            startButton: document.getElementById('start-quiz-btn'),
            currentQuestion: document.getElementById('current-question'),
            totalQuestions: document.getElementById('total-questions'),
            totalAttempted: document.getElementById('total-attempted'),
            correctAnswers: document.getElementById('correct-answers'),
            wrongAnswers: document.getElementById('wrong-answers'),
            scorePercentage: document.getElementById('score-percentage')
        };
    }

    setupEventListeners() {
        this.elements.startButton.addEventListener('click', () => this.startQuiz());
        this.elements.nextButton.addEventListener('click', () => this.loadNextQuestion());
        this.elements.restartButton.addEventListener('click', () => this.resetQuiz());
        this.elements.subjectSelect.addEventListener('change', () => this.updateSubTopics());
    }

    populateSubjects() {
        Object.keys(SUBJECTS).forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            this.elements.subjectSelect.appendChild(option);
        });
    }

    updateSubTopics() {
        const subject = this.elements.subjectSelect.value;
        const subTopicSelect = this.elements.subTopicSelect;
        subTopicSelect.innerHTML = '<option value="">Choose a sub-topic...</option>';
        
        if (subject && SUBJECTS[subject]) {
            SUBJECTS[subject].forEach(subTopic => {
                const option = document.createElement('option');
                option.value = subTopic;
                option.textContent = subTopic;
                subTopicSelect.appendChild(option);
            });
            subTopicSelect.disabled = false;
        } else {
            subTopicSelect.disabled = true;
        }
    }

    startQuiz() {
        const subject = this.elements.subjectSelect.value;
        const subTopic = this.elements.subTopicSelect.value;
        this.quiz.timeLimit = parseInt(document.getElementById('time-select').value);
        this.quiz.questionLimit = parseInt(this.elements.questionsSelect.value);
        
        if (!subject || !subTopic) {
            alert('Please select both subject and sub-topic');
            return;
        }

        this.quiz.score = 0;
        this.quiz.questionsAnswered = 0;
        this.quiz.wrongAnswers = 0;
        this.quiz.currentSubTopic = subTopic;
        
        this.elements.setupContainer.classList.add('hidden');
        this.elements.quizContainer.classList.remove('hidden');
        this.elements.scoreContainer.classList.add('hidden');
        this.elements.nextButtonContainer.classList.add('hidden');
        
        this.updateProgress();
        this.loadNextQuestion();
    }

    updateProgress() {
        this.elements.currentQuestion.textContent = this.quiz.questionsAnswered + 1;
        this.elements.totalQuestions.textContent = this.quiz.questionLimit || '∞';
    }

    resetQuiz() {
        this.elements.scoreContainer.classList.add('hidden');
        this.elements.setupContainer.classList.remove('hidden');
        this.elements.nextButtonContainer.classList.add('hidden');
        clearInterval(this.quiz.timer);
    }

    async loadNextQuestion() {
        // Remove previous explanation if exists
        const existingExplanation = document.querySelector('.explanation');
        if (existingExplanation) {
            existingExplanation.remove();
        }

        clearInterval(this.quiz.timer);
        this.elements.nextButtonContainer.classList.add('hidden');
        this.elements.loader.classList.remove('hidden');
        this.elements.optionsContainer.innerHTML = '';
        
        const questionData = await this.quiz.generateQuestion(this.quiz.currentSubTopic);
        
        if (!questionData) {
            this.showResults();
            return;
        }
        
        this.quiz.currentQuestion = questionData;
        this.elements.questionText.textContent = questionData.question;
        
        questionData.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.textContent = option;
            button.classList.add('option');
            button.addEventListener('click', () => this.checkAnswer(index));
            this.elements.optionsContainer.appendChild(button);
        });
        
        this.elements.loader.classList.add('hidden');
        this.updateProgress();
        
        if (this.quiz.timeLimit > 0) {
            this.startTimer();
        }

        // Scroll to top when new question loads
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    checkAnswer(selectedIndex) {
        clearInterval(this.quiz.timer);
        const options = this.elements.optionsContainer.querySelectorAll('.option');
        
        options.forEach(option => {
            option.disabled = true;
        });
        
        this.quiz.questionsAnswered++;
        
        if (selectedIndex === this.quiz.currentQuestion.correctIndex) {
            options[selectedIndex].classList.add('correct');
            this.quiz.score++;
        } else {
            options[selectedIndex].classList.add('wrong');
            options[this.quiz.currentQuestion.correctIndex].classList.add('correct');
            this.quiz.wrongAnswers++;
        }
        
        this.showExplanation();
        
        if (this.quiz.questionLimit && this.quiz.questionsAnswered >= this.quiz.questionLimit) {
            this.elements.nextButton.textContent = 'Show Results';
        } else {
            this.elements.nextButton.textContent = 'Next Question';
        }
        
        this.elements.nextButtonContainer.classList.remove('hidden');
    }

    startTimer() {
        let timeLeft = this.quiz.timeLimit;
        this.elements.timerElement.textContent = `Time left: ${timeLeft}s`;
        
        this.quiz.timer = setInterval(() => {
            timeLeft--;
            this.elements.timerElement.textContent = `Time left: ${timeLeft}s`;
            
            if (timeLeft <= 0) {
                clearInterval(this.quiz.timer);
                const options = this.elements.optionsContainer.querySelectorAll('.option');
                options.forEach(option => option.disabled = true);
                options[this.quiz.currentQuestion.correctIndex].classList.add('correct');
                this.quiz.questionsAnswered++;
                this.quiz.wrongAnswers++;
                this.showExplanation();
                this.elements.nextButtonContainer.classList.remove('hidden');
            }
        }, 1000);
    }

    showResults() {
        const results = this.quiz.getResults();
        this.elements.totalAttempted.textContent = results.total;
        this.elements.correctAnswers.textContent = results.correct;
        this.elements.wrongAnswers.textContent = results.wrong;
        this.elements.scorePercentage.textContent = `${results.percentage}%`;
        
        this.elements.scoreContainer.classList.remove('hidden');
        this.elements.questionText.textContent = '';
        this.elements.optionsContainer.innerHTML = '';
        this.elements.nextButtonContainer.classList.add('hidden');
        this.elements.timerElement.textContent = '';
    }

    async showExplanation() {
        const explanation = await this.quiz.getExplanation(
            this.quiz.currentQuestion.question,
            this.quiz.currentQuestion.options,
            this.quiz.currentQuestion.correctIndex
        );

        const explanationDiv = document.createElement('div');
        explanationDiv.className = 'explanation';
        explanationDiv.innerHTML = `
            <h3>Explanation</h3>
            <div class="explanation-content">
                <pre>${explanation}</pre>
            </div>
            <div class="doubt-section">
                <h4>Have a doubt?</h4>
                <div class="doubt-input-container">
                    <textarea 
                        placeholder="Type your doubt here related to this question..."
                        class="doubt-input"
                    ></textarea>
                    <button class="ask-doubt-btn">Ask Doubt</button>
                </div>
                <div class="doubt-answer hidden"></div>
            </div>
        `;

        const existingExplanation = document.querySelector('.explanation');
        if (existingExplanation) {
            existingExplanation.remove();
        }

        this.elements.optionsContainer.after(explanationDiv);
        this.setupDoubtHandling(explanationDiv);
    }

    setupDoubtHandling(explanationDiv) {
        const doubtBtn = explanationDiv.querySelector('.ask-doubt-btn');
        const doubtInput = explanationDiv.querySelector('.doubt-input');
        const doubtAnswer = explanationDiv.querySelector('.doubt-answer');

        doubtBtn.addEventListener('click', async () => {
            const doubt = doubtInput.value.trim();
            if (!doubt) return;

            doubtBtn.disabled = true;
            doubtBtn.textContent = 'Getting answer...';
            
            const answer = await this.quiz.askDoubt(doubt, this.quiz.currentQuestion.question);
            
            doubtAnswer.innerHTML = `
                <h4>Answer to your doubt:</h4>
                <p>${answer}</p>
            `;
            doubtAnswer.classList.remove('hidden');
            
            doubtBtn.disabled = false;
            doubtBtn.textContent = 'Ask Doubt';
        });
    }
}