'use strict'

import React, { useMemo, useReducer } from 'react'
import { Route, useRouteMatch } from 'react-router'

import { ResourceLoader } from './resource-loader'
import { ResourcesLoader } from './resources-loader'

import { useApiPrefix } from '../api-prefix'
import { configContext, resourcesContext, useResources } from '../contexts'
import { List } from '../list'
import { Show } from '../show'

import { Client, getName, Name, Query } from '../../client'

interface IResourcePropsBase {
  path?: string
  name?: string | Name
  idParam?: string
  children?: React.ReactNode
}

interface IResourceClientOptions {
  defaultQuery?: Query
  idField?: string
  payloadName?: string | Name
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
  client?: Client<any>
}

type TResourceProps = IResourcePropsBase &
  (IResourceClientProps | IResourceEndpointProps | IResourcePrefixProps)

const ResourceImpl = ({
  path,
  apiPrefix: inputPrefix,
  apiEndpoint: inputEndpoint,
  client: inputClient,
  defaultQuery,
  idField = 'id',
  idParam: inputIdParam,
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

  const resourceName = useMemo(
    () => getName(name || (path.split('/').pop() as string)) as Name,
    [name, path]
  )

  const client = useMemo(
    () =>
      inputClient ||
      Client.getInstance({
        endpoint:
          inputEndpoint ||
          `${(inputPrefix || contextPrefix || '/api/v1')
            .replace(/^\/?/, '/')
            .replace(/\/?$/, '')}${url}`,
        name: payloadName || resourceName,
        idField,
        defaultQuery
      }),
    [
      inputClient,
      inputEndpoint,
      inputPrefix,
      contextPrefix,
      payloadName,
      resourceName,
      idField,
      defaultQuery
    ]
  )

  const idParam = inputIdParam || `${resourceName.singular}_${client.idField}`

  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'SET_RESOURCE':
        return {
          // ...state,
          [idParam]: action.payload && action.payload[client.idField],
          [resourceName.singular as string]: action.payload,
          [`${resourceName.singular}_meta`]: action.meta
        }
      case 'SET_RESOURCES':
        return {
          [resourceName.plural as string]: action.payload,
          [`${resourceName.plural}_meta`]: action.meta
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
        {/* load the list of resources to make them available on context */}
        <List component={ResourcesLoader} />
        {/* load the single resource to make it available on context */}
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
