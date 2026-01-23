/**
 * feedback.js - Feedback Page Logic
 * Displays comprehensive interview feedback report
 * Retrieves data from localStorage
 */

// ========================================
// DOM ELEMENTS
// ========================================

const userEmailEl = document.getElementById('userEmail');
const overallRelevanceEl = document.getElementById('overallRelevance');
const overallClarityEl = document.getElementById('overallClarity');
const overallCompletenessEl = document.getElementById('overallCompleteness');
const relevanceBarEl = document.getElementById('relevanceBar');
const clarityBarEl = document.getElementById('clarityBar');
const completenessBarEl = document.getElementById('completenessBar');

const totalQuestionsEl = document.getElementById('totalQuestions');
const totalWordsEl = document.getElementById('totalWords');
const avgWordsEl = document.getElementById('avgWords');
const durationEl = document.getElementById('duration');

const questionFeedbackListEl = document.getElementById('questionFeedbackList');
const finalFeedbackEl = document.getElementById('finalFeedback');

const restartBtn = document.getElementById('restartBtn');
const levelsBtn = document.getElementById('levelsBtn');
const printBtn = document.getElementById('printBtn');

// ========================================
// DATA LOADING
// ========================================

function loadFeedbackData() {
  // Get user email
  const userEmail = localStorage.getItem('userEmail') || 'Guest';
  userEmailEl.textContent = userEmail;
  
  // Get interview data
  const answersJson = localStorage.getItem('interviewAnswers');
  const statsJson = localStorage.getItem('interviewStats');
  
  if (!answersJson || !statsJson) {
    showNoDataMessage();
    return;
  }
  
  const answers = JSON.parse(answersJson);
  const stats = JSON.parse(statsJson);
  
  // Display overall scores
  displayOverallScores(stats);
  
  // Display summary stats
  displaySummaryStats(stats);
  
  // Display question-wise feedback
  displayQuestionFeedback(answers);
  
  // Generate final feedback
  generateFinalFeedback(answers, stats);
}

// ========================================
// DISPLAY FUNCTIONS
// ========================================

function displayOverallScores(stats) {
  // Update score values
  overallRelevanceEl.textContent = `${stats.avgRelevance}/10`;
  overallClarityEl.textContent = `${stats.avgClarity}/10`;
  overallCompletenessEl.textContent = `${stats.avgCompleteness}/10`;
  
  // Animate progress bars
  setTimeout(() => {
    relevanceBarEl.style.width = `${(stats.avgRelevance / 10) * 100}%`;
    clarityBarEl.style.width = `${(stats.avgClarity / 10) * 100}%`;
    completenessBarEl.style.width = `${(stats.avgCompleteness / 10) * 100}%`;
  }, 300);
}

function displaySummaryStats(stats) {
  totalQuestionsEl.textContent = `${stats.answeredQuestions}/${stats.totalQuestions}`;
  totalWordsEl.textContent = stats.totalWords;
  
  const avgWords = stats.answeredQuestions > 0 
    ? Math.round(stats.totalWords / stats.answeredQuestions) 
    : 0;
  avgWordsEl.textContent = avgWords;
  
  // Format duration
  const minutes = Math.floor(stats.timeSpent / 60);
  const seconds = stats.timeSpent % 60;
  durationEl.textContent = `${minutes}m ${seconds}s`;
}

function displayQuestionFeedback(answers) {
  questionFeedbackListEl.innerHTML = '';
  
  answers.forEach((answer, index) => {
    const feedbackItem = createFeedbackItem(answer, index);
    questionFeedbackListEl.appendChild(feedbackItem);
  });
}

function createFeedbackItem(answer, index) {
  const item = document.createElement('div');
  item.className = 'feedback-item';
  
  // Determine if answer was provided
  const hasAnswer = answer.answer.trim().length > 0;
  const displayAnswer = hasAnswer ? answer.answer : '<em>No answer provided</em>';
  
  // Get scores or defaults
  const relevance = answer.relevance || 0;
  const clarity = answer.clarity || 0;
  const completeness = answer.completeness || 0;
  const feedback = answer.feedback || 'No feedback available.';
  
  item.innerHTML = `
    <div class="feedback-item-header">
      <h3>Question ${index + 1}</h3>
      <div class="feedback-item-scores">
        <div class="mini-score">
          <label>Relevance</label>
          <div class="value">${relevance}/10</div>
        </div>
        <div class="mini-score">
          <label>Clarity</label>
          <div class="value">${clarity}/10</div>
        </div>
        <div class="mini-score">
          <label>Complete</label>
          <div class="value">${completeness}/10</div>
        </div>
      </div>
    </div>
    <div class="feedback-question">
      <strong>Q:</strong> ${answer.question}
    </div>
    <div class="feedback-answer">
      <strong>Your Answer:</strong><br>
      ${displayAnswer}
      <div style="margin-top: 8px; color: var(--text-muted); font-size: 12px;">
        Word count: ${answer.wordCount}
      </div>
    </div>
    <div class="feedback-message">
      <strong><i class="fas fa-robot"></i> AI Feedback:</strong><br>
      ${feedback}
    </div>
  `;
  
  return item;
}

