'use strict'

import { singular as singularize } from 'pluralize'
import React from 'react'
import { Route, useRouteMatch } from 'react-router'

import { useApiPrefix } from './api-prefix'
import { Client, IParams } from './client'
import { resourceContext } from './contexts'

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

  const rawName = inputName || path.split('/').pop()

  const name = isName(rawName)
    ? rawName
    : { singular: singularize(rawName), plural: rawName }

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
      <resourceContext.Provider
        value={{
          cache,
          client,
          idField,
          idParam,
          name,
          path
        }}>
        {children}
      </resourceContext.Provider>
    </Route>
  )
}

export default Resource
