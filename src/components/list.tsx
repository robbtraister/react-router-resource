'use strict'

import React, { useContext, useState, useEffect } from 'react'
import { Route } from 'react-router'

import { resourceContext, resourcesContext, useResources } from './contexts'
import { Renderer, TRendererProps } from './renderer'

import { useQueryParams } from '../hooks/useQueryParams'

const RoutedList = (rendererProps: TRendererProps) => {
  const routeQueryParams = useQueryParams()
  const {
    cache,
    client,
    idField,
    name: { plural }
  } = useContext(resourceContext)
  const parentResources = useResources()

  const apiQueryParams = client.serializeParams(routeQueryParams)
  const cachedPage = cache.pages[apiQueryParams]

  const [error, setError] = useState(null)
  const [resources, setResources] = useState(
    cachedPage ? cachedPage.map(id => cache.items[id]) : null
  )

  useEffect(() => {
    let mounted = true

    setResources(cachedPage && cachedPage.map(id => cache.items[id]))

    client
      .list(apiQueryParams)
      .then(data => {
        if (mounted) {
          const resources = data && data[plural]
          if (resources) {
            cache.pages[apiQueryParams] = resources.map(resource => {
              cache.items[resource[idField]] = resource
              return resource[idField]
            })
          }
          setResources(resources)
        }
      })
      .catch(err => {
        mounted && setError(err)
      })

    return () => {
      mounted = false
    }
  }, [client, apiQueryParams, plural, idField])

  if (error) {
    return null
  }

  const props = {
    [plural]: resources
  }

  return (
    <resourcesContext.Provider value={{ ...parentResources, ...props }}>
      <Renderer {...rendererProps} props={props} />
    </resourcesContext.Provider>
  )
}

export const List = (props: TRendererProps) => {
  const { path } = useContext(resourceContext)

  return (
    <Route exact path={path}>
      <RoutedList {...props} />
    </Route>
  )
}

export const Index = List

export default List
