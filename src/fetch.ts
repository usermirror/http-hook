import Global from './global'
import { HookConfig } from './types'

let _originalFetch = Global.fetch
let _hooks = {
  request: [],
  response: []
}

const HookFormData = function() {}

async function modifyRequest(req: Request, hooks: Function[]) {
  let modifiedReq: Request

  for (let i = 0; i < hooks.length; i++) {
    let hook = hooks[i]
    let result = hook(modifiedReq || req)

    if (result instanceof Promise) {
      modifiedReq = await result
    } else {
      modifiedReq = result
    }
  }

  if (!modifiedReq) {
    return req
  }

  return modifiedReq
}

async function modifyResponse(res: Response, hooks: Function[]) {
  let modifiedRes: Response

  for (let i = 0; i < hooks.length; i++) {
    let hook = hooks[i]
    let result = hook(modifiedRes || res)

    if (result instanceof Promise) {
      modifiedRes = await result
    } else {
      modifiedRes = result
    }
  }

  if (!modifiedRes) {
    return res
  }

  return modifiedRes
}

function FetchWithHttpHook(url: string, init: any) {
  if (!init) {
    init = { headers: {} }
  }

  init.url = url

  const requestHooks = _hooks.request
  const responseHooks = _hooks.response

  return new Promise((resolve, reject) => {
    let req = generateRequest(init)
    let modifiedReqPromise = modifyRequest(req, requestHooks)

    let handleResponse = async (res: Response) => {
      let modifiedRes = await modifyResponse(res, responseHooks)

      if (modifiedRes.status >= 200 && modifiedRes.status < 400) {
        resolve(modifiedRes)
      } else {
        reject(modifiedRes)
      }
    }

    modifiedReqPromise
      .then(modifiedReq =>
        _originalFetch(modifiedReq)
          .then(handleResponse)
          .catch(handleResponse)
      )
      .catch(err => {
        console.error(err)
        reject(new Response())
      })
  })
}

function generateRequest(init: any) {
  let reqInit: any = {}

  if (init.body instanceof HookFormData) {
    reqInit.body = init.body.fd
  }

  if (init.headers) {
    reqInit.headers = new Global.Headers(init.headers)
  }

  return new Global.Request(init.url, reqInit)
}

export function attach(hook: HookConfig) {
  if (hook.request) {
    _hooks.request.push(hook.request)
  }

  if (hook.response) {
    _hooks.response.push(hook.response)
  }

  Global.fetch = FetchWithHttpHook
}

export function reset() {
  _hooks.request = []
  _hooks.response = []

  Global.fetch = _originalFetch
}

export default { attach, reset }
