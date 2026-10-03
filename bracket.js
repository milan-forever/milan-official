const flagEmojis = {
  us: '🇺🇸',
  ru: '🇷🇺',
  ua: '🇺🇦',
  de: '🇩🇪',
  sk: '🇸🇰',
  uz: '🇺🇿',
};

const accentClasses = [
  'accent-round1',
  'accent-round2',
  'accent-round3',
  'accent-round4',
  'accent-round5',
  'accent-winner',
];

const roundLabels = document.querySelector('.round-labels');
const bracket = document.querySelector('.bracket');
const connectors = [];
const columns = [];

function validateBracket(contestants, stages) {
  const teamById = new Map(contestants.map((c) => [c.id, c]));
  const unknownIds = new Set();
  stages.forEach((stage, index) => {
    if (index > 0 && stage.contestants.length * 2 !== stages[index - 1].contestants.length) {
      throw new Error(`${stage.label} must contain half as many contestants as the previous stage.`);
    }
    stage.contestants.forEach((id) => {
      if (!teamById.has(id)) unknownIds.add(id);
    });
  });
  if (unknownIds.size) {
    console.warn(`Unknown contestant IDs: ${[...unknownIds].join(', ')}`);
  }
  return teamById;
}

function createTeamCard(id, accentClass, teamById, isWinner = false) {
  const contestant = teamById.get(id) || { name: id, flag: '' };
  const card = document.createElement('div');
  card.className = `team-card${isWinner ? ' is-winner' : ''}${teamById.has(id) ? '' : ' is-unknown'}`;
  if (!teamById.has(id)) card.title = `Unknown contestant ID: ${id}`;

  const accent = document.createElement('div');
  accent.className = `accent-bar ${accentClass}`;

  const name = document.createElement('span');
  name.className = 'team-name';
  name.textContent = contestant.name;

  const flag = document.createElement('span');
  flag.className = 'team-flag';
  flag.textContent = flagEmojis[contestant.flag.toLowerCase()] || contestant.flag;
  flag.setAttribute('role', 'img');
  flag.setAttribute('aria-label', `${contestant.name} flag`);
  flag.title = `${contestant.name} flag`;

  card.append(accent, name, flag);
  return card;
}

function createConnector() {
  const wrapper = document.createElement('div');
  wrapper.className = 'connector-col';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 75 1');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'var(--connector)');
  svg.setAttribute('stroke-width', '1.7');
  svg.setAttribute('stroke-linecap', 'round');
  wrapper.append(svg);
  return wrapper;
}

function createTrophyBadge() {
  const badge = document.createElement('div');
  badge.className = 'trophy-badge';

  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M19 3H5c-1.1 0-2 .9-2 2v4c0 2.5 1.8 4.6 4.2 4.9 1 1 2.3 1.7 3.8 2V19H8v2h8v-2h-3v-3.1c1.5-.3 2.8-1 3.8-2 2.4-.3 4.2-2.4 4.2-4.9V5c0-1.1-.9-2-2-2z');
  icon.append(path);

  const label = document.createElement('span');
  label.className = 'trophy-badge-label';
  label.textContent = 'Чемпион';
  badge.append(icon, label);
  return badge;
}

