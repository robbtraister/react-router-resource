import React from 'react'

import {
  ApiPrefix,
  Resource,
  Index,
  Show
  // useResources
} from '../src/components'

interface Project {
  id: string
  name: string
}

const ProjectsIndex = ({ projects }: { projects: Project[] }) => {
  return (
    <ul>
      {projects.map(project => (
        <li key={project.id}>{project.name}</li>
      ))}
    </ul>
  )
}

const DatasetsShow = () => {
  return <h1>Dataset</h1>
}

interface Workflow {
  id: string
  name: string
}

const WorkflowsShow = ({ workflow }: { workflow: Workflow }) => {
  return <h1>{workflow.name}</h1>
}

export const Projects = () => {
  return (
    <ApiPrefix value="/api/v1">
      <Resource name="project">
        <Show>
          <Resource name="dataset">
            {/* <Index component={WorkflowsIndex} /> */}
            <Show component={DatasetsShow} />
          </Resource>
          <Resource name="workflow">
            {/* <Index component={WorkflowsIndex} /> */}
            <Show component={WorkflowsShow} />
          </Resource>
        </Show>
        <Index component={ProjectsIndex} />
      </Resource>
    </ApiPrefix>
  )
}
