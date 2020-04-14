import { singular as singularize } from 'pluralize'

export type Callback<T> = (
  err: Error | null,
  payload?: T,
  attributes?: any
) => void

export interface FetchOptions {
  refresh: boolean
}

export interface Name {
  plural: string
  singular: string
}

const DEFAULT_NAME: Name = {
  plural: 'results',
  singular: 'result'
}

export const getName = (name: string | null | Name): Name | null => {
  return name
    ? isName(name)
      ? name
      : { plural: name, singular: singularize(name) }
    : name === null
    ? name
    : DEFAULT_NAME
}

export const isName = (name: any): name is Name =>
  name && !!(name as Name).singular

export interface Query {
  [key: string]: string | number | boolean
}

type OptionalClientProps<Model> = Partial<
  Pick<
    Client<Model>,
    | 'defaultQuery'
    | 'fetch'
    | 'getModel'
    | 'idField'
    | 'name'
    | 'serializeModel'
  >
>

type RequiredClientProps<Model> = Pick<Client<Model>, 'endpoint'>

type ClientProps<Model> = OptionalClientProps<Model> &
  RequiredClientProps<Model>

export function serializeQuery(query: Query, defaultQuery?: Query): string {
  return Object.keys(defaultQuery || query)
    .sort()
    .map(
      key => `${key}=${key in query ? query[key] : (defaultQuery || {})[key]}`
    )
    .join('&')
}

export class Client<Model> {
  readonly endpoint: string
  readonly defaultQuery: Query = {}
  readonly idField: string = 'id'
  readonly name: Name | null = DEFAULT_NAME

  protected resourceCache = {
    items: {},
    queries: {}
  }

  constructor(props: ClientProps<Model>) {
    Object.assign(this, props, { endpoint: props.endpoint.replace(/\/$/, '') })
  }

  // fetch/getModel/serializeModel are passthrough defaults that may be overridden
  async fetch(
    input: RequestInfo,
    init?: RequestInit | undefined
  ): Promise<Response> {
    return window.fetch(input, init)
  }

  getModel(payload: object): Model {
    return (payload as unknown) as Model
  }

  serializeModel(model: Model): string {
    return JSON.stringify(model)
  }

  // a simple query serializer that normalizes based on client instance defaults
  serializeQuery(query: Query) {
    return serializeQuery(query, this.defaultQuery)
  }

  /**
   * Save a new model to the server
   *
   * @param model Model instance
   *
   * @returns the model instance
   */
  create(model: Model): Promise<Model>
  create(model: Model, callback?: undefined): Promise<Model>
  create(model: Model, callback: Callback<Model>): void

