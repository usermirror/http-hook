export type RequestHook = (req: Request) => Request
export type ResponseHook = (res: Response) => Response

export type HookConfig = {
  globals?: Boolean
  request?: RequestHook
  response?: ResponseHook
}

export type HttpHook = {
  XMLHttpRequest: () => any
  fetch: (input: RequestInfo, init?: RequestInit) => Promise<any>
  attach: (input: HookConfig) => void
  reset: () => void
}

export async function modifyRequest(req: Request, hooks: Function[]) {
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

export async function modifyResponse(res: Response, hooks: Function[]) {
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
