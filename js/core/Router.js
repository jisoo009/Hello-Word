export const PAGES = {
  start: 'StartPage.html', login: 'LoginPage.html', signup: 'SignUpPage.html',
  main: 'MainPage.html', list: 'WordbookListPage.html', study: 'WordbookStudyPage.html',
  settings: 'SettingsPage.html', game: 'GamePage.html', gameOver: 'GameOverPage.html',
};

export function goTo(pageKey, params = {}) {
  const query = new URLSearchParams(params).toString();
  location.href = `./${PAGES[pageKey]}${query ? `?${query}` : ''}`;
}

export function getParam(name) {
  return new URLSearchParams(location.search).get(name);
}

export function requireParam(name, fallback = 'list') {
  const value = getParam(name);
  if (!value) goTo(fallback);
  return value;
}