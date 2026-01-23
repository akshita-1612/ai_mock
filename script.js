/*
  script.js — Modern dark-themed AI Mock Interview frontend
  - Camera access via getUserMedia
  - Microphone + speech-to-text via Web Speech API
  - Simple frontend NLP for feedback (word count, keyword match, clarity estimates)
  - Animated landing (shutter open), glowing icon buttons, tooltips

  Comments are included to help beginners understand each part.
*/

// ----- Sample questions (static list) -----
const questions = [
  { text: "Tell me about a time you solved a difficult problem.", keywords: ["problem","solve","challenge","solution"] },
  { text: "Explain a project where you used teamwork to achieve a goal.", keywords: ["team","collaborat","role","together"] },
  { text: "How would you design a system that handles millions of users?", keywords: ["scale","performance","architecture","users"] },
  { text: "Why are you interested in this role?", keywords: ["interest","role","motivat","company"] }
];

// ----- DOM references -----
const landing = document.getElementById('landing');
const landingStart = document.getElementById('landingStart');
const statusEl = document.getElementById('status');
const videoEl = document.getElementById('interviewCamera');
const startAnswerBtn = document.getElementById('startAnswerBtn');
const stopAnswerBtn = document.getElementById('stopAnswerBtn');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const submitInterviewBtn = document.getElementById('submitInterviewBtn');
const camToggleBtn = document.getElementById('camToggleBtn');
const micToggleBtn = document.getElementById('micToggleBtn');
const questionTextEl = document.getElementById('questionText');
const transcriptEl = document.getElementById('transcript');
const relevanceScoreEl = document.getElementById('relevanceScore');
const clarityScoreEl = document.getElementById('clarityScore');
const completenessScoreEl = document.getElementById('completenessScore');
const feedbackTextEl = document.getElementById('feedbackText');

// ----- State -----
let currentQuestionIndex = 0;
let mediaStream = null; // MediaStream for camera+mic
let recognition = null; // SpeechRecognition instance
let finalTranscript = '';
// results for each question: will be saved to localStorage on submit
let interviewResults = questions.map(q => ({
  question: q.text,
  keywords: q.keywords || [],
  answer: '',
  wordCount: 0,
  relevance: null,
  clarity: null,
  completeness: null,
  feedback: ''
}));

// ----- UI helpers -----
function setStatus(msg){
  statusEl.textContent = msg;
}

function showQuestion(){
  const q = questions[currentQuestionIndex];
  questionTextEl.textContent = q.text;
  // Toggle Next vs Submit visibility: on last question show Submit
  if(currentQuestionIndex === questions.length - 1){
    // last question
    nextQuestionBtn.style.display = 'none';
    if(submitInterviewBtn) submitInterviewBtn.style.display = '';
  }else{
    nextQuestionBtn.style.display = '';
    if(submitInterviewBtn) submitInterviewBtn.style.display = 'none';
  }
}

// ----- Landing / shutter animation -----
function openLanding(){
  // add class to trigger CSS animations, then hide landing after animation
  landing.classList.add('open');
  setTimeout(()=>{ landing.style.display = 'none'; }, 1200);
}

// ----- Camera + Microphone access -----
async function startCameraAndMic(){
  setStatus('Requesting camera & microphone...');
  try{
    // Request both audio and video at once
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280 }, audio: true });
    // attach to video element
    videoEl.srcObject = mediaStream;
    // enable relevant buttons
    startAnswerBtn.disabled = false;
    stopAnswerBtn.disabled = true;
    nextQuestionBtn.disabled = false;
    setStatus('Camera active — you can start answering.');
  }catch(err){
    console.error('getUserMedia error', err);
    setStatus('Permission denied or device not available.');
    // disable buttons when no stream
    startAnswerBtn.disabled = true;
    stopAnswerBtn.disabled = true;
    nextQuestionBtn.disabled = true;
    // show fallback message inside video area
    videoEl.poster = '';
  }
}

// Toggle camera preview (start/stop video tracks)
function toggleCamera(){
  if(!mediaStream){
    startCameraAndMic();
    return;
  }
  const videoTracks = mediaStream.getVideoTracks();
  if(videoTracks.length === 0) return;
  const enabled = videoTracks[0].enabled;
  videoTracks.forEach(t => t.enabled = !enabled);
  camToggleBtn.classList.toggle('muted', !enabled);
  setStatus(enabled ? 'Camera paused' : 'Camera resumed');
}

// ----- SpeechRecognition (Web Speech API) -----
function initRecognition(){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition){
    setStatus('SpeechRecognition not supported in this browser (use Chrome).');
    startAnswerBtn.disabled = true;
    stopAnswerBtn.disabled = true;
    return null;
  }
  const r = new SpeechRecognition();
  r.lang = 'en-US';
  r.interimResults = true;
  r.continuous = true;

  r.onstart = () => { setStatus('Listening...'); startAnswerBtn.disabled = true; stopAnswerBtn.disabled = false; };
  r.onerror = (e) => { console.error('Speech error', e); setStatus('Speech recognition error: ' + (e.error || 'unknown')); };
  r.onend = () => { setStatus('Processing...'); startAnswerBtn.disabled = false; stopAnswerBtn.disabled = true; if(finalTranscript.trim()) processAnswer(finalTranscript.trim()); else setStatus('No speech detected.'); };

  r.onresult = (event) => {
    let interim = '';
    for(let i = event.resultIndex; i < event.results.length; i++){
      const t = event.results[i][0].transcript;
      if(event.results[i].isFinal) finalTranscript += t + ' ';
      else interim += t;
    }
    transcriptEl.value = finalTranscript + interim;
  };

  return r;
}

