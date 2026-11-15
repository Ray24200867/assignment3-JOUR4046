const data = window.happinessCharts;
const peers = new Map([
  ['Hong Kong SAR of China', {name: '香港', flag: 'hk'}],
  ['Taiwan Province of China', {name: '台灣', flag: 'tw'}],
  ['Singapore', {name: '新加坡', flag: 'sg'}],
  ['Japan', {name: '日本', flag: 'jp'}],
  ['Republic of Korea', {name: '韓國', flag: 'kr'}],
]);
const observations = data.cs.filter(row => row.gdp > 0 && Number.isFinite(row.pred));
const asian = Array.from(peers.keys(), name => observations.find(row => row.country === name));
const hongKong = asian[0];
const meanGDP = observations.reduce((total, row) => total + row.gdp, 0) / observations.length;
const meanScore = observations.reduce((total, row) => total + row.score, 0) / observations.length;
const slope = observations.reduce((total, row) => total + (row.gdp - meanGDP) * (row.score - meanScore), 0) /
  observations.reduce((total, row) => total + (row.gdp - meanGDP) ** 2, 0);
const intercept = meanScore - slope * meanGDP;
const nameOf = row => peers.get(row.country)?.name || row.country;
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

function svgElement(tag, attributes, text) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  if (text !== undefined) element.textContent = text;
  return element;
}

function showChartTooltip(tooltip, point, label, details) {
  const marker = point.getBoundingClientRect();
  const area = tooltip.parentElement.getBoundingClientRect();
  const name = document.createElement('strong');
  name.textContent = label;
  tooltip.replaceChildren(name, document.createTextNode(details));
  tooltip.style.setProperty('--tooltip-x', `${marker.right - area.left + 8}px`);
  tooltip.style.top = `${Math.max(0, marker.top - area.top - 12)}px`;
  tooltip.hidden = false;
}