  create(model: Model, callback?: Callback<Model>): Promise<Model> | void {
    const promise = this.fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: this.serializeModel(model)
    })
      .then(resp => resp.json())
      .then(payload => {
        const model = this.getModel(
          this.name ? payload[this.name.singular] : payload
        )
        this.resourceCache.items[model[this.idField]] = model

        return [model]
      })

    return Client.promiseToCallback(promise, callback)
  }

  /**
   * Delete a model from the server and local cache
   *
   * @param id Model instance id
   * @param model Model instance
   *
   * @returns true - throws on failure
   */
  delete(id: string): Promise<boolean>
  delete(model: Model): Promise<boolean>
  delete(id: string, callback?: undefined): Promise<boolean>
  delete(model: Model, callback?: undefined): Promise<boolean>
  delete(id: string, callback: Callback<boolean>): void
  delete(model: Model, callback: Callback<boolean>): void

  delete(
    idOrModel: string | Model,
    callback?: Callback<boolean>
  ): Promise<boolean> | void {
    const id =
      typeof idOrModel === 'string' ? idOrModel : idOrModel[this.idField]

    const promise = this.fetch(`${this.endpoint}/${id}`, {
      method: 'DELETE'
    }).then(resp => {
      delete this.resourceCache.items[id]

      return [true]
    })

    return Client.promiseToCallback(promise, callback)
  }

  /**
   * Find an array of model instances
   *
   * If a callback is provided, no response value is returned;
   *  instead, the callback will be called both with locally cached values
   *  and again when a network update is complete
   *
   * If no callback is provided, the refresh option will determine if the
   *  response Promise is resolved to locally cached values or a network update
   *
   * @param query Query params
   * @param options Fetch options {refresh: boolean = true}
   * @param callback Node-style callback to be called with result
   *
   * @returns Promise<Model[]> (only if no callback is provided)
   */
  find(query: string | Query): Promise<Model[]>
  find(query: string | Query, callback: undefined): void
  find(query: string | Query, callback: Callback<Model[]>): void
  find(
    query: string | Query,
    options: FetchOptions | undefined
  ): Promise<Model[]>

  find(
    query: string | Query,
    options: FetchOptions | undefined,
    callback: undefined
  ): void

  find(
    query: string | Query,
    options: FetchOptions | undefined,
    callback: Callback<Model[]>
  ): void

  find(
    query: string | Query,
    optionsArg?: FetchOptions | Callback<Model[]>,
    callbackArg?: Callback<Model[]>
  ): Promise<Model[]> | void {
    const { options, callback } = Client.parseFetchArgs(optionsArg, callbackArg)

    const queryString =
      typeof query === 'string' ? query : this.serializeQuery(query)

    const ids = this.resourceCache.queries[queryString]
    const models = ids && ids.map(id => this.resourceCache.items[id])
    if (callback) {
      callback(null, models)
      if (!options.refresh) {
        return
      }
    } else if (ids && !options.refresh) {
      return Promise.resolve(models)
    }

    const promise = this.fetch(`${this.endpoint}?${queryString}`)
      .then(resp => resp.json())
      .then(payload => {
        const models = (
          (this.name ? payload[this.name.plural] : payload) || []
        ).map(datum => this.getModel(datum))

        if (this.name) {
          delete payload[this.name.plural]
        }

        this.resourceCache.queries[queryString] = models.map(model => {
          const id = model[this.idField]
          this.resourceCache.items[id] = model
          return id
        })

        return [models, this.name ? payload : {}]
      })

    return Client.promiseToCallback(promise, callback)
  }

  /**
   * Retreive a model instance
   *
   * If a callback is provided, no response value is returned;
   *  instead, the callback will be called both with a locally cached value
   *  and again when a network update is complete
   *
   * If no callback is provided, the refresh option will determine if the
   *  response Promise is resolved to a locally cached value or a network update
   *
   * @param id Model instance id
   * @param options Fetch options {refresh: boolean = true}
   * @param callback Node-style callback to be called with result
   *
   * @returns Promise<Model> (only if no callback is provided)
   */
  get(id: string): Promise<Model>
  get(id: string, callback: undefined): void
  get(id: string, callback: Callback<Model>): void
  get(id: string, options: FetchOptions | undefined): Promise<Model>
  get(id: string, options: FetchOptions | undefined, callback: undefined): void
  get(
    id: string,
    options: FetchOptions | undefined,
    callback: Callback<Model>
  ): void

  get(
    id: string,
    optionsArg?: FetchOptions | Callback<Model>,
    callbackArg?: Callback<Model>
  ): Promise<Model> | void {
    const { options, callback } = Client.parseFetchArgs(optionsArg, callbackArg)

    const model = this.resourceCache.items[id]
    if (callback) {
      callback(null, model)
      if (!options.refresh) {
        return
      }
    } else if (model && !options.refresh) {
      return Promise.resolve(model)
    }

    const promise = this.fetch(`${this.endpoint}/${id}`)
      .then(resp => resp.json())
      .then(payload => {
        const model = this.getModel(
          this.name ? payload[this.name.singular] : payload
        )

        if (this.name) {
          delete payload[this.name.singular]
        }

        this.resourceCache.items[id] = model

        return [model, this.name ? payload : {}]
      })

    return Client.promiseToCallback(promise, callback)
  }

  /**
   * Save an existing model to the server
   *
   * @param model Model instance
   *
   * @returns the model instance
   */
  update(model: Model): Promise<Model>
  update(model: Model, callback?: undefined): Promise<Model>
  update(model: Model, callback: Callback<Model>): void

  update(model: Model, callback?: Callback<Model>): Promise<Model> | void {
    const id = model[this.idField]

    const promise = this.fetch(`${this.endpoint}/${id}`, {
      method: 'PUT',
      body: this.serializeModel(model)
    }).then(() => {
      this.resourceCache.items[id] = model
      return [model]
    })

    return Client.promiseToCallback(promise, callback)
  }

  /**
   * Save a model to the server
   * Determines whether to use create or update based on the existence of an id
   *
   * @param model Model instance
   *
   * @returns the model instance
   */
  upsert(model: Model): Promise<Model>
  upsert(model: Model, callback?: undefined): Promise<Model>
  upsert(model: Model, callback: Callback<Model>): void

  upsert(model: Model, callback?: Callback<Model>): Promise<Model> | void {
    const method = this.idField in model ? 'update' : 'create'
    return callback ? this[method](model, callback) : this[method](model)
  }

  protected static clientCache = {}

  static getInstance<Model>(
    props: Omit<ClientProps<Model>, 'name'> & {
      name?: string | Name
    }
  ): Client<Model> {
    const name = getName(props.name || props.endpoint.split('/').pop() || null)

    // const cacheKey = `${props.endpoint}?${serializeQuery(
    //   props.defaultQuery || {}
    // )}`
    const cacheKey = props.endpoint
    return (this.clientCache[cacheKey] =
      this.clientCache[cacheKey] || new this({ ...props, name }))
  }

  static parseFetchArgs<Model>(
    optionsArg?: FetchOptions | Callback<Model>,
    callbackArg?: Callback<Model>
  ): { options: FetchOptions; callback?: Callback<Model> } {
    const noOptions = optionsArg instanceof Function || optionsArg === undefined

    if (noOptions && callbackArg) {
      throw new Error('invalid arguments')
    }

    const callback = noOptions ? (optionsArg as Callback<Model>) : callbackArg

    return {
      options: noOptions
        ? // if no callback, default to false to make use of cached value
          { refresh: !!callback }
        : (optionsArg as FetchOptions),
      callback
    }
  }

  // static promiseToCallback<T>(promise: Promise<any[]>): Promise<T>

  static promiseToCallback<T, CB extends Callback<T> | undefined>(
    promise: Promise<any[]>,
    callback?: CB
  ): CB extends Function ? void : Promise<T>

  static promiseToCallback<T>(
    promise: Promise<any[]>,
    callback?: Callback<T>
  ): Promise<T> | void {
    if (callback && callback instanceof Function) {
      promise.then(args => {
        callback(null, ...args)
      })
      // don't chain so an exception from callback is not propagated back to callback
      promise.catch(err => {
        callback(err)
      })
    } else {
      return promise.then(([data]) => data as T)
    }
  }
}
