/**
 * interview-script.js - AI Mock Interview System
 * Handles interview page functionality:
 * - Camera and microphone access
 * - Speech-to-text recognition
 * - Question navigation
 * - Timer countdown
 * - Basic AI feedback simulation
 * - localStorage for data persistence
 */

// ========================================
// CONFIGURATION & DATA
// ========================================

// Sample interview questions based on type
const questionBank = {
  hr: [
    { text: "Tell me about yourself and your background.", keywords: ["background", "experience", "education", "skills"] },
    { text: "Why do you want to work for our company?", keywords: ["company", "interest", "motivation", "culture"] },
    { text: "What are your greatest strengths?", keywords: ["strength", "skill", "ability", "expertise"] },
    { text: "What is your greatest weakness?", keywords: ["weakness", "improve", "challenge", "development"] },
    { text: "Where do you see yourself in 5 years?", keywords: ["goal", "future", "career", "ambition"] },
    { text: "Tell me about a time you faced a difficult situation at work.", keywords: ["challenge", "problem", "solution", "resolve"] },
    { text: "How do you handle stress and pressure?", keywords: ["stress", "pressure", "manage", "cope"] },
    { text: "Why should we hire you?", keywords: ["value", "contribution", "unique", "benefit"] }
  ],
  technical: [
    { text: "Explain the difference between process and thread.", keywords: ["process", "thread", "memory", "concurrent"] },
    { text: "What is the difference between REST and GraphQL?", keywords: ["REST", "GraphQL", "API", "query"] },
    { text: "How would you design a system that handles millions of users?", keywords: ["scale", "architecture", "distributed", "performance"] },
    { text: "Explain the concept of database normalization.", keywords: ["normalization", "database", "redundancy", "tables"] },
    { text: "What are microservices and their advantages?", keywords: ["microservices", "architecture", "scalable", "independent"] },
    { text: "Explain the CAP theorem.", keywords: ["CAP", "consistency", "availability", "partition"] },
    { text: "What is the difference between SQL and NoSQL databases?", keywords: ["SQL", "NoSQL", "relational", "document"] }
  ],
  behavioral: [
    { text: "Describe a time when you had to work with a difficult team member.", keywords: ["team", "conflict", "communication", "resolve"] },
    { text: "Tell me about a project where you demonstrated leadership.", keywords: ["leadership", "lead", "initiative", "responsibility"] },
    { text: "Give an example of a time you failed and what you learned.", keywords: ["failure", "mistake", "learn", "improve"] },
    { text: "Describe a situation where you had to meet a tight deadline.", keywords: ["deadline", "pressure", "time", "prioritize"] },
    { text: "Tell me about a time you had to adapt to a significant change.", keywords: ["change", "adapt", "flexible", "adjust"] },
    { text: "Describe a time when you went above and beyond.", keywords: ["exceed", "extra", "initiative", "dedication"] },
    { text: "Tell me about a time you had to persuade someone.", keywords: ["persuade", "convince", "influence", "negotiate"] }
  ]
};

// Default questions if no level selected
const defaultQuestions = questionBank.hr;

// ========================================
// DOM ELEMENTS
// ========================================

const timerEl = document.getElementById('timer');
const statusEl = document.getElementById('status');
const videoEl = document.getElementById('interviewCamera');
const cameraErrorEl = document.getElementById('cameraError');
const questionTextEl = document.getElementById('questionText');
const questionNumberEl = document.getElementById('questionNumber');
const transcriptEl = document.getElementById('transcript');
const wordCountEl = document.getElementById('wordCount');
const listeningIndicatorEl = document.getElementById('listeningIndicator');

const startAnswerBtn = document.getElementById('startAnswerBtn');
const stopAnswerBtn = document.getElementById('stopAnswerBtn');
const clearAnswerBtn = document.getElementById('clearAnswerBtn');
const prevQuestionBtn = document.getElementById('prevQuestionBtn');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const submitInterviewBtn = document.getElementById('submitInterviewBtn');
const camToggleBtn = document.getElementById('camToggleBtn');
const micToggleBtn = document.getElementById('micToggleBtn');

const relevanceScoreEl = document.getElementById('relevanceScore');
const clarityScoreEl = document.getElementById('clarityScore');
const completenessScoreEl = document.getElementById('completenessScore');
const feedbackTextEl = document.getElementById('feedbackText');

// ========================================
// STATE MANAGEMENT
// ========================================

let state = {
  currentQuestionIndex: 0,
  questions: [],
  answers: [],
  mediaStream: null,
  recognition: null,
  isRecording: false,
  isCameraOn: false,
  timeRemaining: 30 * 60, // 30 minutes in seconds
  timerInterval: null,
  interviewLevel: 'hr'
};

