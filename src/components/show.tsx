'use strict'

import React, { useContext } from 'react'
import { Route, useRouteMatch } from 'react-router'

import { clientContext } from './contexts'
import { Renderer, TRendererProps } from './renderer'

const ShowIgnoreNew = (props: TRendererProps) => {
  const route = useRouteMatch()
  const { idParam } = useContext(clientContext)

  const id = route.params[idParam]

  if (id === 'new') {
    return null
  }

  return <Renderer {...props} />
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
