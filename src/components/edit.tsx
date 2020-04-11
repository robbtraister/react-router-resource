'use strict'

import React from 'react'
import { Route } from 'react-router'

import { useConfig } from './contexts'
import { Renderer, TRendererProps } from './renderer'

export const Edit = (props: TRendererProps) => {
  const { idParam, path } = useConfig()

  return (
    <Route exact path={`${path}/:${idParam}/edit`}>
      <Renderer {...props} />
    </Route>
  )
}

export default Edit
