import { Handler } from './handlers';

export function splitString(s: string) {
  return s
    .trim()
    .split(/\s*[,，]\s*/)
    .filter(e => !!e);
}

export function includeTest(regs: RegExp[], str: string) {
  return regs.reduce((prev, reg) => prev || reg.test(str), false);
}

export function excludeTest(regs: RegExp[], str: string) {
  return regs.reduce((prev, reg) => prev && !reg.test(str), true);
}

export function getReg(s: string) {
  return new RegExp(`^${s.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`);
}

export function getMatchedHandler(handlers: Handler[], url: string) {
  const { host, pathname } = new URL(url);
  return handlers.find(e => {
    const paths = splitString(e.paths);
    const excludePaths = splitString(e.exclude_paths);
    return (
      e.enable &&
      e.origin &&
      getReg(e.origin).test(host) &&
      includeTest(paths.map(getReg), pathname) &&
      excludeTest(excludePaths.map(getReg), pathname)
    );
  });
}
