import {makeCard} from '../components/ui.js';

// Landing page with title, description and CTA
export function renderLanding(container, navigate){
  const card = makeCard();

  const hero = document.createElement('div');
  hero.className = 'hero';

  const intro = document.createElement('div');
  intro.className = 'intro';
  intro.innerHTML = `
    <h2>AI Mock Interview System</h2>
    <p class="muted">Practice interviews powered by AI — get instant feedback, emotion analysis, and suggested improvements. This is a static UI prototype.</p>
    <div class="cta">
      <button class="btn" id="start">Start Interview</button>
      <button class="btn secondary" id="learn">How it works</button>
    </div>
  `;

  const visual = document.createElement('div');
  visual.style.flex = '1';
  visual.innerHTML = `
    <div class="card" style="padding:18px;text-align:center">
      <div style="font-size:34px;color:var(--primary);">🎤</div>
      <div class="muted">Simulate an AI interviewer — answer aloud or type.</div>
    </div>
  `;

  hero.appendChild(intro);
  hero.appendChild(visual);
  card.appendChild(hero);

  container.appendChild(card);

  // interactions
  card.querySelector('#start').addEventListener('click', ()=>navigate('setup'));
  card.querySelector('#learn').addEventListener('click', ()=>alert('This is a UI prototype. Integrate with backend for real AI feedback.'));
}
