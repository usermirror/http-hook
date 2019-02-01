import Global from './global'
import { HookConfig, modifyRequest, modifyResponse } from './hooks'

let _originalFetch = Global.fetch
let _hooks = {
  request: [],
  response: []
}

const HookFormData = function() {}

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

export function attach(config: HookConfig) {
  if (config.request) {
    _hooks.request.push(config.request)
  }

  if (config.response) {
    _hooks.response.push(config.response)
  }

  if (config.globals) {
    Global.fetch = FetchWithHttpHook
  }
}

export function reset() {
  _hooks.request = []
  _hooks.response = []

  if (Global.fetch !== _originalFetch) {
    Global.fetch = _originalFetch
  }
}

export default { attach, reset, FetchWithHttpHook }
