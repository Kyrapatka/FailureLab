import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Folder, FolderOpen, Plus } from 'lucide-react'
import { Dialog } from '../../../shared/ui/Dialog'
import { demoDirectories } from '../../../mocks/fixtures'
import { normalizePath, projectName } from '../model/project'
import type { CreateProjectInput, ProjectsApi } from '../model/types'
import { DuplicatePathError } from '../data/api'

const schema = z.object({
  repositoryPath: z.string().superRefine((value, ctx) => {
    try {
      normalizePath(value)
    } catch (error) {
      ctx.addIssue({ code: 'custom', message: (error as Error).message })
    }
  }),
  name: z.string(),
})

export function AddProject({ api }: { api: ProjectsApi }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      busy={busy}
      title="Add Project"
      description="Connect a repository to your local experiment workspace."
      trigger={
        <button className="button primary">
          <Plus size={16} />
          Add Project
        </button>
      }
    >
      {open && <ProjectForm api={api} close={() => setOpen(false)} onPendingChange={setBusy} />}
    </Dialog>
  )
}

function ProjectForm({
  api,
  close,
  onPendingChange,
}: {
  api: ProjectsApi
  close: () => void
  onPendingChange: (busy: boolean) => void
}) {
  const [browse, setBrowse] = useState(false)
  const customName = useRef(false)
  const submitting = useRef(false)
  const browseButton = useRef<HTMLButtonElement>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(schema),
    defaultValues: { repositoryPath: '', name: '' },
  })
  const mutation = useMutation({
    mutationFn: (input: CreateProjectInput) => api.createProject(input),
  })
  const pending = form.formState.isSubmitting
  const suggestName = (path: string) => {
    if (customName.current) return
    try {
      form.setValue('name', projectName({ repositoryPath: path, name: '' }))
    } catch {
      form.setValue('name', '')
    }
  }
  const submit = async (input: CreateProjectInput) => {
    if (submitting.current) return
    submitting.current = true
    onPendingChange(true)
    try {
      const project = await mutation.mutateAsync(input)
      await queryClient.invalidateQueries({ queryKey: ['projects'] })
      close()
      navigate(`/projects/${project.id}`)
    } catch (error) {
      if (error instanceof DuplicatePathError)
        form.setError('repositoryPath', { message: error.message }, { shouldFocus: true })
      else form.setError('root', { message: (error as Error).message })
    } finally {
      submitting.current = false
      onPendingChange(false)
    }
  }
  const pathField = form.register('repositoryPath')
  const nameField = form.register('name')
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (!submitting.current) void form.handleSubmit(submit)(event)
      }}
      noValidate
      aria-busy={pending}
    >
      <fieldset disabled={pending} className="form-fields">
        <label htmlFor="repository-path">Repository path</label>
        <div className="path-input">
          <input
            id="repository-path"
            {...pathField}
            onChange={(event) => {
              void pathField.onChange(event)
              suggestName(event.target.value)
            }}
            autoComplete="off"
            placeholder="/home/dev/projects/my-api"
            aria-required="true"
            aria-invalid={!!form.formState.errors.repositoryPath}
            aria-describedby={
              form.formState.errors.repositoryPath ? 'path-error path-help' : 'path-help'
            }
          />
          <button
            className="button secondary"
            type="button"
            ref={browseButton}
            aria-expanded={browse}
            aria-controls="demo-directories"
            onClick={() => setBrowse(!browse)}
          >
            <FolderOpen size={16} />
            Browse
          </button>
        </div>
        <p className="field-help" id="path-help">
          Absolute Unix or Windows path. No files will be read or modified.
        </p>
        {form.formState.errors.repositoryPath && (
          <p className="field-error" id="path-error">
            {form.formState.errors.repositoryPath.message}
          </p>
        )}
        {browse && (
          <section className="browse-panel" id="demo-directories" aria-label="Demo directories">
            <h3>Demo directories</h3>
            <p>Mock selection — these folders are not read from your computer.</p>
            {demoDirectories.map((dir) => (
              <button
                type="button"
                key={dir.path}
                onClick={() => {
                  form.setValue('repositoryPath', dir.path, { shouldValidate: true })
                  suggestName(dir.path)
                  setBrowse(false)
                  browseButton.current?.focus()
                }}
              >
                <Folder size={17} />
                <span>
                  <strong>{dir.name}</strong>
                  <code>{dir.path}</code>
                </span>
              </button>
            ))}
          </section>
        )}
        <div className="field-label">
          <label htmlFor="project-name">Project name</label>
          <span className="muted optional">Optional</span>
        </div>
        <input
          id="project-name"
          {...nameField}
          onChange={(event) => {
            customName.current = !!event.target.value.trim()
            void nameField.onChange(event)
          }}
          placeholder="Defaults to directory name"
          autoComplete="off"
        />
        <p className="field-help">Give your project a name, or use the directory name.</p>
      </fieldset>
      {form.formState.errors.root && (
        <p className="form-error" role="alert">
          {form.formState.errors.root.message}
        </p>
      )}
      <div className="notice">
        <FolderGitNote />
        Registration is simulated in MVP-01. Repository availability is not checked.
      </div>
      <div className="dialog-actions">
        <button className="button secondary" type="button" disabled={pending} onClick={close}>
          Cancel
        </button>
        <button className="button primary" disabled={pending} type="submit">
          {pending ? 'Creating…' : 'Create Project'}
        </button>
      </div>
    </form>
  )
}

function FolderGitNote() {
  return <span className="notice-dot" aria-hidden="true" />
}
