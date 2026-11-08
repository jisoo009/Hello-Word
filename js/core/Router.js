export const PAGES = {
  start: 'StartPage.html',
  login: 'LoginPage.html',
  signup: 'SignUpPage.html',
  main: 'MainPage.html',
  list: 'WordbookListPage.html',
  study: 'WordbookStudyPage.html',
  settings: 'SettingsPage.html',
  game: 'GamePage.html',
  gameOver: 'GameOverPage.html',
};

export function goTo(pageKey, params = {}) {
  const file = PAGES[pageKey];
  if (!file) throw new Error(`없는 페이지: ${pageKey}`);
  const query = new URLSearchParams(params).toString();
  location.href = `./${file}${query ? `?${query}` : ''}`;
}

export function getParam(name) {
  return new URLSearchParams(location.search).get(name);
}

export function requireParam(name, fallback = 'list') {
  const value = getParam(name);
  if (!value) {
    goTo(fallback);
    throw new Error(`URL에 ${name} 값이 없어요.`);
  }
  return value;
}
