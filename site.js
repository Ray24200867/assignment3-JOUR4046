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

const ladder = document.querySelector('[data-node-id="13:18"]');
const stairViewport = ladder.parentElement;
const stairButtons = Array.from(ladder.querySelectorAll('.ladder-choice'));
const stairFaces = Array.from(ladder.querySelectorAll('.ladder-surface'));
const ranking = window.happinessRanking;
const hongKongRankIndex = ranking.findIndex(row => row.rank === hongKong.rank);
const rankPage = get('ladder-rank');
const rankingNames = new Map([
  ['Afghanistan', '阿富汗'], ['Sierra Leone', '塞拉利昂'], ['Malawi', '馬拉維'],
  ['Zambia', '贊比亞'], ['Sri Lanka', '斯里蘭卡'], ['Ethiopia', '埃塞俄比亞'],
  ['Comoros', '科摩羅'], ['Cameroon', '喀麥隆'], ['South Africa', '南非'],
  ['Azerbaijan', '阿塞拜疆'], ['Niger', '尼日爾'], ['Croatia', '克羅地亞'],
  ['Malaysia', '馬來西亞'], ['Peru', '秘魯'], ['Mauritius', '毛里求斯'],
]);
const rankingName = row => rankingNames.get(row.name) || row.name;

function showLadderRank(score) {
  const position = ranking.filter(row => row.score > score).length;
  const above = ranking[position - 1];
  const below = ranking[position];
  const title = get('ladder-rank-title');
  title.textContent = `${score} 分，模擬排名第 ${position + 1} 位`;
  let comparison;
  if (!above) {
    comparison = `你的分數高於榜首的${rankingName(below)}。`;
  } else if (!below) {
    comparison = `你的分數低於榜末的${rankingName(above)}。`;
  } else if (below.score === score) {
    comparison = `你的分數與${rankingName(below)}相同。`;
  } else {
    comparison = `你的分數介於${rankingName(above)}與${rankingName(below)}之間。`;
  }
  get('ladder-rank-summary').textContent = comparison;

  const reader = {rank: position + 1, name: '你', score};
  const start = Math.max(0, position - 2);
  const end = Math.min(ranking.length, position + 2);
  const visible = [
    ...ranking.slice(start, position),
    reader,
    ...ranking.slice(position, end),
  ];
  const hongKongRank = ranking[hongKongRankIndex];
  if (hongKongRankIndex < start) {
    if (hongKongRankIndex < start - 1) visible.unshift(null);
    visible.unshift(hongKongRank);
  } else if (hongKongRankIndex >= end) {
    if (hongKongRankIndex > end) visible.push(null);
    visible.push(hongKongRank);
  }
  const rows = visible.map(row => {
    const tr = document.createElement('tr');
    if (!row) {
      tr.className = 'rank-gap';
      const cell = tr.insertCell();
      cell.colSpan = 3;
      cell.setAttribute('aria-label', '略過中間名次');
      cell.textContent = '⋯';
      return tr;
    }
    const isReader = row === reader;
    tr.classList.toggle('is-reader', isReader);
    tr.classList.toggle('is-hong-kong', row === hongKongRank);
    tr.insertCell().textContent = isReader ? `模擬第 ${row.rank} 位` : `第 ${row.rank} 位`;
    tr.insertCell().textContent = rankingName(row);
    tr.insertCell().textContent = isReader ? String(score) : row.score.toFixed(3);
    return tr;
  });
  get('ladder-rank-rows').replaceChildren(...rows);
  rankPage.hidden = false;
  document.documentElement.style.setProperty('--entry-offset', '56px');
  turningUntil = performance.now() + 440;
  title.focus({preventScroll: true});
  rankPage.scrollIntoView({block: 'start', behavior: motion.matches ? 'instant' : 'smooth'});
}

