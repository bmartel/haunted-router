import { component, html } from 'haunted';
import { useRoutes, navigateTo, replaceTo } from '../haunted-router.js';
import { attach, cycle } from './helpers.js';

describe('useRoutes', () => {
  it('Executes the matching function', async () => {
    const tag = 'matching-function-routes-test';
    const expectedFoo = 0,
      expectedBar = 1;
    let actual;

    function App() {
      const { outlet } = useRoutes(
        {
          '/foo': () => expectedFoo,
          '/bar': () => expectedBar,
        },
        -1
      );
      actual = outlet;

      return html` Test `;
    }
    customElements.define(tag, component(App));

    navigateTo('/foo');

    const teardown = attach(tag);
    await cycle();

    assert.strictEqual(actual, expectedFoo, "The function matching /foo wasn't executed");

    replaceTo('/bar');
    await cycle();

    assert.strictEqual(actual, expectedBar, "The function matching /bar wasn't executed");

    teardown();
  });

  it('Allows name to be set for matching the current route name', async () => {
    const tag = 'matching-route-name-test';
    const expectedFoo = 0,
      expectedBar = 1;
    let actual;

    function App() {
      const { match, outlet, exact } = useRoutes(
        {
          '/foo': { name: 'foo', entry: () => expectedFoo },
          '/bar': { name: 'bar', entry: () => expectedBar },
        },
        -1
      );
      actual = { outlet, match, exact };

      return html` Test `;
    }
    customElements.define(tag, component(App));

    navigateTo('/foo');

    const teardown = attach(tag);
    await cycle();

    assert.strictEqual(actual.outlet, expectedFoo, "The function matching /foo wasn't executed");
    assert.strictEqual(actual.match, 'foo', "The route name foo wasn't matched");
    assert.strictEqual(actual.exact, true, "The route name foo wasn't matched exactly");

    replaceTo('/bar');
    await cycle();

    assert.strictEqual(actual.outlet, expectedBar, "The function matching /bar wasn't executed");
    assert.strictEqual(actual.match, 'bar', "The route name bar wasn't matched");
    assert.strictEqual(actual.exact, true, "The route name bar wasn't matched exactly");

    teardown();
  });

  it('Returns the fallback value if no route matches', async () => {
    const tag = 'fallback-route-test';
    const expected = 1;
    let actual;

    function App() {
      const { outlet } = useRoutes(
        {
          '/foo': () => 2,
          '/bar': () => 3,
        },
        expected
      );
      actual = outlet;

      return html` Test `;
    }
    customElements.define(tag, component(App));

    navigateTo('/');

    const teardown = attach(tag);
    await cycle();

    assert.strictEqual(actual, expected, 'A different result was returned');

    teardown();
  });

  it('Matches beginning of path if ended by "*"', async () => {
    const tag = 'end-star-routes-test';
    const expected = 1;
    let actual;

    function App() {
      const { outlet } = useRoutes({ '/foo*': () => expected }, 2);

      actual = outlet;

      return html` Test `;
    }
    customElements.define(tag, component(App));

    navigateTo('/foobar');

    const teardown = attach(tag);
    await cycle();

    assert.strictEqual(actual, expected, 'Subpath was not matched');

    teardown();
  });

  it('"*" matches everything', async () => {
    const tag = 'only-star-routes-test';
    const expected = 1;
    let actual;

    function App() {
      const { outlet } = useRoutes({ '*': () => expected }, 2);
      actual = outlet;

      return html` Test `;
    }
    customElements.define(tag, component(App));

    navigateTo('/foo');

    const teardown = attach(tag);
    await cycle();

    assert.strictEqual(actual, expected, '"*" didn\'t match path /foo');

    teardown();
  });

  it('Matches routes in the definition order', async () => {
    const tag = 'match-order-routes-test';
    const expected = 1;
    let actual;

    function App() {
      const { outlet } = useRoutes(
        {
          '/foo': () => expected,
          '*': () => 1,
        },
        2
      );
      actual = outlet;

      return html` Test `;
    }
    customElements.define(tag, component(App));

    navigateTo('/foo');

    const teardown = attach(tag);
    await cycle();

    assert.equal(actual, expected, 'It matched the wrong route');

    teardown();
  });

  it('Allows descendants to declare routes', async () => {
    const parentTag = 'parent-routes-test';
    const childTag = 'child-routes-test';
    const expected1 = 1;
    const expected2 = 2;
    let parent;
    let child;

    function Parent() {
      parent = useRoutes(
        {
          '/foo*': { name: 'foo', entry: () => html` <child-routes-test /> ` },
        },
        html``
      );

      return parent.outlet;
    }
    customElements.define(parentTag, component(Parent));

    function Child() {
      child = useRoutes(
        {
          '': { name: 'foo.index', entry: () => expected1 },
          '/bar': { name: 'foo.bar', entry: () => expected2 },
          bar: () => 2,
        },
        10
      );

      return html` Test `;
    }
    customElements.define(childTag, component(Child));

    navigateTo('/foo');
    const teardown = attach(parentTag);
    await cycle();

    assert.strictEqual(parent.match, 'foo', "The Parent route name foo wasn't matched");
    assert.strictEqual(parent.exact, false, "The Parent route name foo wasn't matched exactly");

    assert.strictEqual(child.outlet, expected1, 'Child was not rendered');
    assert.strictEqual(child.match, 'foo.index', "The Child route name foo.index wasn't matched");
    assert.strictEqual(child.exact, true, "The Child route name foo.index wasn't matched exactly");

    navigateTo('/foo/bar');
    await cycle();

    assert.strictEqual(parent.match, 'foo', "The Parent route name foo wasn't matched");
    assert.strictEqual(parent.exact, false, "The Parent route name foo wasn't matched exactly");

    assert.strictEqual(child.outlet, expected2, 'Child was not rendered');
    assert.strictEqual(child.match, 'foo.bar', "The Child route name foo.bar wasn't matched");
    assert.strictEqual(child.exact, true, "The Child route name foo.bar wasn't matched exactly");

    teardown();
  });

  it('Allows to navigate to a sibling route', async () => {
    const tag = 'navigate-sibling-routes-test';
    const expected1 = 1,
      expected2 = 2;
    let actual;

    function App() {
      const { outlet } = useRoutes(
        {
          '/foo': () => expected1,
          '/bar': () => expected2,
        },
        3
      );
      actual = outlet;

      return html` Test `;
    }
    customElements.define(tag, component(App));

    navigateTo('/foo');

    const teardown = attach(tag);
    await cycle();

    assert.equal(actual, expected1, "It didn't match the route");

    navigateTo('/bar');
    await cycle();

    assert.equal(actual, expected2, "It couldn't navigate to sibling");

    teardown();
  });

  it('Parses url params correctly', async () => {
    const tag = 'url-params-routes-test';
    const expected = { foo: 'bar', baz: 'foobar' };
    let actual;

    function App() {
      const { outlet } = useRoutes(
        {
          '/foo/:foo/:baz/baz': params => params,
        },
        'wrong'
      );

      actual = outlet;

      return html` Test `;
    }
    customElements.define(tag, component(App));

    navigateTo('/foo/bar/foobar/baz');

    const teardown = attach(tag);
    await cycle();

    assert.deepEqual(actual, expected, 'It did not parse arguments correctly');

    teardown();
  });

  it('Passes current state as the route second argument', async () => {
    const tag = 'state-arg-routes-test';
    const expected = { foo: 'bar', bar: 'foobar' };
    let actual;

    function App() {
      const { outlet } = useRoutes(
        {
          '*': (_, state) => state,
        },
        'wrong'
      );

      actual = outlet;

      return html` Test `;
    }
    customElements.define(tag, component(App));

    navigateTo('/wherever', expected);

    const teardown = attach(tag);
    await cycle();

    assert.deepEqual(actual, expected, "It didn't pass the new state");

    teardown();
  });
});
