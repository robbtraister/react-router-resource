export interface IParams {
  [key: string]: string | number | boolean
}

export interface IClient<Skeleton, Complete extends Skeleton = Skeleton> {
  get(id: string): Promise<object>
  list(params: IParams): Promise<object>
  create?(object: Skeleton): Promise<any>
  update?(object: Complete): Promise<any>
  delete?(object: Complete): Promise<boolean>
}

const clientCache = {}

export class Client<Skeleton, Complete extends Skeleton = Skeleton>
  implements IClient<Skeleton, Complete> {
  endpoint: string
  defaultParams: IParams

  constructor(endpoint: string, defaultParams: IParams) {
    this.endpoint = endpoint
    this.defaultParams = defaultParams
  }

  get(id: string): Promise<object> {
    return window.fetch(`${this.endpoint}/${id}`).then(res => res.json())
  }

  list(params: string | IParams): Promise<object> {
    const query =
      typeof params === 'string' ? params : this.serializeParams(params)

    return window.fetch(`${this.endpoint}?${query}`).then(res => res.json())
  }

  serializeParams(params: IParams): string {
    return Client.serializeParams(this.defaultParams, params)
  }

  static get(endpoint, defaultQueryParams) {
    const url = `${endpoint}?${Client.serializeParams(defaultQueryParams)}`
    return (clientCache[url] =
      clientCache[url] || new Client(endpoint, defaultQueryParams))
  }

  static serializeParams(defaultParams: IParams, params: IParams = {}): string {
    return Object.keys(defaultParams)
      .sort()
      .map(key => {
        const value = key in params ? params[key] : defaultParams[key]
        return `${key}=${value}`
      })
      .join('&')
  }
}
