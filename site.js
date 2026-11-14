const data = window.happinessCharts;
const peers = new Map([
  ['Hong Kong SAR of China', '香港'], ['Taiwan Province of China', '台灣'],
  ['Singapore', '新加坡'], ['Japan', '日本'], ['Republic of Korea', '韓國'],
]);
const observations = data.cs.filter(row => row.gdp > 0 && Number.isFinite(row.pred));
const asian = Array.from(peers.keys(), name => observations.find(row => row.country === name));
const hongKong = asian[0];
const meanGDP = observations.reduce((total, row) => total + row.gdp, 0) / observations.length;
const meanScore = observations.reduce((total, row) => total + row.score, 0) / observations.length;
const slope = observations.reduce((total, row) => total + (row.gdp - meanGDP) * (row.score - meanScore), 0) /
  observations.reduce((total, row) => total + (row.gdp - meanGDP) ** 2, 0);
const intercept = meanScore - slope * meanGDP;
const nameOf = row => peers.get(row.country) || row.country;
const decimal = value => (Math.round((value + Number.EPSILON) * 100) / 100).toFixed(2);
const signed = value => (value < 0 ? '−' : '+') + decimal(Math.abs(value));
const get = id => document.getElementById(id);

const header = document.querySelector('.site-header');
const anchors = Array.from(header.querySelectorAll('nav a'));
const sections = anchors.map(anchor => document.querySelector(anchor.hash));
function trackReading() {
  const distance = document.documentElement.scrollHeight - innerHeight;
  header.style.setProperty('--progress', distance > 0 ? Math.max(0, Math.min(1, scrollY / distance)) : 0);
  const active = sections.findLastIndex(section => section.getBoundingClientRect().top <= 145);
  anchors.forEach((anchor, index) => {
    if (index === active) anchor.setAttribute('aria-current', 'location');
    else anchor.removeAttribute('aria-current');
  });
}
addEventListener('scroll', trackReading, {passive:true});
addEventListener('resize', trackReading);
trackReading();

const ladder = document.querySelector('[data-node-id="13:18"]');
const stairViewport = ladder.parentElement;
const stairButtons = Array.from(ladder.querySelectorAll('.ladder-choice'));
const stairFaces = Array.from(ladder.querySelectorAll('.ladder-surface'));
new ResizeObserver(([entry]) => {
  ladder.style.zoom = Math.min(1, entry.contentRect.width / 560);
}).observe(stairViewport);
for (const face of stairFaces) {
  const button = stairButtons.find(item => item.dataset.score === face.dataset.stepSurface);
  face.addEventListener('click', () => button.click());
  const highlight = on => face.classList.toggle('is-preview', on);
  face.addEventListener('pointerenter', () => highlight(true));
  face.addEventListener('pointerleave', () => highlight(false));
  button.addEventListener('focus', () => highlight(true));
  button.addEventListener('blur', () => highlight(false));
  button.addEventListener('click', () => {
    const score = Number(button.dataset.score);
    stairButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    stairFaces.forEach(item => item.classList.toggle('is-selected', item === face));
    get('your-score').textContent = score;
    get('score-label').textContent = '你的生活評分';
    const difference = score - hongKong.score;
    get('score-comparison').textContent = `比香港平均的 ${decimal(hongKong.score)} 分${difference >= 0 ? '高' : '低'} ${decimal(Math.abs(difference))} 分。`;
  });
}

function selectControl(container, key, value) {
  container.querySelectorAll('button').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset[key] === value));
  });
}
function svgElement(tag, attributes, text) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  if (text !== undefined) element.textContent = text;
  return element;
}