new ResizeObserver(([entry]) => {
  ladder.style.zoom = entry.contentRect.width / 560;
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
    showLadderRank(score);
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

function mountGlobalFigure() {
  const plot = get('global-plot');
  const tooltip = get('global-tooltip');
  const chart = plot.parentElement;
  const width = 960;
  const height = 510;
  const {left, right, top, bottom} = {left: 62, right: width - 24, top: 16, bottom: height - 52};
  const x = value => left + (right - left) * value / 2.3;
  const y = value => bottom - (bottom - top) * (value - 1) / 7;
  const prediction = value => intercept + slope * value;
  const svg = svgElement('svg', {viewBox: `0 0 ${width} ${height}`, role: 'group',
    'aria-label': '146 個國家和地區的生活評分與人均 GDP 模型貢獻散點圖'});
  const draw = (tag, attrs, content) => {
    const element = svgElement(tag, attrs, content);
    svg.append(element);
    return element;
  };
  for (const tick of [1, 2, 3, 4, 5, 6, 7, 8]) {
    draw('line', {x1: left, x2: right, y1: y(tick), y2: y(tick), class: 'global-gridline'});
    draw('text', {x: left - 8, y: y(tick) + 3.5, 'text-anchor': 'end', class: 'global-tick'}, tick);
  }
  for (const tick of [0, .5, 1, 1.5, 2]) {
    draw('text', {x: x(tick), y: bottom + 18, 'text-anchor': 'middle', class: 'global-tick'}, tick.toFixed(1));
  }
  draw('text', {x: (left + right) / 2, y: height - 8, 'text-anchor': 'middle', class: 'global-axis'},
    'Contribution of GDP per capita to the happiness score');
  draw('text', {transform: `translate(16,${(top + bottom) / 2}) rotate(-90)`, 'text-anchor': 'middle', class: 'global-axis'},
    'Life evaluation, 2025 (0–10)');
  draw('line', {x1: x(.15), x2: x(2.25), y1: y(prediction(.15)), y2: y(prediction(2.25)), class: 'global-fit'});
  draw('text', {x: x(.2), y: y(prediction(.2)) + 18, class: 'global-annotation'}, 'R² = 0.64');

  const caribbean = new Set(['Jamaica', 'Dominican Republic', 'Trinidad and Tobago']);
  const groups = {'other': [], 'latin-america': [], 'east-asia': []};
  for (const row of observations) {
    const latinAmerica = row.region === 'Latin America & Caribbean' && !caribbean.has(row.country);
    const group = peers.has(row.country) ? 'east-asia' : latinAmerica ? 'latin-america' : 'other';
    groups[group].push(row);
  }
  const labelOffsets = [
    ['Japan', 'Japan', -12, 4, 'end'],
    ['Republic of Korea', 'South Korea', 12, 12, 'start'],
    ['Hong Kong SAR of China', 'Hong Kong', 13, 5, 'start'],
    ['Taiwan Province of China', 'Taiwan', 0, -14, 'middle'],
    ['Singapore', 'Singapore', 13, 4, 'start'],
  ];
  const englishNames = new Map(labelOffsets.map(([key, label]) => [key, label]));
  const hide = () => { tooltip.hidden = true; };
  for (const [group, rows] of Object.entries(groups)) {
    for (const row of rows) {
      const label = englishNames.get(row.country) || row.country;
      const difference = signed(row.score - prediction(row.gdp));
      const points = `Life evaluation ${decimal(row.score)} · vs. income prediction ${difference}`;
      const point = draw('circle', {cx: x(row.gdp), cy: y(row.score),
        r: 2 + 8 * Math.sqrt(Math.max(0, row.health || 0) / 1.25),
        class: `point ${group}`, 'aria-label': `${label}, ${points}`});
      const show = () => {
        const marker = point.getBoundingClientRect();
        const area = chart.getBoundingClientRect();
        const name = document.createElement('strong');
        name.textContent = label;
        tooltip.replaceChildren(name, document.createTextNode(points));
        tooltip.style.setProperty('--tooltip-x', `${marker.right - area.left + 6}px`);
        tooltip.style.top = `${Math.max(0, marker.top - area.top - 12)}px`;
        tooltip.hidden = false;
      };
      point.addEventListener('pointerenter', show);
      point.addEventListener('pointerleave', hide);
      point.addEventListener('click', show);
      if (group === 'east-asia') {
        point.setAttribute('tabindex', '0');
        point.addEventListener('focus', show);
        point.addEventListener('blur', hide);
        point.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
      }
    }
  }
  for (const [key, label, dx, dy, anchor] of labelOffsets) {
    const row = asian.find(country => country.country === key);
    draw('text', {x: x(row.gdp) + dx, y: y(row.score) + dy, 'text-anchor': anchor, class: 'global-country-label'}, label);
  }
  draw('text', {x: x(hongKong.gdp) + 8, y: y(hongKong.score) + 26, 'text-anchor': 'end', class: 'global-annotation'},
    `Hong Kong: ${decimal(prediction(hongKong.gdp) - hongKong.score)} points below income prediction`);
  plot.append(svg);
  plot.addEventListener('scroll', hide, {passive: true});
}

function mountScatter(panel) {
  const plot = panel.querySelector('[data-scatter-plot]');
  const reading = panel.querySelector('[data-scatter-reading]');
  const controls = panel.querySelector('[data-scatter-controls]');
  const scene = panel.dataset.scene;
  let comparePair = scene === 'taiwan';
  let scatterView = comparePair ? 'peers' : 'world';
  let scatterChoice = scene === 'world' ? null : hongKong;

  function renderScatter() {
    const world = scatterView === 'world';
    const compact = plot.clientWidth < 540;
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
    if (comparePair) {
      const taiwan = asian[1];
      add('line',{x1:x(hongKong.gdp),x2:x(taiwan.gdp),y1:y(hongKong.score),y2:y(taiwan.score),stroke:color,'stroke-width':2,'stroke-dasharray':'4 3','pointer-events':'none'});
    } else if (scatterChoice) {
      add('line',{x1:x(scatterChoice.gdp),x2:x(scatterChoice.gdp),y1:y(scatterChoice.score),y2:y(scatterChoice.pred),stroke:color,'stroke-width':2,'pointer-events':'none'});
    }
    const points = world ? [...observations.filter(row => !peers.has(row.country)), ...asian] : asian;
    function showPoint(row) {
      if (!row) {
        reading.textContent = '146 個國家和地區 · 虛線是按人均 GDP 指標估計的生活評分';
        return;
      }
      reading.textContent = `${nameOf(row)}　實際 ${decimal(row.score)} 分 · 預測 ${decimal(row.pred)} 分 · 差距 ${signed(row.score-row.pred)} 分`;
    }
    for (const row of points) {
      const highlighted = row === scatterChoice || (comparePair && row === asian[1]);
      const peer = peers.has(row.country);
      const point = svgElement('circle',{class:'point',cx:x(row.gdp),cy:y(row.score),r:highlighted?8:peer?6:4,fill:highlighted?color:peer?'#5e648f':'#b9b5c3','aria-label':`${nameOf(row)}，${decimal(row.score)} 分`});
      if (peer) {point.setAttribute('tabindex','0');point.setAttribute('role','button');}
      const choose = () => {
        const hadFocus = document.activeElement === point;
        comparePair = false;
        scatterChoice = row;
        renderScatter();
        if (hadFocus && peer) {
          plot.querySelector(`[data-peer="${asian.indexOf(row)}"]`)?.focus({preventScroll:true});
        }
      };
      if (peer) point.dataset.peer = asian.indexOf(row);
      point.addEventListener('pointerenter', () => showPoint(row));
      point.addEventListener('pointerleave', restoreReading);
      point.addEventListener('focus', () => showPoint(row));
      point.addEventListener('blur', restoreReading);
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
    plot.replaceChildren(svg);
    restoreReading();
    function restoreReading() {
      if (comparePair) reading.textContent = '香港 5.57 分 · 台灣 6.71 分 · 相差約 1.15 分';
      else showPoint(scatterChoice);
    }
  }

  controls.addEventListener('click', event => {
    const button = event.target.closest('button[data-view]');
    if (!button) return;
    scatterView = button.dataset.view;
    comparePair = scene === 'taiwan' && scatterView === 'peers';
    if (comparePair || (scatterView === 'peers' && !peers.has(scatterChoice?.country))) scatterChoice = hongKong;
    selectControl(controls, 'view', scatterView);
    renderScatter();
  });
  selectControl(controls, 'view', scatterView);
  let width;
  new ResizeObserver(([entry]) => {
    if (entry.contentRect.width === width) return;
    width = entry.contentRect.width;
    renderScatter();
  }).observe(plot);
}

mountGlobalFigure();
document.querySelectorAll('.income-panel').forEach(mountScatter);

const readingPages = Array.from(document.querySelectorAll('main > section'));
const entrance = new IntersectionObserver(entries => {
  for (const entry of entries) entry.target.classList.toggle('page-arrived', entry.isIntersecting);
}, {rootMargin:'-42% 0px -42% 0px'});
readingPages.filter(page => page.id !== 'cover').forEach(page => entrance.observe(page));

const motion = matchMedia('(prefers-reduced-motion: reduce)');
let lastWheel = -Infinity;
let wheelTravel = 0;
let wheelDirection = 0;
let pageTurned = false;
let turningUntil = 0;

addEventListener('wheel', event => {
  if (motion.matches || event.ctrlKey || event.metaKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;

  const direction = Math.sign(event.deltaY);
  const now = performance.now();
  if (now - lastWheel > 190 || direction !== wheelDirection) {
    wheelTravel = 0;
    pageTurned = false;
  }
  lastWheel = now;
  wheelDirection = direction;
  if (pageTurned || now < turningUntil) {
    event.preventDefault();
    return;
  }

  const middle = innerHeight / 2;
  const visiblePages = readingPages.filter(page => !page.hidden);
  const index = visiblePages.findIndex(page => {
    const {top, bottom} = page.getBoundingClientRect();
    return top <= middle && bottom > middle;
  });
  const current = visiblePages[index];
  const next = visiblePages[index + direction];
  if (!current || !next) return;
  const {top, bottom, height} = current.getBoundingClientRect();
  // Keep regular scrolling inside any section that exceeds the viewport.
  if (height > innerHeight + 3 && (direction > 0 ? bottom > innerHeight + 3 : top < -3)) return;

  event.preventDefault();
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
  wheelTravel += Math.abs(event.deltaY) * unit;
  if (wheelTravel < 24) return;

  pageTurned = true;
  turningUntil = now + 440;
  document.documentElement.style.setProperty('--entry-offset', direction > 0 ? '56px' : '-56px');
  next.scrollIntoView({block:'start', behavior:'smooth'});
}, {passive:false});

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
