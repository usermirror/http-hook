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
