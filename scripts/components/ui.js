// UI helpers: small utilities for building UI elements and animations
export function makeCard(){
  const c = document.createElement('div');
  c.className = 'card fade-in';
  return c;
}

export function showLoading(container, message = 'Loading...'){
  const node = document.createElement('div');
  node.className = 'center';
  node.style.gap = '10px';
  node.innerHTML = `<div class="loading" aria-hidden></div><div class="muted">${message}</div>`;
  container.appendChild(node);
  return () => { node.remove(); };
}
