'use strict'

import { singular as singularize } from 'pluralize'
import React, { useContext, useEffect, useReducer } from 'react'
import { Route, useRouteMatch } from 'react-router'

import { useApiPrefix } from './api-prefix'
import { Client, IParams } from './client'
import { clientContext, resourcesContext, useResources } from './contexts'
import { List } from './list'
import { Show } from './show'

import { useQueryParams } from '../hooks/useQueryParams'

const ResourceLoader = () => {
  const route = useRouteMatch()
  const {
    cache,
    client,
    idField,
    idParam,
    name: { singular },
    dispatch
  } = useContext(clientContext)
  const id = route.params[idParam]

  useEffect(() => {
    let mounted = true

    if (id !== 'new') {
      dispatch({ type: 'SET_RESOURCE', payload: cache.items[id] })

      client.get(id).then(data => {
        if (mounted) {
          const resource = data && data[singular]
          if (resource) {
            cache.items[resource[idField]] = resource
          }
          dispatch({ type: 'SET_RESOURCE', payload: resource })
        }
      })
    }

    return () => {
      mounted = false
    }
  }, [client, id, singular, idField])

  return null
}

const ResourcesLoader = () => {
  const routeQueryParams = useQueryParams()
  const {
    cache,
    client,
    idField,
    name: { plural },
    dispatch
  } = useContext(clientContext)

  const apiQueryParams = client.serializeParams(routeQueryParams)
  const cachedPage = cache.pages[apiQueryParams]

  useEffect(() => {
    let mounted = true

    dispatch({
      type: 'SET_RESOURCES',
      payload: cachedPage && cachedPage.map(id => cache.items[id])
    })

    client.list(apiQueryParams).then(data => {
      if (mounted) {
        const resources = data && data[plural]
        if (resources) {
          cache.pages[apiQueryParams] = resources.map(resource => {
            cache.items[resource[idField]] = resource
            return resource[idField]
          })
        }
        dispatch({ type: 'SET_RESOURCES', payload: resources })
      }
    })

    return () => {
      mounted = false
    }
  }, [client, apiQueryParams, plural, idField])

  return null
}

interface IName {
  singular: string
  plural: string
}

const isName = (name: any): name is IName => name && !!(name as IName).singular

interface IResourcePropsBase {
  name?: string | IName
  path?: string
  idField?: string
  children?: React.ReactNode
}

interface IResourcePropsClient {
  apiPrefix?: never
  apiEndpoint?: never
  client?: {
    get: (id: string) => Promise<object>
    list: (params: string | IParams) => Promise<object>
    serializeParams: (params: IParams) => string
  }
  defaultQueryParams?: never
}

interface IResourcePropsEndpoint {
  apiEndpoint?: string
  apiPrefix?: never
  client?: never
  defaultQueryParams?: IParams
}

interface IResourcePropsPrefix {
  apiEndpoint?: never
  apiPrefix?: string
  client?: never
  defaultQueryParams?: IParams
}

type TResourceProps = IResourcePropsBase &
  (IResourcePropsClient | IResourcePropsEndpoint | IResourcePropsPrefix)

interface ResourceStore {
  [path: string]: {
    items: { [id: string]: object }
    pages: { [params: string]: string[] }
  }
}

const resourceStore: ResourceStore = {}

export const Resource = ({
  name: inputName,
  path: inputPath,
  apiPrefix: inputPrefix,
  apiEndpoint: inputEndpoint,
  client: inputClient,
  defaultQueryParams,
  idField = 'id',
  children
}: TResourceProps) => {
  const route = useRouteMatch()
  const contextPrefix = useApiPrefix()

  const path = inputPath || route.path

  const cache =
    resourceStore[path] || (resourceStore[path] = { items: {}, pages: {} })

  const parentResources = useResources()

  const rawName = inputName || path.split('/').pop()

  const name = isName(rawName)
    ? rawName
    : { singular: singularize(rawName), plural: rawName }

  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'SET_RESOURCE':
        return {
          ...state,
          [name.singular]: action.payload
        }
      case 'SET_RESOURCES':
        return {
          [name.plural]: action.payload
        }
    }
  }, {})

  const idParam = `${name.singular}Id`

  const client =
    inputClient ||
    Client.get(
      inputEndpoint ||
        `${(inputPrefix || contextPrefix)
          .replace(/^\/?/, '/')
          .replace(/\/?$/, '')}${path}`,
      defaultQueryParams
    )

  return (
    <Route path={path}>
      <clientContext.Provider
        value={{
          cache,
          client,
          idField,
          idParam,
          name,
          path,
          dispatch
        }}>
        <resourcesContext.Provider
          value={{
            ...parentResources,
            ...state
          }}>
          <List component={ResourcesLoader} />
          <Show component={ResourceLoader} />
          {children}
        </resourcesContext.Provider>
      </clientContext.Provider>
    </Route>
  )
}

export default Resource