// ========================================
// INITIALIZATION
// ========================================

function init() {
  // Get interview level from localStorage
  state.interviewLevel = localStorage.getItem('interviewLevel') || 'hr';
  state.questions = questionBank[state.interviewLevel] || defaultQuestions;
  
  // Initialize answers array
  state.answers = state.questions.map(q => ({
    question: q.text,
    keywords: q.keywords,
    answer: '',
    wordCount: 0,
    relevance: null,
    clarity: null,
    completeness: null,
    feedback: ''
  }));
  
  // Load first question
  loadQuestion(0);
  
  // Initialize camera
  initCamera();
  
  // Initialize speech recognition
  initSpeechRecognition();
  
  // Start timer
  startTimer();
  
  // Setup event listeners
  setupEventListeners();
  
  // Update status
  updateStatus('Ready to start');
}

// ========================================
// CAMERA FUNCTIONALITY
// ========================================

async function initCamera() {
  try {
    state.mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 },
      audio: false
    });
    
    videoEl.srcObject = state.mediaStream;
    state.isCameraOn = true;
    camToggleBtn.classList.add('active');
    cameraErrorEl.style.display = 'none';
    
  } catch (error) {
    console.error('Camera access error:', error);
    cameraErrorEl.style.display = 'flex';
    camToggleBtn.classList.remove('active');
    updateStatus('Camera unavailable');
  }
}

function toggleCamera() {
  if (state.isCameraOn) {
    // Turn off camera
    if (state.mediaStream) {
      state.mediaStream.getTracks().forEach(track => track.stop());
      videoEl.srcObject = null;
    }
    state.isCameraOn = false;
    camToggleBtn.classList.remove('active');
    cameraErrorEl.style.display = 'flex';
    cameraErrorEl.innerHTML = '<i class="fas fa-camera-slash"></i><p>Camera is off</p>';
  } else {
    // Turn on camera
    initCamera();
  }
}

// ========================================
// SPEECH RECOGNITION
// ========================================

function initSpeechRecognition() {
  // Check for browser support
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.error('Speech recognition not supported');
    startAnswerBtn.disabled = true;
    startAnswerBtn.title = 'Speech recognition not supported in this browser';
    return;
  }
  
  state.recognition = new SpeechRecognition();
  state.recognition.continuous = true;
  state.recognition.interimResults = true;
  state.recognition.lang = 'en-US';
  
  state.recognition.onstart = () => {
    state.isRecording = true;
    listeningIndicatorEl.style.display = 'flex';
    startAnswerBtn.disabled = true;
    stopAnswerBtn.disabled = false;
    micToggleBtn.classList.add('active');
    updateStatus('Listening...');
  };
  
  state.recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }
    
    // Update transcript
    if (finalTranscript) {
      transcriptEl.value += finalTranscript;
      updateWordCount();
      analyzeAnswer();
    }
  };
  
  state.recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    stopRecording();
    updateStatus('Error: ' + event.error);
  };
  
  state.recognition.onend = () => {
    if (state.isRecording) {
      // Restart if still supposed to be recording
      state.recognition.start();
    }
  };
}

function startRecording() {
  if (!state.recognition) {
    alert('Speech recognition is not available in your browser. Please type your answer.');
    return;
  }
  
  try {
    state.recognition.start();
  } catch (error) {
    console.error('Error starting recognition:', error);
  }
}

function stopRecording() {
  if (state.recognition && state.isRecording) {
    state.isRecording = false;
    state.recognition.stop();
    listeningIndicatorEl.style.display = 'none';
    startAnswerBtn.disabled = false;
    stopAnswerBtn.disabled = true;
    micToggleBtn.classList.remove('active');
    updateStatus('Processing answer...');
    
    // Save answer
    saveCurrentAnswer();
    
    setTimeout(() => {
      updateStatus('Answer saved');
    }, 500);
  }
}

// ========================================
// QUESTION NAVIGATION
// ========================================

function loadQuestion(index) {
  if (index < 0 || index >= state.questions.length) return;
  
  state.currentQuestionIndex = index;
  const question = state.questions[index];
  const answer = state.answers[index];
  
  // Update UI
  questionTextEl.textContent = question.text;
  questionNumberEl.textContent = index + 1;
  transcriptEl.value = answer.answer;
  
  // Update navigation buttons
  prevQuestionBtn.disabled = index === 0;
  nextQuestionBtn.disabled = index === state.questions.length - 1;
  
  // Update feedback
  updateFeedbackDisplay();
  updateWordCount();
}

function nextQuestion() {
  saveCurrentAnswer();
  loadQuestion(state.currentQuestionIndex + 1);
}