function mountGlobalFigure() {
  const plot = get('global-plot');
  const tooltip = get('global-tooltip');
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
      const show = () => showChartTooltip(tooltip, point, label, points);
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
  const tooltip = panel.querySelector('[data-scatter-tooltip]');
  const hideTooltip = () => { tooltip.hidden = true; };
  const indonesia = observations.find(row => row.country === 'Indonesia');
  const points = [...asian.map(row => ({row, ...peers.get(row.country)})), {row: indonesia, name: '印度尼西亞', flag: 'id'}];

  function renderScatter() {
    const compact = plot.clientWidth < 540;
    const w = compact ? 440 : 860;
    const h = compact ? 355 : 440;
    const [xMin, xMax] = [1.44,2.25];
    const [yMin, yMax] = [5.25,7.7];
    const left = 47, right = w - 22, top = 29, bottom = h - 59;
    const x = value => left + (right-left)*(value-xMin)/(xMax-xMin);
    const y = value => bottom - (bottom-top)*(value-yMin)/(yMax-yMin);
    const svg = svgElement('svg', {viewBox:`0 0 ${w} ${h}`, role:'group','aria-label':'人均 GDP 模型貢獻與生活評分散點圖'});
    const add = (tag, attrs, text) => svg.append(svgElement(tag, attrs, text));
    for (const tick of [5.5,6,6.5,7,7.5]) {
      add('line',{x1:left,x2:right,y1:y(tick),y2:y(tick),stroke:'#e5dfe6'});
      add('text',{x:left-10,y:y(tick)+4,'text-anchor':'end'},tick);
    }
    for (const tick of [1.5,1.6,1.7,1.8,1.9,2,2.1,2.2]) {
      add('text',{x:x(tick),y:bottom+23,'text-anchor':'middle'},tick);
    }
    add('text',{x:left,y:17,class:'axis-title'},'生活評分（0–10）');
    add('text',{x:(left+right)/2,y:h-10,'text-anchor':'middle',class:'axis-title'},'人均 GDP 的模型貢獻（分）');
    const start = Math.max(xMin,(yMin-intercept)/slope);
    const end = Math.min(xMax,(yMax-intercept)/slope);
    add('line',{x1:x(start),y1:y(intercept+slope*start),x2:x(end),y2:y(intercept+slope*end),stroke:'#68657f','stroke-width':2,'stroke-dasharray':'6 5'});
    for (const {row, name, flag} of points) {
      const flagWidth = compact ? 25 : 34;
      const flagHeight = flagWidth * .75;
      const labelBesideFlag = row.country === 'Republic of Korea';
      const labelPosition = labelBesideFlag
        ? {x: flagWidth / 2 + 5, y: 4, 'text-anchor': 'start'}
        : {x: 0, y: -flagHeight / 2 - 6, 'text-anchor': 'middle'};
      const comparison = row === hongKong || row === indonesia;
      const label = comparison ? `${name} ${decimal(row.score)}` : name;
      const point = svgElement('g', {
        class: 'scatter-flag',
        transform: `translate(${x(row.gdp)},${y(row.score)})`,
        tabindex: 0,
        role: 'button',
        'aria-label': `${name}，生活評分 ${decimal(row.score)} 分`,
      });
      point.append(
        svgElement('image', {x: -flagWidth / 2, y: -flagHeight / 2, width: flagWidth, height: flagHeight, href: `assets/flags/${flag}.svg`, 'aria-hidden': 'true'}),
        svgElement('text', {...labelPosition, class: comparison ? 'scatter-label is-comparison' : 'scatter-label'}, label),
      );
      const details = `GDP 模型貢獻 ${row.gdp.toFixed(3)} · 實際 ${decimal(row.score)} 分 · 預測 ${decimal(row.pred)} 分 · 差距 ${signed(row.score-row.pred)} 分`;
      const show = () => showChartTooltip(tooltip, point, name, details);
      point.addEventListener('pointerenter', show);
      point.addEventListener('pointerleave', hideTooltip);
      point.addEventListener('focus', show);
      point.addEventListener('blur', hideTooltip);
      point.addEventListener('click', show);
      point.addEventListener('keydown', event => {
        if (event.key === 'Escape') hideTooltip();
        if (event.key === 'Enter' || event.key === ' ') {event.preventDefault();show();}
      });
      svg.append(point);
    }
    svg.addEventListener('click', event => {
      if (!event.target.closest('.scatter-flag')) hideTooltip();
    });
    hideTooltip();
    plot.replaceChildren(svg);
  }

  let width;
  new ResizeObserver(([entry]) => {
    if (entry.contentRect.width === width) return;
    width = entry.contentRect.width;
    renderScatter();
  }).observe(plot);
}

function mountRegionalSteps(section) {
  const stage = section.querySelector('.income-story');
  const cards = Array.from(section.querySelectorAll('.regional-steps > p'));
  const enhanced = matchMedia('(min-width: 900px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)');
  let frame;
  function update() {
    frame = undefined;
    if (!enhanced.matches) return;
    const distance = Math.max(1, section.offsetHeight - stage.offsetHeight);
    const progress = Math.max(0, -section.getBoundingClientRect().top) / distance;
    const step = Math.min(cards.length - 1, Math.floor(progress * cards.length));
    cards.forEach((card, index) => card.classList.toggle('is-current', index === step));
  }
  function sync() {
    section.classList.toggle('has-scroll-steps', enhanced.matches);
    if (!enhanced.matches) return;
    update();
  }
  enhanced.addEventListener('change', sync);
  addEventListener('resize', sync);
  addEventListener('scroll', () => {
    if (enhanced.matches && frame === undefined) frame = requestAnimationFrame(update);
  }, {passive: true});
  sync();
}

mountGlobalFigure();
const regionalSection = get('hong-kong');
mountScatter(regionalSection);
mountRegionalSteps(regionalSection);

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
  const block = direction < 0 && next.classList.contains('has-scroll-steps') ? 'end' : 'start';
  next.scrollIntoView({block, behavior:'smooth'});
}, {passive:false});

