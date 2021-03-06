# Haunted Router for Haunted 🦇 🎃

[![npm](https://img.shields.io/npm/v/haunted-router)](https://npm.im/haunted-router)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/haunted-router)
[![Build Status](https://github.com/Gladear/haunted-router/workflows/CI/badge.svg)](https://github.com/Gladear/haunted-router/commits/master)

A client-side router for [**Haunted**](https://github.com/matthewp/haunted).

## Table of contents

- [Getting started](#getting-started)
- [Usage](#usage)
  - [Define the routes](#define-the-routes)
  - [Use the URL parameters](#use-the-url-parameters)
  - [Define the title](#define-the-title)
  - [Navigate](#navigate)
  - [Redirect](#redirect)
- [Complete example](#complete-example)
- [Browser support](#browser-support)
- [Insight](#insight)

## Getting started

### Installing

Using npm:
```bash
npm install --save haunted-router
```

### Importing

If using a bundler, **Haunted Router** can be imported like any other library:
```javascript
import { useRoutes, useTitle, navigateTo, replaceTo } from 'haunted-router';
```

**Haunted Router** can also work directly in the browser without using any build tool. Here's an example with **unpkg**:
```javascript
import { useRoutes, useTitle, navigateTo, replaceTo } from 'https://unpkg.com/haunted-router?module';
```

## Usage

### Define the routes

Routes are defined using the `useRoutes` hook.
It takes an object as parameter, along with a fallback value.

The keys of the object are the paths to be matched, while the values are functions to be executed when the paths are matched.
The value returned by the hook is the same as the one returned by the function.

Example:
```javascript
import { useRoutes } from 'haunted-router';
// Where using lit-html as an example, but any rendering library compatible with haunted will do
import { html, nothing } from 'lit-html';

function App() {
  const routeResult = useRoutes({
    '/': () => html`<x-page-index></x-page-index>`,
    '/about': () => html`<x-page-about></x-page-about>`,
  }, nothing);

  return html`
    <main>
      ${routeResult.outlet}
    </main>
  `;
}
```

### Use the URL parameters

You can get the parameters in of the URL using the `useSearchParams` hook. This hook takes no parameter, and returns an object containing the search parameters in the search string. All values are strings. Use object decomposition to assign default values.

Example:
```javascript
function MyShoppingPage() {
  const {
    minPrice = 0,
    maxPrice = Infinity,
  } = useSearchParams();

  return html`
    Active filters:
    <ul>
      ${minPrice != 0
        ? html`
            <li>Minimum price: ${minPrice}</li>
          `
        : ''}
      ${maxPrixe !== Infinity
        ? html`
            <li>Maximum price: ${maxPrice}</li>
          `
        : ''}
    </ul>
  `;
}
```

### Define the title

The title of the document can be modified using the `useTitle` hook.
It's only parameter is a string, and it doesn't return anything.
The title is brought back to the original when the component is disconnected from the DOM.

Example:
```javascript
function App() {
  useTitle('My awesome app !');

  return html`
    <header>
      <h1>My awesome app !</h1>
    </header>
  `;
}
```

### Navigate

There are two ways to navigate using **haunted-router**:
- Programatically, using `navigateTo(url, state)` or `replaceTo(url, state)`. `navigateTo` creates an entry in the history, whilst `replaceTo` doesn't.
- With anchors, using the `router-link` custom element. Add the `replace` attribute to prevent creating an history entry.

Example:
```javascript
import { navigateTo, replaceTo } from 'haunted-router';

navigateTo('/url/to/destination', { foo: 'bar' });
replaceTo('/url/to/second-tab');

// Or
import { html } from 'lit-html';

return html`
  <a is="router-link" href="/url/to/destination" .state=${{ foo: 'bar' }}></a>
  <a is="router-link" href="/url/to/second-tab" replace></a>
`;
```
`state` can be of any type and is optional.

> ⚠️ As custom built-in elements have poor [browser support](https://caniuse.com/#feat=mdn-api_customelementregistry_builtin), the `router-link` custom built-in element is not automatically loaded. The behavior can however be polyfilled (see [Browser Support](#browser-support)). To use it, import `haunted-router/lib/router-link.js` once.

### Redirect

You can use the `router-redirect` custom element to redirect the user to a URL.
Add the `replace` attribute to prevent creating an entry in the history.

Example:
```javascript
import { html } from 'lit-html';

return html`
  <router-redirect url="/url/to/destination" />
  <router-redirect url="/new/replaced/url" replace />
`;
```

> ⚠️ The `router-redirect` custom element is optional. To use it, import `haunted-router/lib/router-redirect.js` once.

## Complete example

_main.js_
```javascript
import { component } from 'haunted';
import { useRoutes, useTitle } from 'haunted-router';

// A reminder that all libraries supported by haunted can be used
import { html, nothing } from 'lit-html';

import { mainRoutes } from './router.js';

const MyApp = () => {
  const routeResult = useRoutes(mainRoutes, nothing);

  return html`
    <header>My Awesome App</header>
    <main>${routeResult.outlet}</main>
    <footer>&copy; Haunted Router</footer>
  `;
};
```

_router.js_
```javascript
const mainRoutes = {
  // A plain url
  // Every top level URL must begin with a slash
  '/': () => html`<x-page-home></x-page-home>`,

  // An URL with parameters
  '/product/:id': ({ id }) => html`<x-page-product .id=${id}></x-page-product>`,

  // Dynamically import the component
  '/about': () => {
    // No need to wait for the result, the component will appear once loaded
    import('./about.js');
    return html`<x-page-about></x-page-about>`;
  },

  // Putting a star at the end will match all the URLs that starts with the string
  // It can be used to match subroutes
  '/account*': () => html`<x-page-account></x-page-account>`,
};

const accountRoutes = {
  '/detail': () => html`<x-tab-detail></x-tab-detail>`,
  '/password': () => html`<x-tab-password></x-tab-password>`,
};

export { mainRoutes, accountRoutes };
```

_account.js_
```javascript
import { component } from 'haunted';
import { useRoutes } from 'haunted-router';
import { html, nothing } from 'lit-html';

import { accountRoutes } from './router.js';

const PageAccount = () => {
  useTitle('My Account');

  const tabResult = useRoutes(accountRoutes, nothing);

  return html`
    <h1>Account</h1>
    ${tabResult.outlet}
  `;
};

customElements.define('x-page-account', component(PageAccount));
```

## Browser support

See **Haunted**'s browser support for required polyfills in the [README](https://github.com/matthewp/haunted#use) of the repository.

**Haunted Router** supports all browsers that support [custom built-in elements](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry#Browser_compatibility).
> ⚠️ Safari and Edge <= 18 do not support these, but the behavior can be polyfilled, for example, using the lightweight [@ungap/custom-elements-builtin](https://github.com/ungap/custom-elements-builtin).

If you choose not to use the `router-link` custom built-in element, the browser support is the same as **Haunted**.

## Insight
The router merely executes the function that corresponds to the current route, and returns the result.
It can be used to execute anything you want when the user navigates.
