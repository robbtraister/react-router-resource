'use strict'

import React, { useEffect, useReducer } from 'react'
import { Route, useRouteMatch } from 'react-router'

import { useApiPrefix } from './api-prefix'
import { Client, getName, IName, IParams } from './client'
import {
  configContext,
  resourcesContext,
  useConfig,
  useResources
} from './contexts'
import { List } from './list'
import { Show } from './show'

import { useQueryParams } from '../hooks/useQueryParams'

const ResourceLoader = () => {
  const route = useRouteMatch()
  const { client, idParam, dispatch } = useConfig()
  const id = route.params[idParam]

  useEffect(() => {
    let mounted = true

    client.get(id, (err, payload) => {
      if (err) {
        return
      }
      if (mounted) {
        dispatch({ type: 'SET_RESOURCE', payload })
      }
    })

    return () => {
      mounted = false
    }
  }, [client, id])

  return null
}

const ResourcesLoader = () => {
  const routeQueryParams = useQueryParams()
  const { client, dispatch } = useConfig()

  const apiQueryParams = client.serializeParams(routeQueryParams)

  useEffect(() => {
    let mounted = true

    client.list(apiQueryParams, (err, payload) => {
      if (err) {
        return
      }
      if (mounted) {
        dispatch({ type: 'SET_RESOURCES', payload })
      }
    })

    return () => {
      mounted = false
    }
  }, [client, apiQueryParams])

  return null
}

interface IResourcePropsBase {
  path?: string
  name?: string | IName
  children?: React.ReactNode
}

interface IResourceClientOptions {
  defaultQueryParams?: IParams
  idField?: string
  payloadName?: string | IName
}

interface IResourceEndpointProps extends IResourceClientOptions {
  apiEndpoint?: string
  apiPrefix?: never
  client?: never
}

interface IResourcePrefixProps extends IResourceClientOptions {
  apiEndpoint?: never
  apiPrefix?: string
  client?: never
}

type TNoResourceClientOptions = { [K in keyof IResourceClientOptions]?: never }

interface IResourceClientProps extends TNoResourceClientOptions {
  apiPrefix?: never
  apiEndpoint?: never
  client?: {
    get: (id: string) => Promise<object>
    list: (params: string | IParams) => Promise<object>
    serializeParams: (params: IParams) => string
  }
}

type TResourceProps = IResourcePropsBase &
  (IResourceClientProps | IResourceEndpointProps | IResourcePrefixProps)

const ResourceImpl = ({
  path,
  apiPrefix: inputPrefix,
  apiEndpoint: inputEndpoint,
  client: inputClient,
  defaultQueryParams,
  idField = 'id',
  name,
  payloadName,
  children
}: TResourceProps & { path: string }) => {
  const match = useRouteMatch()
  const contextPrefix = useApiPrefix()
  const parentResources = useResources()

  const url = path.startsWith(match.path)
    ? `${match.url}${path.slice(match.path.length)}`
    : path

  const resourceName = getName(name || path.split('/').pop())

  const client =
    inputClient ||
    Client.get({
      endpoint:
        inputEndpoint ||
        `${(inputPrefix || contextPrefix)
          .replace(/^\/?/, '/')
          .replace(/\/?$/, '')}${url}`,
      name: payloadName || resourceName,
      idField,
      defaultQueryParams
    })

  const idParam = `${resourceName.singular}_${client.idField}`

  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'SET_RESOURCE':
        return {
          // ...state,
          [idParam]: action.payload && action.payload[client.idField],
          [resourceName.singular]: action.payload
        }
      case 'SET_RESOURCES':
        return {
          [resourceName.plural]: action.payload
        }
    }
    return state
  }, {})

  return (
    <configContext.Provider
      value={{
        client,
        idParam,
        name: resourceName,
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
    </configContext.Provider>
  )
}

// wrapper for Route component to hydrate match.url so we can use it in ResourceImpl
export const Resource = (props: TResourceProps) => {
  const match = useRouteMatch()
  const path = (props.path || match.path).replace(/\/$/, '')

  return (
    <Route path={path}>
      <ResourceImpl {...props} path={path} />
    </Route>
  )
}

export default Resource
