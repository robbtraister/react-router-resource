'use strict'

import React, { useContext } from 'react'
import { Route } from 'react-router'

import { clientContext } from './contexts'
import { Renderer, TRendererProps } from './renderer'

export const Edit = (props: TRendererProps) => {
  const { idParam, path } = useContext(clientContext)

  return (
    <Route exact path={`${path}/:${idParam}/edit`}>
      <Renderer {...props} />
    </Route>
  )
}

export default Edit
