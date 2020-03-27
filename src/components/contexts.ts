'use strict'

import { createContext, useContext } from 'react'

import { IParams } from './client'

export const resourceContext = createContext({
  cache: {
    items: {},
    pages: {}
  },
  client: {
    get: id => Promise.resolve(undefined),
    list: (params: string | IParams) => Promise.resolve(undefined),
    serializeParams: (params: IParams) => undefined
  },
  idField: 'id',
  idParam: null,
  name: {
    singular: null,
    plural: null
  },
  path: '/'
})

export const resourcesContext = createContext({})

export const useResources = () => useContext(resourcesContext)
