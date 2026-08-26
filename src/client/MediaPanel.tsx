import { useState } from 'react'
import {
  imageGenerationRequest,
  mediaModelsRequest,
  videoDownloadRequest,
  videoGenerationRequest,
  videoStatusRequest,
} from './media.ts'

interface MediaPanelProps {
  locked: boolean
  sendPrompt: (prompt: string) => Promise<boolean>
  onSubmitted: () => void
  t: (key: string, params?: Record<string, unknown>) => string
}

type PendingAction = 'models' | 'image' | 'video' | 'status' | 'download'

export function MediaPanel({ locked, sendPrompt, onSubmitted, t }: MediaPanelProps) {
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageModel, setImageModel] = useState('')
  const [imageOutputName, setImageOutputName] = useState('')
  const [videoPrompt, setVideoPrompt] = useState('')
  const [videoModel, setVideoModel] = useState('')
  const [videoDuration, setVideoDuration] = useState('')
  const [jobId, setJobId] = useState('')
  const [videoOutputName, setVideoOutputName] = useState('')
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async (action: PendingAction, request: () => string) => {
    if (locked || pending !== null) return
    setError(null)
    let prompt: string
    try {
      prompt = request()
    } catch {
      setError(action === 'image' || action === 'video' ? t('media.promptRequired') : t('media.jobRequired'))
      return
    }
    setPending(action)
    const accepted = await sendPrompt(prompt)
    setPending(null)
    if (!accepted) {
      setError(t('media.sendFailed'))
      return
    }
    onSubmitted()
  }

  const parsedDuration = videoDuration.trim() === '' ? undefined : Number(videoDuration)
  const busy = pending !== null

  return (
    <main className="dmp-media">
      <div className="dmp-media-intro">
        <div>
          <strong>{t('media.title')}</strong>
          <span>{t('media.intro')}</span>
        </div>
        <span className="dmp-media-safety">{t('media.freeOnly')}</span>
      </div>

      {error !== null && <div className="dmp-media-error">{error}</div>}

      <section className="dmp-media-card dmp-media-models">
        <div className="dmp-media-card-heading">
          <span className="dmp-media-icon" aria-hidden="true">⌕</span>
          <div><h3>{t('media.modelsTitle')}</h3><p>{t('media.modelsDescription')}</p></div>
        </div>
        <div className="dmp-media-actions">
          <button type="button" disabled={locked || busy} onClick={() => void submit('models', () => mediaModelsRequest('image'))}>{t('media.imageModels')}</button>
          <button type="button" disabled={locked || busy} onClick={() => void submit('models', () => mediaModelsRequest('video'))}>{t('media.videoModels')}</button>
          <button type="button" disabled={locked || busy} onClick={() => void submit('models', () => mediaModelsRequest('all'))}>{t('media.allModels')}</button>
        </div>
      </section>

      <div className="dmp-media-grid">
        <section className="dmp-media-card">
          <div className="dmp-media-card-heading">
            <span className="dmp-media-icon" aria-hidden="true">▧</span>
            <div><h3>{t('media.imageTitle')}</h3><p>{t('media.imageDescription')}</p></div>
          </div>
          <label className="dmp-media-field dmp-media-field-wide">
            <span>{t('media.prompt')}</span>
            <textarea value={imagePrompt} onChange={(event) => setImagePrompt(event.currentTarget.value)} placeholder={t('media.imagePromptPlaceholder')} />
          </label>
          <div className="dmp-media-fields">
            <label className="dmp-media-field">
              <span>{t('media.modelOptional')}</span>
              <input value={imageModel} onChange={(event) => setImageModel(event.currentTarget.value)} placeholder={t('media.autoFreeModel')} />
            </label>
            <label className="dmp-media-field">
              <span>{t('media.outputOptional')}</span>
              <input value={imageOutputName} onChange={(event) => setImageOutputName(event.currentTarget.value)} placeholder="my-image" />
            </label>
          </div>
          <button className="dmp-media-primary" type="button" disabled={locked || busy} onClick={() => void submit('image', () => imageGenerationRequest({ prompt: imagePrompt, model: imageModel, outputName: imageOutputName }))}>
            {pending === 'image' ? t('media.sending') : t('media.generateImage')}
          </button>
        </section>

        <section className="dmp-media-card">
          <div className="dmp-media-card-heading">
            <span className="dmp-media-icon" aria-hidden="true">▷</span>
            <div><h3>{t('media.videoTitle')}</h3><p>{t('media.videoDescription')}</p></div>
          </div>
          <label className="dmp-media-field dmp-media-field-wide">
            <span>{t('media.prompt')}</span>
            <textarea value={videoPrompt} onChange={(event) => setVideoPrompt(event.currentTarget.value)} placeholder={t('media.videoPromptPlaceholder')} />
          </label>
          <div className="dmp-media-fields">
            <label className="dmp-media-field">
              <span>{t('media.modelOptional')}</span>
              <input value={videoModel} onChange={(event) => setVideoModel(event.currentTarget.value)} placeholder={t('media.autoFreeModel')} />
            </label>
            <label className="dmp-media-field dmp-media-duration">
              <span>{t('media.durationOptional')}</span>
              <input type="number" min="1" max="60" step="1" value={videoDuration} onChange={(event) => setVideoDuration(event.currentTarget.value)} placeholder="5" />
            </label>
          </div>
          <button className="dmp-media-primary" type="button" disabled={locked || busy} onClick={() => void submit('video', () => videoGenerationRequest({ prompt: videoPrompt, model: videoModel, duration: parsedDuration }))}>
            {pending === 'video' ? t('media.sending') : t('media.generateVideo')}
          </button>
        </section>
      </div>

      <section className="dmp-media-card dmp-media-jobs">
        <div className="dmp-media-card-heading">
          <span className="dmp-media-icon" aria-hidden="true">↓</span>
          <div><h3>{t('media.jobsTitle')}</h3><p>{t('media.jobsDescription')}</p></div>
        </div>
        <div className="dmp-media-job-row">
          <label className="dmp-media-field">
            <span>{t('media.jobId')}</span>
            <input value={jobId} onChange={(event) => setJobId(event.currentTarget.value)} placeholder="generation-id" />
          </label>
          <label className="dmp-media-field">
            <span>{t('media.outputOptional')}</span>
            <input value={videoOutputName} onChange={(event) => setVideoOutputName(event.currentTarget.value)} placeholder="my-video" />
          </label>
          <div className="dmp-media-actions dmp-media-job-actions">
            <button type="button" disabled={locked || busy} onClick={() => void submit('status', () => videoStatusRequest(jobId))}>{pending === 'status' ? t('media.sending') : t('media.checkStatus')}</button>
            <button className="dmp-media-primary" type="button" disabled={locked || busy} onClick={() => void submit('download', () => videoDownloadRequest(jobId, videoOutputName))}>{pending === 'download' ? t('media.sending') : t('media.downloadVideo')}</button>
          </div>
        </div>
      </section>
    </main>
  )
}
