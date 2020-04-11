import { useEffect } from 'react'
import { useRouteMatch } from 'react-router'

import { useConfig } from '../contexts'

export const ResourceLoader = () => {
  const route = useRouteMatch()
  const { client, idParam, dispatch } = useConfig()
  const id = route.params[idParam]

  useEffect(() => {
    let mounted = true

    client.get(id, (err, payload, meta) => {
      if (err) {
        return
      }
      if (mounted) {
        dispatch({ type: 'SET_RESOURCE', payload, meta })
      }
    })

    return () => {
      mounted = false
    }
  }, [client, id])

  return null
}

export default ResourceLoader