let scatterView = 'world';
let scatterChoice = hongKong;
function renderScatter() {
  const world = scatterView === 'world';
  const compact = get('scatter').clientWidth < 540;
  const w = compact ? 440 : 860;
  const h = compact ? 355 : 440;
  const [xMin, xMax] = world ? [0,2.35] : [1.78,2.25];
  const [yMin, yMax] = world ? [1,8] : [5.25,7.7];
  const left = 47, right = w - 22, top = 29, bottom = h - 59;
  const x = value => left + (right-left)*(value-xMin)/(xMax-xMin);
  const y = value => bottom - (bottom-top)*(value-yMin)/(yMax-yMin);
  const svg = svgElement('svg', {viewBox:`0 0 ${w} ${h}`, role:'group','aria-label':'人均 GDP 模型貢獻與生活評分散點圖'});
  const add = (tag, attrs, text) => svg.append(svgElement(tag, attrs, text));
  const color = '#973c70';
  for (const tick of world ? [1,2,3,4,5,6,7,8] : [5.5,6,6.5,7,7.5]) {
    add('line',{x1:left,x2:right,y1:y(tick),y2:y(tick),stroke:'#e5dfe6'});
    add('text',{x:left-10,y:y(tick)+4,'text-anchor':'end'},tick);
  }
  for (const tick of world ? [0,.5,1,1.5,2] : [1.8,1.9,2,2.1,2.2]) {
    add('text',{x:x(tick),y:bottom+23,'text-anchor':'middle'},tick);
  }
  add('text',{x:left,y:17,class:'axis-title'},'生活評分（0–10）');
  add('text',{x:(left+right)/2,y:h-10,'text-anchor':'middle',class:'axis-title'},'人均 GDP 的模型貢獻（分）');
  const start = Math.max(xMin,(yMin-intercept)/slope);
  const end = Math.min(xMax,(yMax-intercept)/slope);
  add('line',{x1:x(start),y1:y(intercept+slope*start),x2:x(end),y2:y(intercept+slope*end),stroke:'#68657f','stroke-width':2,'stroke-dasharray':'6 5'});
  add('line',{x1:x(scatterChoice.gdp),x2:x(scatterChoice.gdp),y1:y(scatterChoice.score),y2:y(scatterChoice.pred),stroke:color,'stroke-width':2,'pointer-events':'none'});
  const points = world ? [...observations.filter(row => !peers.has(row.country)), ...asian] : asian;
  const reading = get('scatter-reading');
  function showPoint(row) {
    reading.textContent = `${nameOf(row)}　實際 ${decimal(row.score)} 分 · 預測 ${decimal(row.pred)} 分 · 差距 ${signed(row.score-row.pred)} 分`;
  }
  for (const row of points) {
    const highlighted = row === scatterChoice;
    const peer = peers.has(row.country);
    const point = svgElement('circle',{class:'point',cx:x(row.gdp),cy:y(row.score),r:highlighted?8:peer?6:4,fill:highlighted?color:peer?'#5e648f':'#b9b5c3','aria-label':`${nameOf(row)}，${decimal(row.score)} 分`});
    if (peer) {point.setAttribute('tabindex','0');point.setAttribute('role','button');}
    const choose = () => {
      const hadFocus = document.activeElement === point;
      scatterChoice = row;
      renderScatter();
      if (hadFocus && peer) {
        get('scatter').querySelector(`[data-peer="${asian.indexOf(row)}"]`)?.focus({preventScroll:true});
      }
    };
    if (peer) point.dataset.peer = asian.indexOf(row);
    point.addEventListener('pointerenter', () => showPoint(row));
    point.addEventListener('pointerleave', () => showPoint(scatterChoice));
    point.addEventListener('focus', () => showPoint(row));
    point.addEventListener('blur', () => showPoint(scatterChoice));
    point.addEventListener('click', choose);
    point.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {event.preventDefault();choose();}
    });
    svg.append(point);
    if (highlighted || !world) {
      const align = x(row.gdp) > right - 80 ? 'end' : 'start';
      add('text',{x:x(row.gdp)+(align==='end'?-11:11),y:y(row.score)-8,'text-anchor':align,'pointer-events':'none',class:'axis-title'},nameOf(row));
    }
  }
  get('scatter').replaceChildren(svg);
  showPoint(scatterChoice);
}
get('scatter-controls').addEventListener('click', event => {
  const button = event.target.closest('button[data-view]');
  if (!button) return;
  scatterView = button.dataset.view;
  if (scatterView === 'peers' && !peers.has(scatterChoice.country)) scatterChoice = hongKong;
  selectControl(event.currentTarget,'view',scatterView);
  renderScatter();
});
new ResizeObserver(renderScatter).observe(get('scatter'));

