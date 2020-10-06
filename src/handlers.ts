import { browser } from 'webextension-polyfill-ts';

import { handlers } from './config.json';

export type Handler = typeof handlers[0];

const totalHandlers: Handler[] = [];
const customHandlers: Handler[] = [];
const builtInHandlers: Handler[] = [];

interface Storage {
  builtInHandlers?: { [key: string]: Handler };
  customHandlers?: Handler[];
}

async function mergeHandlers() {
  totalHandlers.length = 0;
  customHandlers.length = 0;
  builtInHandlers.length = 0;
  const storage: Storage = await browser.storage.sync.get();
  handlers.forEach(e => {
    const storageHandler = storage.builtInHandlers?.[e.origin] || {};
    const builtInHandler = Object.assign(e, storageHandler);
    totalHandlers.push(builtInHandler);
    builtInHandlers.push(builtInHandler);
  });
  storage.customHandlers?.forEach(e => {
    totalHandlers.push(e);
    customHandlers.push(e);
  });
}

const readyPromise = mergeHandlers();

const updateBuiltInHandler = async (origin: string, data: Partial<Handler> | null) => {
  const storage: Storage = await browser.storage.sync.get();
  const storageHandlers = storage.builtInHandlers || {};
  const storageHandler = storageHandlers[origin] || {};
  await browser.storage.sync.set({
    builtInHandlers: Object.assign(storageHandlers, { [origin]: Object.assign(storageHandler, data) }),
  } as Partial<Storage>);
  await mergeHandlers();
};

const resestBuiltInHandlers = async () => {
  await browser.storage.sync.set({
    builtInHandlers: {},
  } as Partial<Storage>);
  await mergeHandlers();
};

const updateCustomHandler = async (index: number, data: Partial<Handler> | null) => {
  const storage: Storage = await browser.storage.sync.get();
  const customHandlers = storage.customHandlers || [];
  const storageHandler = customHandlers[index] || {};
  if (data === null) {
    customHandlers.splice(index, 1);
  } else {
    customHandlers.splice(index, 1, Object.assign(storageHandler, data));
  }
  await browser.storage.sync.set({ customHandlers } as Partial<Storage>);
  await mergeHandlers();
};

const addCustomHandler = async () => {
  const storage: Storage = await browser.storage.sync.get();
  const customHandlers = storage.customHandlers || [];
  customHandlers.push({ enable: true, origin: '', paths: '/*', exclude_paths: '', refresh: true });
  await browser.storage.sync.set({ customHandlers } as Partial<Storage>);
  await mergeHandlers();
};

export {
  readyPromise,
  mergeHandlers,
  totalHandlers as handlers,
  builtInHandlers,
  customHandlers,
  updateBuiltInHandler,
  resestBuiltInHandlers,
  updateCustomHandler,
  addCustomHandler,
};
