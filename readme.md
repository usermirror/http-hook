# http-hook

Fast hooks for modifying HTTP requests and responses

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

Or using a script tag:

```html
<script
  src="https://unpkg.com/http-hook@0.1.0/lib/index.umd.js"
  crossorigin="anonymous"
></script>
```

#### Usage

By default, when you attach request or response hooks then the native `fetch` and `XMLHttpRequest` variables are overwritten to make the hooks affect all HTTP requests.

If you don't want to overwrite the global variables, then you can pass in `{ globals: false }` and use the namespaced versions like this:

```javascript
import httpHook from 'http-hook'

httpHook.attach({
  globals: false,
  request: req => { ... },
  response: res => { ... }
})

httpHook.fetch()

httpHook.XMLHttpRequest
```
