// Header component: shows brand and simple nav
export function renderHeader(container, navigate){
  const el = document.createElement('div');
  el.className = 'site-header';

  const brand = document.createElement('div');
  brand.className = 'brand';
  brand.innerHTML = `
    <div class="logo">AI</div>
    <div>
      <h1>AI Mock Interview System</h1>
      <div class="muted">Practice interviews with AI-driven feedback (UI prototype)</div>
    </div>
  `;

  const actions = document.createElement('div');
  actions.className = 'header-actions';
  const startBtn = document.createElement('button');
  startBtn.className = 'btn';
  startBtn.textContent = 'Start Interview';
  startBtn.addEventListener('click', ()=>navigate('setup'));

  actions.appendChild(startBtn);
  el.appendChild(brand);
  el.appendChild(actions);

  container.appendChild(el);
}
