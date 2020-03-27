'use strict'

import React, { useContext, useState, useEffect } from 'react'
import { Route, useRouteMatch } from 'react-router'

import { resourceContext, resourcesContext, useResources } from './contexts'
import { Renderer, TRendererProps } from './renderer'

const RoutedShow = (rendererProps: TRendererProps) => {
  const route = useRouteMatch()
  const {
    cache,
    client,
    idField,
    idParam,
    name: { singular }
  } = useContext(resourceContext)
  const parentResources = useResources()

  const id = route.params[idParam]

  const [error, setError] = useState(null)
  const [resource, setResource] = useState(cache.items[id])

  useEffect(() => {
    let mounted = true

    setResource(cache.items[id])

    client
      .get(id)
      .then(data => {
        if (mounted) {
          const resource = data && data[singular]
          if (resource) {
            cache.items[resource[idField]] = resource
          }
          setResource(resource)
        }
      })
      .catch(err => {
        mounted && setError(err)
      })

    return () => {
      mounted = false
    }
  }, [client, id, singular, idField])

  if (error) {
    return null
  }

  const props = {
    [singular]: resource
  }

  return (
    <resourcesContext.Provider value={{ ...parentResources, ...props }}>
      <Renderer {...rendererProps} props={props} />
    </resourcesContext.Provider>
  )
}

const ShowIgnoreNew = (props: TRendererProps) => {
  const route = useRouteMatch()
  const { idParam } = useContext(resourceContext)

  const id = route.params[idParam]

  if (id === 'new') {
    return null
  }

  return <RoutedShow {...props} />
}

type TShowProps = TRendererProps & { exact?: boolean }

export const Show = ({ exact, ...rendererProps }: TShowProps) => {
  const { idParam, path } = useContext(resourceContext)

  return (
    <Route exact={exact} path={`${path}/:${idParam}`}>
      <ShowIgnoreNew {...rendererProps} />
    </Route>
  )
}

export default Show
