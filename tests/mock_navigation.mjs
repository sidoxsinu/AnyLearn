let currentParams = { id: '', lessonId: '' };
let routerCalls = [];

export function setMockParams(params) {
  currentParams = { ...params };
}

export function getRouterCalls() {
  return [...routerCalls];
}

export function resetRouterCalls() {
  routerCalls = [];
}

export function useRouter() {
  return {
    push: (url) => { routerCalls.push({ action: 'push', url }); },
    replace: (url) => { routerCalls.push({ action: 'replace', url }); },
    back: () => { routerCalls.push({ action: 'back' }); },
    forward: () => { routerCalls.push({ action: 'forward' }); },
    prefetch: () => {},
  };
}

export function useParams() {
  return currentParams;
}

export function usePathname() {
  return '/';
}

export function useSearchParams() {
  return new URLSearchParams();
}

const mockNavigation = {
  useRouter,
  useParams,
  usePathname,
  useSearchParams,
};

export default mockNavigation;
