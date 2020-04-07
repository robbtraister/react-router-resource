'use strict'

import React from 'react'
import { Route, Switch } from 'react-router'

import { useConfig } from './contexts'
import { Renderer, TRendererProps } from './renderer'

type TShowProps = TRendererProps & { exact?: boolean }

export const Show = ({ exact, ...rendererProps }: TShowProps) => {
  const { idParam, path } = useConfig()

  return (
    <Switch>
      <Route exact path={`${path}/new`} />
      <Route exact path={`${path}/:${idParam}/edit`} />
      <Route exact={exact} path={`${path}/:${idParam}`}>
        <Renderer {...rendererProps} />
      </Route>
    </Switch>
  )
}

export default Show
