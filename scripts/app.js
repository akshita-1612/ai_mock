import {renderHeader} from './components/header.js';
import {renderLanding} from './pages/landing.js';
import {renderSetup} from './pages/setup.js';
import {renderInterview} from './pages/interview.js';
import {renderResults} from './pages/results.js';

const root = document.getElementById('app');

// Basic router: render different views inside the app container
const state = {};

function clearRoot(){
  root.innerHTML = '';
}

function navigate(page, opts){
  state.last = page;
  state.opts = opts || {};
  render(page, state.opts);
}

function render(page, opts={}){
  clearRoot();
  // header
  renderHeader(root, navigate);

  // main area
  const main = document.createElement('div');
  main.className = 'main-area';
  root.appendChild(main);

  // small fade transition
  setTimeout(()=>{
    if(page === 'landing' || !page){ renderLanding(main, navigate); }
    else if(page === 'setup'){ renderSetup(main, navigate); }
    else if(page === 'interview'){ renderInterview(main, navigate, opts); }
    else if(page === 'results'){ renderResults(main, navigate, opts); }
    else { renderLanding(main, navigate); }
  }, 80);
}

// initial
render('landing');

// Expose navigate for debugging
window.appNavigate = navigate;