function startAnswer(){
  if(!recognition) recognition = initRecognition();
  if(!recognition) return;
  finalTranscript = '';
  transcriptEl.value = '';
  try{ recognition.start(); }catch(e){ console.warn(e); }
}

function stopAnswer(){
  if(recognition) recognition.stop();
}

// Toggle microphone (mute/unmute audio tracks)
function toggleMic(){
  if(!mediaStream) return setStatus('No microphone available');
  const audioTracks = mediaStream.getAudioTracks();
  if(audioTracks.length===0) return setStatus('No audio track found');
  const enabled = audioTracks[0].enabled;
  audioTracks.forEach(t => t.enabled = !enabled);
  micToggleBtn.classList.toggle('muted', !enabled);
  setStatus(enabled ? 'Microphone muted' : 'Microphone active');
}

// ----- Simple frontend NLP analysis -----
function processAnswer(text){
  // word count
  const words = text.split(/\s+/).filter(w=>w.length);
  const totalWords = words.length;

  // keyword matching
  const q = questions[currentQuestionIndex];
  const kw = q.keywords || [];
  let hits = 0;
  const lower = text.toLowerCase();
  for(const k of kw){ if(new RegExp(k,'i').test(lower)) hits++; }
  const keywordRatio = kw.length ? hits/kw.length : 0;

  // clarity: average sentence length and filler words
  const sentences = text.split(/[.!?]+/).map(s=>s.trim()).filter(Boolean);
  const avgWords = sentences.length ? (totalWords / sentences.length) : totalWords;
  const fillers = ['um','uh','like','you know','actually','basically','so','right'];
  let fillerCount = 0; const lt = lower;
  for(const f of fillers) fillerCount += (lt.match(new RegExp('\\b'+f+'\\b','g')) || []).length;

  // scoring heuristics
  const relevance = Math.round(Math.min(100, keywordRatio*120));
  const clarity = Math.round(Math.max(0, Math.min(100, 100 - Math.abs(avgWords - 13)*4 - fillerCount*8)));
  const completeness = Math.round(Math.min(100, Math.min(100, (Math.min(1, totalWords/80)*80) + keywordRatio*20)));

  // textual feedback
  const feedback = [];
  if(relevance>70) feedback.push('Relevant — you addressed the main points.'); else if(relevance>40) feedback.push('Partly relevant — touch the key concepts more.'); else feedback.push('Try focusing more on the topic and use keywords.');
  if(clarity>70) feedback.push('Clear delivery — good sentence structure.'); else feedback.push('Work on clear shorter sentences and reduce filler words.');
  if(completeness>70) feedback.push('Good completeness — you gave enough detail.'); else feedback.push('Add examples or specifics to make your answer fuller.');

  // Update UI
  relevanceScoreEl.textContent = relevance;
  clarityScoreEl.textContent = clarity;
  completenessScoreEl.textContent = completeness;
  feedbackTextEl.textContent = feedback.join(' ');
  setStatus('Feedback Ready');

  // Save result for this question (in-memory)
  interviewResults[currentQuestionIndex] = {
    question: q.text,
    keywords: q.keywords || [],
    answer: text,
    wordCount: totalWords,
    relevance,
    clarity,
    completeness,
    feedback: feedback.join(' ')
  };
}

// ----- Next question -----
function nextQuestion(){
  // move to next question (if not last)
  if(currentQuestionIndex < questions.length - 1) currentQuestionIndex++;
  showQuestion();
  // reset transcript & feedback
  finalTranscript = '';
  transcriptEl.value = '';
  relevanceScoreEl.textContent = '—';
  clarityScoreEl.textContent = '—';
  completenessScoreEl.textContent = '—';
  feedbackTextEl.textContent = 'No feedback yet.';
  setStatus('Ready for next question.');
}

// ----- Submit interview -----
function submitInterview(){
  // ensure current question's transcript (if any) is processed
  if(finalTranscript.trim()){
    processAnswer(finalTranscript.trim());
  }

  // Build payload
  const payload = {
    timestamp: new Date().toISOString(),
    questions: interviewResults
  };

  // store in localStorage as JSON
  try{
    localStorage.setItem('aiMockInterviewData', JSON.stringify(payload));
    setStatus('Interview submitted. Redirecting to feedback...');
    // navigate to feedback page
    window.location.href = 'feedback.html';
  }catch(e){
    console.error('Storage error', e);
    setStatus('Failed to save interview results locally.');
  }
}

// ----- Wire events -----
landingStart?.addEventListener('click', () => { openLanding(); startCameraAndMic(); });
nextQuestionBtn?.addEventListener('click', nextQuestion);
submitInterviewBtn?.addEventListener('click', submitInterview);
startAnswerBtn?.addEventListener('click', startAnswer);
stopAnswerBtn?.addEventListener('click', stopAnswer);
camToggleBtn?.addEventListener('click', toggleCamera);
micToggleBtn?.addEventListener('click', toggleMic);

// ----- Init on load -----
document.addEventListener('DOMContentLoaded', () => {
  showQuestion();
  setStatus('Idle');
  // small compatibility checks
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) setStatus('Camera not supported in this browser.');
  // speech availability check
  if(!(window.SpeechRecognition || window.webkitSpeechRecognition)) {
    setStatus('Speech recognition not supported — try Chrome.');
    startAnswerBtn.disabled = true; stopAnswerBtn.disabled = true;
  }
});

