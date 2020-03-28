'use strict'

import React, { useContext } from 'react'
import { Route, useHistory, useLocation, useRouteMatch } from 'react-router'

import { clientContext, useResources } from './contexts'
import { Renderer, TRendererProps } from './renderer'

const RoutedShow = (rendererProps: TRendererProps) => {
  const history = useHistory()
  const location = useLocation()
  const match = useRouteMatch()
  const {
    name: { singular }
  } = useContext(clientContext)
  const { [singular]: resource } = useResources()

  const props = {
    history,
    location,
    match,

    [singular]: resource
  }

  return <Renderer {...rendererProps} props={props} />
}

const ShowIgnoreNew = (props: TRendererProps) => {
  const route = useRouteMatch()
  const { idParam } = useContext(clientContext)

  const id = route.params[idParam]

  if (id === 'new') {
    return null
  }

  return <RoutedShow {...props} />
}

type TShowProps = TRendererProps & { exact?: boolean }

export const Show = ({ exact, ...rendererProps }: TShowProps) => {
  const { idParam, path } = useContext(clientContext)

  return (
    <Route exact={exact} path={`${path}/:${idParam}`}>
      <ShowIgnoreNew {...rendererProps} />
    </Route>
  )
}

export default Show