function renderBracket(contestants, stages) {
  const teamById = validateBracket(contestants, stages);
  roundLabels.replaceChildren();
  bracket.replaceChildren();
  connectors.length = 0;
  columns.length = 0;

  const trackWidth = stages.length * 185 + (stages.length - 1) * 75;
  roundLabels.style.minWidth = `${trackWidth}px`;
  bracket.style.minWidth = `${trackWidth}px`;

  stages.forEach((stage, stageIndex) => {
    const roundLabel = document.createElement('div');
    roundLabel.className = 'round-label';
    roundLabel.textContent = stage.label;
    roundLabels.append(roundLabel);

    const column = document.createElement('div');
    column.className = `column column-${stageIndex + 1}`;
    const isFirstRound = stageIndex === 0;
    const isFinal = stageIndex === stages.length - 1;
    const accentClass = accentClasses[stageIndex] || 'accent-default';

    if (isFirstRound) {
      for (let index = 0; index < stage.contestants.length; index += 2) {
        const pair = document.createElement('div');
        pair.className = 'match-pair';
        pair.append(
          createTeamCard(stage.contestants[index], accentClass, teamById),
          createTeamCard(stage.contestants[index + 1], accentClass, teamById),
        );
        column.append(pair);
      }
    } else if (isFinal) {
      const winner = document.createElement('div');
      winner.className = 'winner-wrapper';
      winner.append(createTeamCard(stage.contestants[0], accentClass, teamById, true), createTrophyBadge());
      column.append(winner);
    } else {
      stage.contestants.forEach((id) => column.append(createTeamCard(id, accentClass, teamById)));
    }

    bracket.append(column);
    columns.push(column);

    if (!isFinal) {
      const connectorLabel = document.createElement('div');
      connectorLabel.className = 'connector-label';
      roundLabels.append(connectorLabel);

      const connector = createConnector();
      bracket.append(connector);
      connectors.push(connector);
    }
  });
}

function layoutBracket() {
  if (columns.length === 0) return;
  const firstColumn = columns[0];
  const bracketTop = bracket.getBoundingClientRect().top;
  const bracketHeight = firstColumn.offsetHeight;
  bracket.style.height = `${bracketHeight}px`;

  columns.slice(1).forEach((column) => {
    column.style.height = `${bracketHeight}px`;
  });
  connectors.forEach((connector) => {
    connector.style.height = `${bracketHeight}px`;
    connector.querySelector('svg').setAttribute('viewBox', `0 0 75 ${bracketHeight}`);
  });

  const centerOf = (card) => {
    const rect = card.getBoundingClientRect();
    return rect.top - bracketTop + rect.height / 2;
  };
  let centers = [...firstColumn.querySelectorAll('.match-pair .team-card')].map(centerOf);

  columns.slice(1, -1).forEach((column) => {
    const cards = [...column.querySelectorAll('.team-card')];
    centers = cards.map((card, index) => {
      const center = (centers[index * 2] + centers[index * 2 + 1]) / 2;
      card.style.position = 'absolute';
      card.style.top = `${center - card.offsetHeight / 2}px`;
      return center;
    });
  });

  const champion = columns.at(-1).querySelector('.winner-wrapper');
  const championCard = champion.querySelector('.team-card');
  const championCenter = (centers[0] + centers[1]) / 2;
  champion.style.top = `${championCenter - championCard.offsetHeight / 2}px`;

  let sourceCenters = [...firstColumn.querySelectorAll('.match-pair .team-card')].map(centerOf);
  connectors.forEach((connector, index) => {
    const targetCenters = index === connectors.length - 1
      ? [championCenter]
      : [...columns[index + 1].querySelectorAll('.team-card')]
        .map((card) => Number.parseFloat(card.style.top) + card.offsetHeight / 2);
    const paths = targetCenters.map((target, matchIndex) => {
      const upper = sourceCenters[matchIndex * 2];
      const lower = sourceCenters[matchIndex * 2 + 1];
      const midpoint = (upper + lower) / 2;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M 0 ${upper} H 37.5 V ${lower} H 0 M 37.5 ${midpoint} H 75`);
      return path;
    });
    connector.querySelector('svg').replaceChildren(...paths);
    sourceCenters = targetCenters;
  });
}

fetch('./tournament.json')
  .then((r) => r.json())
  .then(({ contestants, stages }) => {
    renderBracket(contestants, stages);
    layoutBracket();
    window.addEventListener('resize', layoutBracket);
    new ResizeObserver(layoutBracket).observe(columns[0]);
    document.fonts.ready.then(layoutBracket);
  })
  .catch((err) => {
    console.error('Failed to load tournament data:', err);
  });