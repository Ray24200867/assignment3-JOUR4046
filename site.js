const pageProgress = document.querySelector('[data-node-id="63:18"]');
function updateProgress() {
  const distance = document.documentElement.scrollHeight - innerHeight;
  const progress = distance > 0 ? Math.min(100, Math.max(0, scrollY / distance * 100)) : 0;
  pageProgress.style.setProperty('--progress', progress + '%');
}
addEventListener('scroll', updateProgress, { passive: true });
addEventListener('resize', updateProgress);
updateProgress();

const steps = Array.from(document.querySelectorAll('.ladder-choice')).reverse();
const stepSurfaces = Array.from(document.querySelectorAll('.ladder-surface'));
const hint = document.querySelector('[data-node-id="13:130"]');
const defaultHint = hint.textContent.trim();
const ranking = document.querySelector('[data-node-id="23:14"]');
const rows = ranking.querySelector('[data-node-id="23:28"]');
const resultHeading = ranking.querySelector('[data-node-id="23:18"]');
const resultDetail = ranking.querySelector('[data-node-id="23:20"]');
const labels = ['最差的生活', '極困難', '很困難', '困難', '偏差', '一般', '尚可', '良好', '很好', '非常好', '最好的生活'];
let selectedScore;
hint.setAttribute('aria-live', 'polite');

function showHint(score) {
  hint.textContent = score === undefined ? defaultHint : score + ' 分 · ' + labels[score];
  for (const surface of stepSurfaces) {
    surface.classList.toggle('is-preview', Number(surface.dataset.stepSurface) === score);
  }
}
function renderRanking(score) {
  const countries = window.happinessRanking;
  if (!countries?.length) return;
  const insertion = countries.findIndex(country => country.score < score);
  const rankIndex = insertion < 0 ? countries.length : insertion;
  const line = document.querySelector('[data-node-id="19:20"]');
  const answer = document.querySelector('[data-node-id="19:16"]');
  const callout = document.querySelector('[data-node-id="19:17"]');
  const x = 24.6 + 93.3 * score;
  line.style.left = x + 'px';
  answer.style.left = Math.max(4, x - 15) + 'px';
  callout.style.left = Math.min(786, x + 11) + 'px';
  answer.textContent = '你：' + score;
  callout.firstElementChild.textContent = '高於 ' + countries.length + ' 個地方中的 ' + (countries.length - rankIndex) + ' 個';

  const above = countries.slice(Math.max(0, rankIndex - 10), rankIndex);
  const below = countries.slice(rankIndex, rankIndex + 10);
  resultHeading.textContent = '你的 ' + score + ' 分排在第 ' + (rankIndex + 1) + ' 位';
  resultDetail.textContent = '把你的答案和報告中 ' + countries.length + ' 個地方的平均分比較，下表顯示與你最接近的排名。';

  const makeRow = (rank, country, value, difference, style) => {
    const row = document.createElement('div');
    row.className = 'ranking-row ' + style;
    row.dataset.name = 'Row';
    [rank, country, value, difference].forEach(text => {
      const cell = document.createElement('p');
      cell.textContent = text;
      row.append(cell);
    });
    return row;
  };
  const countryRow = (country, index) => {
    const difference = country.score - score;
    return makeRow(country.rank, country.name, country.score.toFixed(2), (difference >= 0 ? '+' : '') + difference.toFixed(2), index % 2 ? 'striped' : '');
  };
  const updated = [...above.map(countryRow), makeRow(rankIndex + 1, '你', score.toFixed(2), '你的選擇', 'your-score'), ...below.map(countryRow)];
  const hongKong = countries.find(country => country.name === '香港');
  if (hongKong && ![...above, ...below].includes(hongKong)) updated.push(countryRow(hongKong, 1));
  rows.replaceChildren(...updated);
}

