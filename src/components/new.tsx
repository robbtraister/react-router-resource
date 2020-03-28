'use strict'

import React, { useContext } from 'react'
import { Route } from 'react-router'

import { clientContext } from './contexts'
import { Renderer, TRendererProps } from './renderer'

export const New = (props: TRendererProps) => {
  const { path } = useContext(clientContext)

  return (
    <Route exact path={`${path}/new`}>
      <Renderer {...props} />
    </Route>
  )
}

export default New
