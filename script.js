// ================================
// PAGE SWITCHER
// ================================
function go(id) {
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
  document.getElementById('pg-' + id).classList.add('active');
  window.scrollTo(0, 0);
  if (id === 'hall') renderBoard();
}

// ================================
// STATE
// ================================
var current = null; // { thing, num, unit, translation, step }

// ================================
// TRANSLATION GENERATOR
// ================================
var OPENERS = [
  "Listen.","Okay.","Here's the truth:","Breathe.","Hey.","Look —"
];
var VALIDATIONS = [
  "{n} {u} is a long time to carry something around.",
  "{n} {u} of avoiding {thing} is also {n} {u} of caring about it. You don't avoid things you don't care about.",
  "You have been almost-doing {thing} for {n} {u}. That counts for more than nothing.",
  "{n} {u} ago, you wanted to do {thing}. You still do. That part hasn't expired."
];
var REASSURANCES = [
  "Time spent avoiding doesn't disqualify you. It just means today gets to be the day.",
  "You haven't fallen behind. You've been waiting for a softer entrance — and this is it.",
  "Nobody is keeping score. The doors are still open.",
  "Starting late is still starting. And starting is the whole thing."
];
var STEPS_GENERIC = [
  "Open the thing. Don't do it. Just open it.",
  "Set a timer for five minutes and do the smallest possible version of {thing}.",
  "Write down the very first physical action {thing} requires. One line.",
  "Put on your shoes / open the tab / get the notebook. Stop there if you want.",
  "Do {thing} badly for 3 minutes. Badly counts."
];

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function fill(tpl, data){
  return tpl
    .replace(/{thing}/g, data.thing)
    .replace(/{n}/g, data.num)
    .replace(/{u}/g, data.unit);
}

function generate(thing, num, unit) {
  var data = { thing: thing, num: num, unit: unit };
  var translation =
    pick(OPENERS) + " " +
    fill(pick(VALIDATIONS), data) + " " +
    pick(REASSURANCES);
  var step = fill(pick(STEPS_GENERIC), data);
  return { translation: translation, step: step };
}

// ================================
// SCREEN 1 → SCREEN 2
// ================================
function doTranslate() {
  var thing = document.getElementById('inp-thing').value.trim() || 'going to the gym';
  var num = parseInt(document.getElementById('inp-num').value, 10) || 1;
  var unit = document.getElementById('inp-unit').value;

  var out = generate(thing, num, unit);
  current = { thing: thing, num: num, unit: unit, translation: out.translation, step: out.step };

  document.getElementById('out-confession').textContent =
    '"I have been avoiding ' + thing + ' for ' + num + ' ' + unit + '."';
  document.getElementById('out-translation').textContent = out.translation;
  document.getElementById('out-step').textContent = out.step;

  go('output');
}

// ================================
// SHARE TO HALL
// ================================
function loadBoard() {
  try { return JSON.parse(localStorage.getItem('almost_board') || '[]'); }
  catch(e) { return []; }
}
function saveBoard(arr) {
  localStorage.setItem('almost_board', JSON.stringify(arr));
}
function shareToHall() {
  if (!current) return;
  var board = loadBoard();
  board.unshift({
    id: Date.now(),
    thing: current.thing,
    num: current.num,
    unit: current.unit,
    translation: current.translation,
    step: current.step
  });
  saveBoard(board);
  go('hall');
}

// ================================
// HALL OF ALMOST — RENDER
// ================================
var NOTE_COLORS = ['#F4A4A4','#C9B6F0','#FFE873','#A8E0A0','#9EC9F0','#F5B591','#FFD27A','#F5B0D2','#E2E2E2'];

function renderBoard() {
  var board = loadBoard();
  var el = document.getElementById('board');
  document.getElementById('hall-count').textContent = board.length + (board.length === 1 ? ' entry' : ' entries');

  if (board.length === 0) {
    el.innerHTML = '<div class="empty-board">// no almosts yet. be the first.</div>';
    return;
  }

  el.innerHTML = '';
  board.forEach(function(item, i){
    var n = document.createElement('div');
    n.className = 'note';
    n.style.background = NOTE_COLORS[i % NOTE_COLORS.length];
    var rot = ((i * 37) % 7) - 3; // -3 .. +3 deg, deterministic
    n.style.transform = 'rotate(' + rot + 'deg)';
    n.textContent = item.thing;
    n.onclick = function(){ openModal(item); };
    el.appendChild(n);
  });
}

// ================================
// MODAL
// ================================
function openModal(item) {
  document.getElementById('modal-from').textContent = 'From: someone — ' + item.num + ' ' + item.unit;
  document.getElementById('modal-confession').textContent =
    '"I have been avoiding ' + item.thing + ' for ' + item.num + ' ' + item.unit + '."';
  document.getElementById('modal-translation').textContent = item.translation;
  document.getElementById('modal-step').textContent = item.step;
  document.getElementById('modal').classList.add('open');
}
function closeModal(e) {
  if (e && e.target && !e.target.classList.contains('modal-overlay')) {
    if (e.type === 'click' && e.target.tagName !== 'BUTTON') return;
  }
  document.getElementById('modal').classList.remove('open');
}

// ================================
// TIMER — 5 MINUTES
// ================================
var TIMER_TOTAL = 5 * 60;
var timerLeft = TIMER_TOTAL;
var timerInt = null;
var timerRunning = false;

function fmt(s){
  var m = Math.floor(s/60);
  var ss = s % 60;
  return m + ':' + (ss < 10 ? '0' : '') + ss;
}
function renderTimer(){
  var d = document.getElementById('timer-display');
  d.textContent = fmt(timerLeft);
  if (timerLeft === 0) d.classList.add('done'); else d.classList.remove('done');
}
function startTimer() {
  document.getElementById('timer-step').textContent =
    current ? '"' + current.step + '"' : 'five minutes. start small.';
  resetTimer();
  go('timer');
}
function toggleTimer() {
  var btn = document.getElementById('timer-btn');
  if (timerRunning) {
    clearInterval(timerInt);
    timerRunning = false;
    btn.textContent = 'resume';
    return;
  }
  if (timerLeft === 0) resetTimer();
  timerRunning = true;
  btn.textContent = 'pause';
  timerInt = setInterval(function(){
    timerLeft--;
    renderTimer();
    if (timerLeft <= 0) {
      clearInterval(timerInt);
      timerRunning = false;
      btn.textContent = 'done';
    }
  }, 1000);
}
function resetTimer() {
  clearInterval(timerInt);
  timerRunning = false;
  timerLeft = TIMER_TOTAL;
  document.getElementById('timer-btn').textContent = 'start';
  renderTimer();
}
renderTimer();