function prevQuestion() {
  saveCurrentAnswer();
  loadQuestion(state.currentQuestionIndex - 1);
}

function saveCurrentAnswer() {
  const answer = state.answers[state.currentQuestionIndex];
  answer.answer = transcriptEl.value.trim();
  answer.wordCount = countWords(answer.answer);
  
  // Analyze answer
  const analysis = analyzeAnswerQuality(answer.answer, answer.keywords);
  answer.relevance = analysis.relevance;
  answer.clarity = analysis.clarity;
  answer.completeness = analysis.completeness;
  answer.feedback = analysis.feedback;
}

// ========================================
// ANSWER ANALYSIS
// ========================================

function countWords(text) {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function updateWordCount() {
  const count = countWords(transcriptEl.value);
  wordCountEl.textContent = count;
}

function analyzeAnswer() {
  const answer = transcriptEl.value.trim();
  const keywords = state.questions[state.currentQuestionIndex].keywords;
  
  if (!answer) {
    relevanceScoreEl.textContent = '—';
    clarityScoreEl.textContent = '—';
    completenessScoreEl.textContent = '—';
    feedbackTextEl.innerHTML = '<i class="fas fa-info-circle"></i> Answer the question to receive AI feedback.';
    return;
  }
  
  const analysis = analyzeAnswerQuality(answer, keywords);
  
  // Update scores
  relevanceScoreEl.textContent = analysis.relevance + '/10';
  clarityScoreEl.textContent = analysis.clarity + '/10';
  completenessScoreEl.textContent = analysis.completeness + '/10';
  feedbackTextEl.innerHTML = `<i class="fas fa-robot"></i> ${analysis.feedback}`;
}

function analyzeAnswerQuality(answer, keywords) {
  const wordCount = countWords(answer);
  const lowerAnswer = answer.toLowerCase();
  
  // Relevance: Check keyword matches
  let keywordMatches = 0;
  keywords.forEach(keyword => {
    if (lowerAnswer.includes(keyword.toLowerCase())) {
      keywordMatches++;
    }
  });
  const relevance = Math.min(10, Math.round((keywordMatches / keywords.length) * 10) + 2);
  
  // Clarity: Based on sentence structure and length
  const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWordsPerSentence = wordCount / Math.max(sentences.length, 1);
  let clarity = 5;
  
  if (avgWordsPerSentence > 10 && avgWordsPerSentence < 25) {
    clarity = 8;
  } else if (avgWordsPerSentence >= 25 && avgWordsPerSentence < 40) {
    clarity = 7;
  } else if (avgWordsPerSentence >= 5) {
    clarity = 6;
  }
  
  // Completeness: Based on word count
  let completeness = 5;
  if (wordCount >= 100) completeness = 9;
  else if (wordCount >= 75) completeness = 8;
  else if (wordCount >= 50) completeness = 7;
  else if (wordCount >= 30) completeness = 6;
  else if (wordCount >= 15) completeness = 5;
  else completeness = 3;
  
  // Generate feedback
  let feedback = '';
  
  if (relevance < 5) {
    feedback += 'Your answer could be more relevant to the question. Try to address the key points directly. ';
  } else if (relevance >= 8) {
    feedback += 'Great job addressing the key points! ';
  }
  
  if (clarity < 6) {
    feedback += 'Try to structure your answer more clearly with well-formed sentences. ';
  } else if (clarity >= 8) {
    feedback += 'Your answer is clear and well-structured. ';
  }
  
  if (completeness < 6) {
    feedback += 'Consider providing more detail and examples to make your answer more complete.';
  } else if (completeness >= 8) {
    feedback += 'Your answer is comprehensive and detailed.';
  }
  
  if (!feedback) {
    feedback = 'Good answer! Keep practicing to improve further.';
  }
  
  return { relevance, clarity, completeness, feedback: feedback.trim() };
}

// ========================================
// TIMER
// ========================================

function startTimer() {
  state.timerInterval = setInterval(() => {
    state.timeRemaining--;
    
    if (state.timeRemaining <= 0) {
      state.timeRemaining = 0;
      clearInterval(state.timerInterval);
      handleTimeUp();
    }
    
    updateTimerDisplay();
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(state.timeRemaining / 60);
  const seconds = state.timeRemaining % 60;
  timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  
  // Change color when time is running low
  if (state.timeRemaining <= 300) { // 5 minutes
    timerEl.parentElement.style.borderColor = 'var(--accent-warning)';
    timerEl.parentElement.style.color = 'var(--accent-warning)';
  }
  
  if (state.timeRemaining <= 60) { // 1 minute
    timerEl.parentElement.style.borderColor = 'var(--accent-danger)';
    timerEl.parentElement.style.color = 'var(--accent-danger)';
  }
}

function handleTimeUp() {
  // Stop recording
  if (state.isRecording) {
    stopRecording();
  }
  
  // Disable inputs
  startAnswerBtn.disabled = true;
  transcriptEl.disabled = true;
  
  // Show message
  updateStatus('Time is up!');
  alert('Time is up! Please submit your interview.');
}

// ========================================
// SUBMIT INTERVIEW
// ========================================

function submitInterview() {
  // Confirm submission
  const answeredCount = state.answers.filter(a => a.answer.trim().length > 0).length;
  const unansweredCount = state.questions.length - answeredCount;
  
  let confirmMessage = `Ready to submit your interview?\n\n`;
  confirmMessage += `✓ Answered: ${answeredCount} question${answeredCount !== 1 ? 's' : ''}\n`;
  if (unansweredCount > 0) {
    confirmMessage += `✗ Unanswered: ${unansweredCount} question${unansweredCount !== 1 ? 's' : ''}\n\n`;
    confirmMessage += `You can still submit, but answering all questions will give you better feedback.`;
  } else {
    confirmMessage += `\nGreat! You answered all questions.`;
  }
  
  if (!confirm(confirmMessage)) {
    return; // User cancelled
  }
  
  // Save current answer
  saveCurrentAnswer();
  
  // Calculate statistics
  const stats = {
    level: state.interviewLevel,
    totalQuestions: state.questions.length,
    answeredQuestions: answeredCount,
    totalWords: state.answers.reduce((sum, a) => sum + a.wordCount, 0),
    avgRelevance: calculateAverage(state.answers.map(a => a.relevance)),
    avgClarity: calculateAverage(state.answers.map(a => a.clarity)),
    avgCompleteness: calculateAverage(state.answers.map(a => a.completeness)),
    timeSpent: (30 * 60) - state.timeRemaining,
    submittedAt: new Date().toISOString()
  };
  
  // Store in localStorage
  localStorage.setItem('interviewAnswers', JSON.stringify(state.answers));
  localStorage.setItem('interviewStats', JSON.stringify(stats));
  
  // Stop timer
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
  }
  
  // Stop camera
  if (state.mediaStream) {
    state.mediaStream.getTracks().forEach(track => track.stop());
  }
  
  // Redirect to feedback page
  window.location.href = 'feedback.html';
}

function calculateAverage(numbers) {
  const validNumbers = numbers.filter(n => n !== null && !isNaN(n));
  if (validNumbers.length === 0) return 0;
  return Math.round(validNumbers.reduce((sum, n) => sum + n, 0) / validNumbers.length);
}

// ========================================
// UI UPDATES
// ========================================

function updateStatus(message) {
  statusEl.textContent = message;
}

function updateFeedbackDisplay() {
  const answer = state.answers[state.currentQuestionIndex];
  
  if (answer.relevance !== null) {
    relevanceScoreEl.textContent = answer.relevance + '/10';
    clarityScoreEl.textContent = answer.clarity + '/10';
    completenessScoreEl.textContent = answer.completeness + '/10';
    feedbackTextEl.innerHTML = `<i class="fas fa-robot"></i> ${answer.feedback}`;
  } else {
    relevanceScoreEl.textContent = '—';
    clarityScoreEl.textContent = '—';
    completenessScoreEl.textContent = '—';
    feedbackTextEl.innerHTML = '<i class="fas fa-info-circle"></i> Answer the question to receive AI feedback.';
  }
}

function clearAnswer() {
  if (confirm('Are you sure you want to clear your answer?')) {
    transcriptEl.value = '';
    updateWordCount();
    state.answers[state.currentQuestionIndex].answer = '';
    updateFeedbackDisplay();
  }
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
  // Recording controls
  startAnswerBtn.addEventListener('click', startRecording);
  stopAnswerBtn.addEventListener('click', stopRecording);
  clearAnswerBtn.addEventListener('click', clearAnswer);
  
  // Navigation
  prevQuestionBtn.addEventListener('click', prevQuestion);
  nextQuestionBtn.addEventListener('click', nextQuestion);
  submitInterviewBtn.addEventListener('click', submitInterview);
  
  // Camera toggle
  camToggleBtn.addEventListener('click', toggleCamera);
  
  // Transcript changes
  transcriptEl.addEventListener('input', () => {
    updateWordCount();
    // Debounce analysis
    clearTimeout(state.analysisTimeout);
    state.analysisTimeout = setTimeout(analyzeAnswer, 1000);
  });
  
  // Prevent page unload
  window.addEventListener('beforeunload', (e) => {
    if (state.currentQuestionIndex > 0 || transcriptEl.value.trim().length > 0) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

// ========================================
// START APPLICATION
// ========================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
