'use strict'

import React, { useContext } from 'react'
import { Route } from 'react-router'

import { resourceContext } from './contexts'
import { Renderer, TRendererProps } from './renderer'

export const Edit = (rendererProps: TRendererProps) => {
  const { idParam, path } = useContext(resourceContext)

  return (
    <Route exact path={`${path}/:${idParam}/edit`}>
      <Renderer {...rendererProps} />
    </Route>
  )
}

export default Edit
