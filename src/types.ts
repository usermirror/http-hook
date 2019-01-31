export type RequestHook = (req: Request) => Request
export type ResponseHook = (res: Response) => Response

export type HookConfig = {
  request?: RequestHook
  response?: ResponseHook
}

export type HttpHook = {
  attach: (input: HookConfig) => void
  reset: () => void
}