for (const step of steps) {
  const score = Number(step.dataset.score);
  const surface = stepSurfaces.find(item => Number(item.dataset.stepSurface) === score);
  surface.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') showHint(score);
  });
  surface.addEventListener('pointerleave', () => showHint(selectedScore));
  surface.addEventListener('click', () => step.click());
  step.setAttribute('aria-label', score + ' 分 · ' + labels[score]);
  step.addEventListener('mouseenter', () => showHint(score));
  step.addEventListener('mouseleave', () => showHint(selectedScore));
  step.addEventListener('focus', () => showHint(score));
  step.addEventListener('blur', () => showHint(selectedScore));
  step.addEventListener('click', () => {
    selectedScore = score;
    for (const choice of steps) choice.setAttribute('aria-pressed', String(choice === step));
    for (const item of stepSurfaces) item.classList.toggle('is-selected', item === surface);
    showHint(score);
    renderRanking(score);
    ranking.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
}

const figures = [...document.querySelectorAll('main > section > [data-name]')].filter(element => {
  return element.dataset.name.startsWith('圖') || element.querySelector('[data-name^="Chart ·"]');
});
const fitFigures = new ResizeObserver(entries => {
  for (const { target, contentRect } of entries) {
    const figure = target.firstElementChild;
    figure.style.zoom = Math.min(1, contentRect.width / figure.offsetWidth);
  }
});
for (const figure of figures) {
  const wrapper = document.createElement('div');
  wrapper.className = 'chart-viewport';
  wrapper.setAttribute('role', 'region');
  wrapper.setAttribute('aria-label', figure.dataset.name);
  figure.before(wrapper);
  wrapper.append(figure);
  wrapper.style.maxWidth = figure.offsetWidth + 'px';
  fitFigures.observe(wrapper);
}
const ladderArt = document.querySelector('[data-node-id="13:14"]');
const ladderSection = document.querySelector('#ladder');
const fitLadder = () => { ladderArt.style.zoom = Math.min(1, (ladderSection.clientWidth - 40) / 560); };
addEventListener('resize', fitLadder);
fitLadder();

const sourceData = window.happinessCharts;
const chartTables = [
  ['7:14', ['排名', '國家或地區', '生活評分'], window.happinessRanking.map(country => [country.rank, country.name, country.score])],
  ['7:192', ['地區', ...sourceData.years.slice(1)], [
    ...Object.entries(sourceData.regions)
      .filter(([region]) => region !== 'North America & ANZ')
      .map(([region, series]) => [region, ...series.slice(1)]),
    ['North America', ...sourceData.anglo.na],
    ['Australia & New Zealand', ...sourceData.anglo.anz],
  ]],
  ['7:414', ['國家或地區', '人均 GDP 的解釋值', '生活評分', '健康預期壽命的解釋值', '地區'], sourceData.cs
    .filter(country => country.country !== 'Venezuela' && country.gdp != null)
    .map(country => [country.country, country.gdp, country.score, country.health, country.region])],
  ['7:706', ['國家或地區', '最大跌幅', '2025 年生活評分', '高峰年份', '低谷年份'], sourceData.drops
    .map(country => [country.country, country.mdd, country.s25, country.pk_yr ?? '—', country.tr_yr ?? '—'])],
];

for (const [id, headings, values] of chartTables) {
  const chart = document.querySelector('[data-node-id="' + id + '"]');
  const card = chart.parentElement.closest('section > div, .chart-viewport > div');
  const details = document.createElement('details');
  details.className = 'chart-data';
  const summary = document.createElement('summary');
  summary.textContent = '查看數據';
  details.append(summary);
  details.addEventListener('toggle', () => {
    if (!details.open || details.querySelector('table')) return;
    const table = document.createElement('table');
    table.setAttribute('aria-label', card.dataset.name);
    const head = table.createTHead().insertRow();
    for (const heading of headings) {
      const cell = document.createElement('th');
      cell.scope = 'col';
      cell.textContent = heading;
      head.append(cell);
    }
    const body = table.createTBody();
    for (const valuesInRow of values) {
      const row = body.insertRow();
      for (const value of valuesInRow) row.insertCell().textContent = value;
    }
    const area = document.createElement('div');
    area.className = 'chart-table-scroll';
    area.tabIndex = 0;
    area.append(table);
    details.append(area);
  });
  if (card.parentElement.classList.contains('chart-viewport')) card.parentElement.after(details);
  else card.after(details);
}

for (const card of document.querySelectorAll('[data-name^="Expand card"]')) {
  const heading = card.querySelector(':scope > [data-name="Summary"]');
  if (!heading) continue;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = heading.className + ' expand-button';
  button.setAttribute('aria-expanded', 'true');
  button.append(...heading.childNodes);
  heading.replaceWith(button);
  const content = Array.from(card.children).filter(child => child !== button);
  button.addEventListener('click', () => {
    const wasOpen = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!wasOpen));
    const icon = button.querySelector('[data-name="Toggle"] p');
    if (icon) icon.textContent = wasOpen ? '+' : '–';
    for (const item of content) item.hidden = wasOpen;
  });
}