function createRow(row, plot, onSelect, trackItems) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'data-row';
  const label = document.createElement('span');
  label.textContent = nameOf(row);
  const track = document.createElement('span');
  track.className = 'track';
  track.setAttribute('aria-hidden','true');
  const parts = trackItems.map(className => {
    const item = document.createElement('i');
    item.className = className;
    track.append(item);
    return item;
  });
  const number = document.createElement('span');
  button.append(label,track,number);
  button.addEventListener('click', onSelect);
  plot.append(button);
  return {row,button,number,parts};
}

let model = 'six';
let modelChoice = hongKong;
const modelRows = asian.map(row => createRow(row,get('model-plot'),() => {
  modelChoice = row; updateModel();
},['connector','marker','marker expected']));
function updateModel() {
  const scale = value => (value-5)/2.6*100;
  for (const {row,button,number,parts:[line,actualDot,expectedDot]} of modelRows) {
    const expected = model === 'income' ? row.pred : row.gdp+row.social+row.health+row.freedom+row.generosity+row.corruption+1.16;
    const actual = row.score;
    button.setAttribute('aria-pressed',String(row===modelChoice));
    button.setAttribute('aria-label',`${nameOf(row)}，實際 ${decimal(actual)}，預測 ${decimal(expected)}`);
    number.textContent = signed(actual-expected)+' 分';
    line.style.left = scale(Math.min(actual,expected))+'%';
    line.style.width = (scale(Math.max(actual,expected))-scale(Math.min(actual,expected)))+'%';
    actualDot.style.left = scale(actual)+'%';
    expectedDot.style.left = scale(expected)+'%';
    if (row===modelChoice) get('model-reading').textContent = `${nameOf(row)}　實際 ${decimal(actual)} 分 · ${model==='income'?'GDP 指標':'六項因素'}預測 ${decimal(expected)} 分 · 差距 ${signed(actual-expected)} 分`;
  }
}
get('model-controls').addEventListener('click', event => {
  const button = event.target.closest('button[data-model]');
  if (!button) return;
  model = button.dataset.model;
  selectControl(event.currentTarget,'model',model);
  updateModel();
});
updateModel();

const factors = {gdp:'人均 GDP',health:'健康預期壽命',social:'社會支援',freedom:'人生選擇自由',generosity:'慷慨程度',corruption:'貪腐觀感'};
let factor = 'social';
let factorChoice = hongKong;
const factorRows = asian.map(row => createRow(row,get('factor-plot'),() => {
  factorChoice = row; updateFactors();
},['factor-bar']));
for (const [key,label] of Object.entries(factors)) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.factor = key;
  button.textContent = label;
  get('factor-controls').append(button);
}
function updateFactors() {
  const highest = Math.max(...asian.map(row=>row[factor]));
  for (const {row,button,number,parts:[bar]} of factorRows) {
    button.setAttribute('aria-pressed',String(row===factorChoice));
    number.textContent = row[factor].toFixed(3);
    bar.style.width = row[factor]/highest*100+'%';
  }
  const rank = 1 + asian.filter(row=>row[factor]>factorChoice[factor]).length;
  get('factor-reading').textContent = `${nameOf(factorChoice)}　${factors[factor]}的模型貢獻為 ${factorChoice[factor].toFixed(3)} 分，在圖中五地排第 ${rank}。`;
}
get('factor-controls').addEventListener('click',event => {
  const button=event.target.closest('button[data-factor]');
  if (!button) return;
  factor=button.dataset.factor;
  selectControl(event.currentTarget,'factor',factor);
  updateFactors();
});
selectControl(get('factor-controls'),'factor',factor);
updateFactors();
