import { useEffect } from 'react'

import { useConfig } from '../contexts'

import { useQueryParams } from '../../hooks/useQueryParams'

export const ResourcesLoader = () => {
  const routeQueryParams = useQueryParams()
  const { client, dispatch } = useConfig()

  const queryString = client.serializeQuery(routeQueryParams)

  useEffect(() => {
    let mounted = true

    client.find(queryString, (err, payload, meta) => {
      if (err) {
        return
      }
      if (mounted) {
        dispatch({ type: 'SET_RESOURCES', payload, meta })
      }
    })

    return () => {
      mounted = false
    }
  }, [client, queryString])

  return null
}

export default ResourcesLoader
