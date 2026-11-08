import { START_REDIRECT_MS } from '../core/Config.js';
import { getSession } from '../core/Auth.js';
import { goTo } from '../core/Router.js';

async function initStartPage() {
  document.getElementById('start-loader-burn').classList.add('is-running');

  const [session] = await Promise.all([
    getSession().catch(() => null),
    new Promise((resolve) => setTimeout(resolve, START_REDIRECT_MS)),
  ]);

  goTo(session ? 'main' : 'login');
}

initStartPage();
