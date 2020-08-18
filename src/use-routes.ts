import { hook, Hook, State } from 'haunted';
import { addCurrent, removeCurrent } from './router';

interface Route<T> {
  callback: RouteCallback<T>;
  matcher: (path: string) => readonly [string | undefined, RouteParameters, boolean];
  name?: string;
}

interface RouteParameters {
  [key: string]: string;
}

type RouteCallback<T> = (params: RouteParameters, state: any) => T;

interface RouteEntry<T> {
  entry: RouteCallback<T>;
  name?: string;
}

const paramMatcher = /:[a-zA-Z0-9]+/g;

function createRouteEntry<T>([path, callback]: [string, RouteEntry<T> | RouteCallback<T>]): Route<
  T
> {
  let pattern = '^',
    lastIndex = 0,
    match: RegExpExecArray | null;

  const { name: routeName, entry } =
    typeof callback === 'function' ? { name: undefined, entry: callback } : callback;

  const exact = path.slice(-1) != '*',
    names: string[] = [];

  while ((match = paramMatcher.exec(path))) {
    const [name] = match;
    names.push(name.slice(1));

    pattern += path.slice(lastIndex, match.index) + '([^/]*)';
    lastIndex = match.index + name.length;
  }

  pattern += path.slice(lastIndex, exact ? undefined : -1);

  if (exact) {
    pattern += '$';
  }

  const regex = new RegExp(pattern);

  const matcher = (path: string) => {
    const match = regex.exec(path);
    if (!match) return [undefined, {}, false] as const;

    const [string, ...values] = match;
    const params = names.reduce(
      (obj, name, i) => ({
        ...obj,
        [name]: values[i],
      }),
      {}
    );

    return [string, params, exact] as const;
  };

  return {
    matcher,
    callback: entry,
    name: routeName,
  };
}

interface Routes<T> {
  [path: string]: RouteCallback<T>;
}

interface RouterOutlet<T> {
  outlet: T;
  match: string | undefined;
  exact: boolean;
}

const useRoutes = hook(
  class<T> extends Hook<[Routes<T>, T], RouterOutlet<T>> {
    fallback: T;
    _routes: Route<T>[];
    _result!: RouterOutlet<T>;

    constructor(id: number, state: State, routes: Routes<T>, fallback: T) {
      super(id, state);
      this.fallback = fallback;
      this._routes = Object.entries(routes).map(createRouteEntry);
    }

    update() {
      addCurrent(this);
      return this._result;
    }

    teardown() {
      removeCurrent(this);
    }

    matches(pathname: string): string | undefined {
      let match: string | undefined, params: RouteParameters, exact: boolean;

      for (const { matcher, callback, name } of this._routes) {
        [match, params, exact] = matcher(pathname);
        if (match === undefined) continue;
        this._result = { outlet: callback(params, history.state), match: name, exact };
        return match;
      }

      this._result = { outlet: this.fallback, match: undefined, exact: false };
    }
  }
);

export { useRoutes };
