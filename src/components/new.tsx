'use strict'

import React from 'react'
import { Route } from 'react-router'

import { useConfig } from './contexts'
import { Renderer, TRendererProps } from './renderer'

export const New = (props: TRendererProps) => {
  const { path } = useConfig()

  return (
    <Route exact path={`${path}/new`}>
      <Renderer {...props} />
    </Route>
  )
}

export default New
