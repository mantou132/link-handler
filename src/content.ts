// https://github.com/WICG/pwa-url-handler/blob/master/explainer.md
// https://bugs.chromium.org/p/chromium/issues/detail?id=1072058

import { Handler, handlers, readyPromise } from './handlers';
import { getMatchedHandler, getReg, splitString } from './utils';

async function rewriteManifest(manifestLink: HTMLLinkElement, handler: Handler) {
  const isPWA = matchMedia('(display-mode: standalone), (display-mode: minimal-ui)').matches;
  const manifest = manifestLink.href ? await (await fetch(manifestLink.href)).json() : {};
  if (
    isPWA &&
    (!manifest.url_handlers || !manifest.url_handlers.find((e: any) => getReg(e.origin).test(location.host)))
  ) {
    console.log('Reinstall PWA to handle link');
  }
  const missUrlHandlers = !manifest.url_handlers;
  if (missUrlHandlers) {
    manifest.url_handlers = [
      {
        origin: location.origin,
      },
    ];
  }
  manifestLink.href = `data:application/json;charset=utf-8;base64,${btoa(JSON.stringify(manifest))}`;
  if (missUrlHandlers) {
    const association = {
      web_apps: [
        {
          manifest: manifestLink.href,
          details: {
            paths: splitString(handler.paths),
            exclude_paths: splitString(handler.exclude_paths),
          },
        },
      ],
    };
    const associationLink = document.createElement('link');
    associationLink.rel = 'web-app-origin-association';
    associationLink.href = `data:application/json;charset=utf-8;base64,${btoa(JSON.stringify(association))}`;
    document.head.append(associationLink);
  }
}

readyPromise.then(() => {
  const handler = getMatchedHandler(handlers, location.href);
  if (handler) {
    const link = document.head.querySelector<HTMLLinkElement>('link[rel=manifest]');
    if (link) {
      rewriteManifest(link, handler);
    } else {
      const link = document.createElement('link');
      link.rel = 'manifest';
      document.head.append(link);
      rewriteManifest(link, handler);
    }
  }
});
