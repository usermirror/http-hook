<br/>
<p align="center">
  <strong><code>🎣 http-hook</code></strong>
</p>

<p align="center">
  Fast hooks for modifying <br/>
  HTTP requests and responses.
</p>
<br/>

<p align="center">
  <a href="https://unpkg.com/http-hook/lib/index.js"><img src="https://img.badgesize.io/https://unpkg.com/http-hook/lib/index.js?compression=gzip&amp;label=http--hook"></a>
  <a href="https://www.npmjs.com/package/http-hook"><img src="https://img.shields.io/npm/v/http-hook.svg?maxAge=3600&label=http-hook&colorB=007ec6"></a>
</p>
<br/>

```javascript
import httpHook from 'http-hook'

httpHook.attach({
  request: req => { ... },
  response: res => { ... }
})

fetch() // request modified before sending
  .then() // response modified after request completes
```

#### Installation

Install with npm:

```console
npm install --save http-hook
```

Or yarn:

```console
yarn add http-hook
```

Or using a script tag like this [example in CodeSandbox](https://codesandbox.io/s/0xm9j6v1vl):

```html
<script
  src="https://unpkg.com/http-hook@^0.1/lib/index.umd.js"
  crossorigin="anonymous"
></script>
```

#### Usage

By default, when you attach request or response hooks then the native `fetch` and `XMLHttpRequest` variables are overwritten to make the hooks affect all HTTP requests.

If you don't want to overwrite the globals, then you can pass in `{ globals: false }` and use packaged variables:

```javascript
import httpHook from 'http-hook'

httpHook.attach({
  globals: false,
  request: req => { ... },
  response: res => { ... }
})

httpHook.fetch()

new httpHook.XMLHttpRequest()
```
