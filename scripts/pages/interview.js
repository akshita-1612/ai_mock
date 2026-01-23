import {makeCard, showLoading} from '../components/ui.js';
import {QUESTIONS} from '../data.js';

// Render the interview page: step through questions, simulate recording
export function renderInterview(container, navigate, opts={}){
  const {type='Technical', level='Medium'} = opts;
  const card = makeCard();

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.innerHTML = `<div><strong>${type} Interview</strong> <span class="muted">· ${level}</span></div><div class="muted">Question progress</div>`;

  const stage = document.createElement('div');
  stage.className = 'interview-stage';

  const qPanel = document.createElement('div');
  qPanel.className = 'question-panel';
  qPanel.innerHTML = `<div class="question" id="questionText"></div>
    <div class="transcript" id="transcript">Transcribed answer will appear here (placeholder)</div>
    <div style="margin-top:12px">
      <button class="btn mic-btn" id="micBtn"><span id="micIcon">🎤</span> <span id="micText">Start Recording</span></button>
      <button class="btn secondary" id="stopBtn" style="margin-left:8px">Stop</button>
    </div>
  `;

  const controls = document.createElement('div');
  controls.className = 'controls';
  controls.innerHTML = `<div class="card"> <div class="muted">Progress</div><div class="progress" style="margin-top:8px"><i id="progressBar" style="width:0%"></i></div><div style="margin-top:12px;text-align:right"><button class="btn" id="nextBtn">Next Question</button></div></div>`;

  stage.appendChild(qPanel);
  stage.appendChild(controls);

  card.appendChild(header);
  card.appendChild(stage);
  container.appendChild(card);

  // State
  const list = QUESTIONS[type] || [];
  let idx = 0;
  let recording = false;

  const qText = card.querySelector('#questionText');
  const transcript = card.querySelector('#transcript');
  const micBtn = card.querySelector('#micBtn');
  const micIcon = card.querySelector('#micIcon');
  const micText = card.querySelector('#micText');
  const stopBtn = card.querySelector('#stopBtn');
  const nextBtn = card.querySelector('#nextBtn');
  const progressBar = card.querySelector('#progressBar');

  function renderQuestion(){
    qText.textContent = list[idx] || 'No more questions';
    progressBar.style.width = `${Math.round((idx/list.length)*100)}%`;
    transcript.textContent = 'Transcribed answer will appear here (placeholder)';
  }

  function toggleRecording(){
    recording = !recording;
    if(recording){
      micBtn.classList.remove('off');
      micIcon.textContent = '🔴';
      micText.textContent = 'Recording...';
    } else {
      micBtn.classList.add('off');
      micIcon.textContent = '🎤';
      micText.textContent = 'Start Recording';
      // Simulate transcription result when stopping
      transcript.textContent = '"This is a simulated transcribed answer for demo purposes."';
    }
  }

  micBtn.addEventListener('click', ()=>{
    toggleRecording();
  });
  stopBtn.addEventListener('click', ()=>{
    if(recording) toggleRecording();
  });

  nextBtn.addEventListener('click', ()=>{
    // show a loading animation briefly to simulate processing
    const hide = showLoading(card, 'Evaluating answer...');
    nextBtn.disabled = true;
    setTimeout(()=>{
      hide();
      nextBtn.disabled = false;
      idx += 1;
      if(idx >= list.length){
        // finished
        navigate('results', {type, level});
      } else {
        renderQuestion();
      }
    }, 900);
  });

  // initial render
  renderQuestion();
}
