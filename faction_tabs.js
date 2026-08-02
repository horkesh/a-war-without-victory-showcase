export function installFactionTabs(root = document) {
  const tabs = [...root.querySelectorAll('[data-faction-tab]')];
  if (!tabs.length) return;

  const select = (id) => {
    for (const tab of tabs) {
      const isActive = tab.dataset.factionTab === id;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    }
    for (const panel of root.querySelectorAll('.faction-panel')) {
      panel.hidden = panel.id !== `faction-panel-${id}`;
    }
  };

  for (const tab of tabs) {
    tab.addEventListener('click', () => select(tab.dataset.factionTab));
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => installFactionTabs());
  } else {
    installFactionTabs();
  }
}
