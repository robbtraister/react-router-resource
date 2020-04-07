'use strict'

import { singular as singularize } from 'pluralize'

export interface IName {
  singular: string
  plural: string
}

export const getName = (name: string | IName): IName => {
  return isName(name) ? name : { singular: singularize(name), plural: name }
}

export const isName = (name: any): name is IName =>
  name && !!(name as IName).singular

export interface IParams {
  [key: string]: string | number | boolean
}

type TCallback = (err, data?) => void

export interface IClient {
  get(id: string, cb: TCallback): void
  list(params: string | IParams, cb: TCallback): void
  name: IName
  serializeParams: (params: IParams) => string
  // create?(object: Skeleton): Promise<any>
  // update?(object: Complete): Promise<any>
  // delete?(object: Complete): Promise<boolean>
}

interface IClientProps {
  endpoint: string
  name: string | IName
  idField?: string
  defaultQueryParams?: IParams
}

const clientCache = {}

export abstract class Client implements IClient {
  private cache: {
    items: object
    queries: object
  }

  private defaultQueryParams: IParams
  private endpoint: string
  private idField: string
  readonly name: IName

  constructor({
    endpoint,
    name,
    idField = 'id',
    defaultQueryParams = {}
  }: IClientProps & { name: IName }) {
    this.endpoint = endpoint
    this.defaultQueryParams = defaultQueryParams
    this.idField = idField
    this.name = name

    this.cache = {
      items: {},
      queries: {}
    }
  }

  get(id: string, cb: TCallback): void {
    cb(null, this.cache.items[id])

    window
      .fetch(`${this.endpoint}/${id}`)
      .then(res => res.json())
      .then(payload => payload && payload[this.name.singular])
      .then(resource => {
        if (resource) {
          this.cache.items[resource[this.idField]] = resource
        }
        cb(null, resource)
      })
      .catch(err => {
        cb(err)
      })
  }

  list(params: string | IParams, cb: TCallback): void {
    const query =
      typeof params === 'string' ? params : this.serializeParams(params)

    const cachedQuery = this.cache.queries[query]
    cb(null, cachedQuery && cachedQuery.map(id => this.cache.items[id]))

    window
      .fetch(`${this.endpoint}?${query}`)
      .then(res => res.json())
      .then(payload => payload && payload[this.name.plural])
      .then(resources => {
        if (resources) {
          this.cache.queries[query] = resources.map(resource => {
            const id = resource[this.idField]
            this.cache.items[id] = resource
            return id
          })
        }
        cb(null, resources)
      })
  }

  serializeParams(params: IParams): string {
    return Client.serializeParams(this.defaultQueryParams, params)
  }

  static get(props: IClientProps) {
    const {
      endpoint,
      name: rawName,
      idField = 'id',
      defaultQueryParams = {}
    } = props

    const name = getName(rawName)

    const url = `${endpoint}/${name.plural}:${
      name.singular
    }.${idField}?${this.serializeParams(defaultQueryParams)}`

    const ClientClass: any = this === Client ? DefaultClient : this

    return (clientCache[url] =
      clientCache[url] || new ClientClass({ ...props, name }))
  }

  static serializeParams(
    defaultQueryParams: IParams,
    params: IParams = {}
  ): string {
    return Object.keys(defaultQueryParams)
      .sort()
      .map(key => {
        const value = key in params ? params[key] : defaultQueryParams[key]
        return `${key}=${value}`
      })
      .join('&')
  }
}

class DefaultClient extends Client {}

export class EntriesClient extends Client {
  static get(props: IClientProps) {
    return super.get({
      ...props,
      name: {
        singular: 'entry',
        plural: 'entries'
      }
    })
  }
}

export class ResultsClient extends Client {
  static get(props: IClientProps) {
    return super.get({
      ...props,
      name: {
        singular: 'result',
        plural: 'results'
      }
    })
  }
}