const factors = {gdp: '人均 GDP', health: '健康預期壽命', social: '社會支援', freedom: '人生選擇自由', generosity: '慷慨程度', corruption: '貪腐觀感'};
const sixFactorTotal = row => Object.keys(factors).reduce((total, key) => total + row[key], 0);

function mountFactorBars() {
  const plot = get('factor-plot');
  const tooltip = get('factor-tooltip');
  const taiwan = asian[1];
  const categories = [
    ...Object.entries(factors).map(([key, label]) => ({label, scores: [hongKong[key], taiwan[key]]})),
    {label: '六項合計', scores: [sixFactorTotal(hongKong), sixFactorTotal(taiwan)]},
  ];
  const width = 900;
  const height = 340;
  const left = 48;
  const right = width - 16;
  const top = 28;
  const bottom = height - 43;
  const interval = (right - left) / categories.length;
  const y = value => bottom - (bottom - top) * value / 6.5;
  const svg = svgElement('svg', {viewBox: `0 0 ${width} ${height}`, role: 'group',
    'aria-label': '香港與台灣的六項模型貢獻及合計並排柱狀圖'});
  const draw = (tag, attrs, text) => svg.append(svgElement(tag, attrs, text));
  const divider = right - interval;
  draw('rect', {x: divider, y: top, width: interval, height: bottom - top, class: 'factor-total-bg'});
  draw('line', {x1: divider, x2: divider, y1: top, y2: bottom, class: 'factor-divider'});
  draw('text', {x: left, y: 16, class: 'axis-title'}, '模型貢獻（分）');
  for (const tick of [0, 1, 2, 3, 4, 5, 6]) {
    draw('line', {x1: left, x2: right, y1: y(tick), y2: y(tick), class: 'factor-gridline'});
    draw('text', {x: left - 9, y: y(tick) + 4, 'text-anchor': 'end'}, tick);
  }
  const hide = () => { tooltip.hidden = true; };
  categories.forEach(({label, scores}, index) => {
    const x = left + index * interval;
    const center = x + interval / 2;
    const difference = Math.round((scores[0] - scores[1]) * 1000);
    const gap = difference === 0 ? '兩地相同' : `${difference > 0 ? '香港' : '台灣'}高 ${(Math.abs(difference) / 1000).toFixed(3)} 分`;
    const details = `香港 ${scores[0].toFixed(3)} 分 · 台灣 ${scores[1].toFixed(3)} 分 · ${gap}`;
    const pair = svgElement('g', {class: 'factor-pair', role: 'button', tabindex: 0, 'aria-label': `${label}，${details}`});
    const marker = svgElement('rect', {x: x + 2, y: top, width: interval - 4, height: height - top - 5, rx: 5, class: 'factor-hit'});
    pair.append(marker);
    scores.forEach((score, i) => {
      const barX = center + (i === 0 ? -24 : 24);
      pair.append(
        svgElement('rect', {x: barX - 15, y: y(score), width: 30, height: bottom - y(score), rx: 2, class: i === 0 ? 'hk-bar' : 'tw-bar'}),
        svgElement('text', {x: barX, y: y(score) - 7, 'text-anchor': 'middle', class: 'factor-value'}, score.toFixed(3)),
      );
    });
    pair.append(svgElement('text', {x: center, y: bottom + 28, 'text-anchor': 'middle', class: 'factor-category'}, label));
    const show = () => showChartTooltip(tooltip, marker, label, details);
    pair.addEventListener('pointerenter', show);
    pair.addEventListener('pointerleave', hide);
    pair.addEventListener('focus', show);
    pair.addEventListener('blur', hide);
    pair.addEventListener('click', show);
    pair.addEventListener('keydown', event => {
      if (event.key === 'Escape') hide();
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); show(); }
    });
    svg.append(pair);
  });
  svg.addEventListener('click', event => {
    if (!event.target.closest('.factor-pair')) hide();
  });
  plot.addEventListener('scroll', hide, {passive: true});
  plot.append(svg);
}

mountFactorBars();
