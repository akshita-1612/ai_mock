import {makeCard} from '../components/ui.js';
import {QUESTIONS} from '../data.js';

// Interview Setup page: choose type and difficulty
export function renderSetup(container, navigate){
  const card = makeCard();
  card.innerHTML = `
    <h3>Interview Setup</h3>
    <div class="muted">Choose the interview type and difficulty level below.</div>
    <div class="form-row" style="margin-top:16px">
      <div class="select-card">
        <label>Interview Type</label>
        <div class="option-list" id="types"></div>
      </div>
      <div class="select-card">
        <label>Difficulty</label>
        <div class="option-list" id="levels"></div>
      </div>
    </div>
    <div style="margin-top:16px;text-align:right">
      <button class="btn" id="begin">Start Interview</button>
    </div>
  `;

  container.appendChild(card);

  const types = Object.keys(QUESTIONS);
  const typesNode = card.querySelector('#types');
  types.forEach((t,i)=>{
    const b = document.createElement('div');
    b.className = 'option' + (i===0 ? ' active':'');
    b.textContent = t;
    b.dataset.type = t;
    b.addEventListener('click', ()=>{
      card.querySelectorAll('.option').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
    });
    typesNode.appendChild(b);
  });

  const levels = ['Easy','Medium','Hard'];
  const levelsNode = card.querySelector('#levels');
  levels.forEach((lv,i)=>{
    const b = document.createElement('div');
    b.className = 'option' + (i===1 ? ' active':'');
    b.textContent = lv;
    b.dataset.level = lv;
    b.addEventListener('click', ()=>{
      card.querySelectorAll('#levels .option').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
    });
    levelsNode.appendChild(b);
  });

  card.querySelector('#begin').addEventListener('click', ()=>{
    const type = card.querySelector('#types .option.active').dataset.type;
    const level = card.querySelector('#levels .option.active').dataset.level;
    // pass selected options in state
    navigate('interview', {type, level});
  });
}
