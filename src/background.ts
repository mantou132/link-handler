import { browser } from 'webextension-polyfill-ts';

import { handlers, mergeHandlers } from './handlers';
import { getMatchedHandler } from './utils';

const pendingTabSet = new Set<number>();

async function onCreatedNavigationTarget({ tabId, url }: { tabId: number; url: string }) {
  const { host, pathname, search, hash } = new URL(url);
  const handler = getMatchedHandler(handlers, url);
  if (!handler) {
    pendingTabSet.add(tabId);
    return;
  }

  const tabs = await browser.tabs.query({ url: `*://${host}/*` });
  const tab = tabs.find(e => e.id !== tabId);
  if (tab) {
    browser.tabs.remove(tabId);
    const focusWindow = () => tab.windowId && browser.windows.update(tab.windowId, { focused: true });
    const loadUrl = () => {
      focusWindow();
      browser.tabs.update(tab.id, { url, active: true });
    };
    const focusTab = () => {
      focusWindow();
      browser.tabs.update(tab.id, { active: true });
    };
    if (handler.refresh) {
      loadUrl();
    } else {
      const path = `${pathname}${search}${hash}`;
      const temp = () => {
        const { pathname, search, hash } = location;
        if (`${pathname}${search}${hash}` === 'PATH') return true;
        const html = document.body.innerHTML;
        try {
          history.pushState({}, '', 'PATH');
          history.pushState({}, '', 'PATH');
          history.back();
          setTimeout(() => {
            if (document.body.innerHTML === html) location.reload();
          }, 400);
          return true;
        } catch (e) {
          return false;
        }
      };
      const [result] = await browser.tabs.executeScript(tab.id, {
        code: `(${temp.toString().replace(/PATH/g, path)})()`,
      });
      result ? focusTab() : loadUrl();
    }
  }
}

browser.webNavigation.onCreatedNavigationTarget.addListener(onCreatedNavigationTarget);

browser.webRequest.onBeforeRedirect.addListener(
  ({ tabId, redirectUrl: url }) => {
    if (pendingTabSet.has(tabId)) {
      onCreatedNavigationTarget({ tabId, url });
    }
  },
  { urls: ['<all_urls>'] },
);

browser.tabs.onUpdated.addListener(tabId => {
  pendingTabSet.delete(tabId);
});

browser.browserAction.onClicked.addListener(() => {
  browser.runtime.openOptionsPage();
});

browser.storage.onChanged.addListener(mergeHandlers);