function generateFinalFeedback(answers, stats) {
  const avgRelevance = stats.avgRelevance;
  const avgClarity = stats.avgClarity;
  const avgCompleteness = stats.avgCompleteness;
  const overallAvg = Math.round((avgRelevance + avgClarity + avgCompleteness) / 3);
  
  let feedback = '';
  
  // Overall performance assessment
  feedback += '<p><strong>Overall Performance:</strong> ';
  if (overallAvg >= 8) {
    feedback += 'Excellent! You demonstrated strong interview skills across all dimensions.';
  } else if (overallAvg >= 7) {
    feedback += 'Very good performance. You answered most questions effectively with room for minor improvements.';
  } else if (overallAvg >= 6) {
    feedback += 'Good effort. Your answers show potential, but there are areas that need more attention.';
  } else if (overallAvg >= 5) {
    feedback += 'Fair performance. Consider practicing more and structuring your answers better.';
  } else {
    feedback += 'You may need more preparation. Focus on understanding the questions and providing detailed, relevant answers.';
  }
  feedback += '</p>';
  
  // Specific feedback on dimensions
  feedback += '<p><strong>Detailed Analysis:</strong></p><ul>';
  
  // Relevance feedback
  if (avgRelevance >= 7) {
    feedback += '<li><strong>Relevance:</strong> You consistently addressed the core of each question with relevant information.</li>';
  } else if (avgRelevance >= 5) {
    feedback += '<li><strong>Relevance:</strong> Your answers were somewhat relevant but could better target the specific points being asked.</li>';
  } else {
    feedback += '<li><strong>Relevance:</strong> Focus on directly answering what is being asked. Use keywords from the question in your response.</li>';
  }
  
  // Clarity feedback
  if (avgClarity >= 7) {
    feedback += '<li><strong>Clarity:</strong> Your answers were clear, well-structured, and easy to follow.</li>';
  } else if (avgClarity >= 5) {
    feedback += '<li><strong>Clarity:</strong> Work on structuring your thoughts before speaking. Use clear, complete sentences.</li>';
  } else {
    feedback += '<li><strong>Clarity:</strong> Practice organizing your thoughts. Consider using frameworks like STAR (Situation, Task, Action, Result) for behavioral questions.</li>';
  }
  
  // Completeness feedback
  if (avgCompleteness >= 7) {
    feedback += '<li><strong>Completeness:</strong> You provided comprehensive answers with sufficient detail and examples.</li>';
  } else if (avgCompleteness >= 5) {
    feedback += '<li><strong>Completeness:</strong> Add more detail and specific examples to make your answers more complete.</li>';
  } else {
    feedback += '<li><strong>Completeness:</strong> Your answers need more depth. Aim for at least 50-100 words per answer with concrete examples.</li>';
  }
  
  feedback += '</ul>';
  
  // Recommendations
  feedback += '<p><strong>Recommendations for Improvement:</strong></p><ul>';
  
  if (stats.totalWords < 300) {
    feedback += '<li>Provide more detailed answers. Your total word count was quite low.</li>';
  }
  
  if (stats.answeredQuestions < stats.totalQuestions) {
    feedback += '<li>Try to answer all questions. You left some questions unanswered.</li>';
  }
  
  if (avgRelevance < 6) {
    feedback += '<li>Research common interview questions for your field and practice relevant answers.</li>';
  }
  
  if (avgClarity < 6) {
    feedback += '<li>Practice speaking clearly and organizing your thoughts before answering.</li>';
  }
  
  if (avgCompleteness < 6) {
    feedback += '<li>Use the STAR method to provide complete, structured answers.</li>';
  }
  
  feedback += '<li>Keep practicing! Consider recording yourself to identify areas for improvement.</li>';
  feedback += '</ul>';
  
  // Closing message
  feedback += '<p><strong>Final Note:</strong> ';
  feedback += 'This is a practice tool to help you improve. Real interviews will vary, but the principles of relevance, clarity, and completeness always apply. ';
  feedback += 'Keep practicing and refining your interview skills. Good luck!';
  feedback += '</p>';
  
  finalFeedbackEl.innerHTML = feedback;
}

function showNoDataMessage() {
  questionFeedbackListEl.innerHTML = `
    <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
      <i class="fas fa-exclamation-triangle" style="font-size: 64px; color: var(--accent-warning); margin-bottom: 20px;"></i>
      <h2>No Interview Data Found</h2>
      <p>Please complete an interview first.</p>
      <button onclick="window.location.href='levels.html'" style="margin-top: 20px;" class="btn-action">
        <i class="fas fa-arrow-left"></i>
        <span>Go to Interview Levels</span>
      </button>
    </div>
  `;
  
  // Hide other sections
  document.querySelector('.overall-scores').style.display = 'none';
  document.querySelector('.summary-stats').style.display = 'none';
  document.querySelector('.final-feedback').style.display = 'none';
}

// ========================================
// EVENT HANDLERS
// ========================================

function handleRestart() {
  if (confirm('Are you sure you want to start a new interview? Current results will be cleared.')) {
    // Clear localStorage
    localStorage.removeItem('interviewAnswers');
    localStorage.removeItem('interviewStats');
    
    // Redirect to levels
    window.location.href = 'levels.html';
  }
}

function handleGoToLevels() {
  window.location.href = 'levels.html';
}

function handlePrint() {
  window.print();
}

// ========================================
// EVENT LISTENERS
// ========================================

restartBtn.addEventListener('click', handleRestart);
levelsBtn.addEventListener('click', handleGoToLevels);
printBtn.addEventListener('click', handlePrint);

// ========================================
// INITIALIZATION
// ========================================

// Load feedback data when page loads
document.addEventListener('DOMContentLoaded', loadFeedbackData);
