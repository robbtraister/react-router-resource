'use strict'

import { createContext, useContext } from 'react'

import { IClient, IName } from './client'

interface IClientConfig {
  client: IClient
  idParam: string
  name: IName
  path: string
  dispatch: React.Dispatch<any>
}

export const configContext = createContext<IClientConfig>(null)

export const resourcesContext = createContext({})

export const useClient = () => useContext(configContext).client
export const useConfig = () => useContext(configContext)
export const useResources = () => useContext(resourcesContext)
