'use strict'

import React, { useContext } from 'react'
import { Route } from 'react-router'

import { resourceContext } from './contexts'
import { Renderer, TRendererProps } from './renderer'

export const New = (rendererProps: TRendererProps) => {
  const { path } = useContext(resourceContext)

  return (
    <Route exact path={`${path}/new`}>
      <Renderer {...rendererProps} />
    </Route>
  )
}

export default New
