import {makeCard} from '../components/ui.js';
import {SAMPLE_RESULTS} from '../data.js';

// Results dashboard UI-only (static charts and suggestions)
export function renderResults(container, navigate, opts={}){
  const data = SAMPLE_RESULTS;
  const card = makeCard();

  card.innerHTML = `
    <h3>Interview Results</h3>
    <div class="muted">Summary of your mock interview (UI-only, static data)</div>
    <div class="results-grid" style="margin-top:14px">
      <div class="card">
        <div><strong>Score</strong></div>
        <div style="font-size:34px;color:var(--primary);margin-top:8px">${data.score}%</div>
        <div class="muted" style="margin-top:8px">Confidence</div>
        <div style="display:flex;align-items:center;gap:12px;margin-top:8px"><div style="flex:1"><div class="progress"><i style="width:${data.confidence}%"></i></div></div><div><strong>${data.confidence}%</strong></div></div>
      </div>
      <div class="card">
        <div><strong>Emotion Analysis</strong></div>
        <div style="margin-top:8px" id="emotionBars"></div>
      </div>
      <div class="card">
        <div><strong>Strengths</strong></div>
        <ul id="strengths"></ul>
      </div>
      <div class="card">
        <div><strong>Suggestions</strong></div>
        <ul id="improvements"></ul>
      </div>
    </div>
    <div style="margin-top:14px;text-align:right"><button class="btn" id="retake">Retake Interview</button></div>
  `;

  container.appendChild(card);

  // populate lists
  const strengthsNode = card.querySelector('#strengths');
  data.strengths.forEach(s=>{ const li = document.createElement('li'); li.textContent = s; strengthsNode.appendChild(li); });

  const impNode = card.querySelector('#improvements');
  data.improvements.forEach(s=>{ const li = document.createElement('li'); li.textContent = s; impNode.appendChild(li); });

  const emoRoot = card.querySelector('#emotionBars');
  Object.entries(data.emotions).forEach(([k,v])=>{
    const row = document.createElement('div');
    row.style.display = 'flex'; row.style.alignItems='center'; row.style.gap='8px'; row.style.marginTop='8px';
    row.innerHTML = `<div style="width:96px;text-transform:capitalize" class="muted">${k}</div><div style="flex:1"><div class="progress"><i style="width:${v}%"></i></div></div><div style="width:36px;text-align:right">${v}%</div>`;
    emoRoot.appendChild(row);
  });

  card.querySelector('#retake').addEventListener('click', ()=>navigate('setup'));
}
