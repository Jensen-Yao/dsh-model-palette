import { useCallback, useEffect, useState } from 'react'
import {
  downloadAgnesVideo,
  downloadVideo,
  generateAgnesImage,
  generateAgnesVideo,
  generateImage,
  generatePollinationsImage,
  generateVideo,
  getAgnesVideoStatus,
  getVideoStatus,
  listAgnesMediaModels,
  listMediaModels,
  listPollinationsModels,
  mediaModelNeedsConfirmation,
  pickDefaultMediaModel,
  type AgnesMediaModels,
  type MediaCatalog,
  type MediaModel,
  type PollinationsModel,
} from './media-api.ts'

interface MediaPanelProps {
  t: (key: string, params?: Record<string, unknown>) => string
}

type PendingAction = 'catalog' | 'image' | 'video' | 'status' | 'download' | 'pollinations-models' | 'pollinations-image' | 'agnes-models' | 'agnes-image' | 'agnes-video' | 'agnes-status' | 'agnes-download'

interface Feedback {
  title: string
  detail: string
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function selectedModel(current: string, models: readonly MediaModel[], allowPaid: boolean): string {
  return models.some((model) => model.id === current) ? current : pickDefaultMediaModel(models, allowPaid)
}

function modelLabel(model: MediaModel, allowPaid: boolean, t: MediaPanelProps['t']): string {
  const name = model.name?.trim()
  const identity = name === undefined || name === '' || name === model.id ? model.id : `${name} · ${model.id}`
  const price = model.free ? t('media.free') : allowPaid ? t('media.paidAllowed') : t('media.unverifiedFree')
  return `${model.preferred ? '★ ' : ''}${identity} · ${price}`
}

export function MediaPanel({ t }: MediaPanelProps) {
  const [catalog, setCatalog] = useState<MediaCatalog | null>(null)
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageModel, setImageModel] = useState('')
  const [imageOutputName, setImageOutputName] = useState('')
  const [imageChargeConfirmed, setImageChargeConfirmed] = useState(false)
  const [imageProvider, setImageProvider] = useState<'openrouter' | 'pollinations' | 'agnes'>('openrouter')
  const [videoProvider, setVideoProvider] = useState<'openrouter' | 'agnes'>('openrouter')
  const [agnesModels, setAgnesModels] = useState<AgnesMediaModels | null>(null)
  const [agnesImageModel, setAgnesImageModel] = useState('')
  const [agnesImageSize, setAgnesImageSize] = useState('1K')
  const [agnesImageRatio, setAgnesImageRatio] = useState('1:1')
  const [agnesVideoSeconds, setAgnesVideoSeconds] = useState('5')
  const [agnesVideoRatio, setAgnesVideoRatio] = useState('16:9')
  const [agnesJobId, setAgnesJobId] = useState('')
  const [pollinationsModels, setPollinationsModels] = useState<PollinationsModel[] | null>(null)
  const [pollinationsModel, setPollinationsModel] = useState('')
  const [pollinationsWidth, setPollinationsWidth] = useState('1024')
  const [pollinationsHeight, setPollinationsHeight] = useState('1024')
  const [pollinationsUnavailable, setPollinationsUnavailable] = useState<string | null>(null)
  const [videoPrompt, setVideoPrompt] = useState('')
  const [videoModel, setVideoModel] = useState('')
  const [videoDuration, setVideoDuration] = useState('')
  const [videoChargeConfirmed, setVideoChargeConfirmed] = useState(false)
  const [jobId, setJobId] = useState('')
  const [videoOutputName, setVideoOutputName] = useState('')
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const loadCatalog = useCallback(async () => {
    setPending('catalog')
    setError(null)
    try {
      const next = await listMediaModels()
      setCatalog(next)
      setImageModel((current) => selectedModel(current, next.images, next.paid_images_enabled))
      setVideoModel((current) => selectedModel(current, next.videos, next.paid_videos_enabled))
      setImageChargeConfirmed(false)
      setVideoChargeConfirmed(false)
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setPending(null)
    }
  }, [])

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  const loadPollinationsModels = useCallback(async () => {
    setPending('pollinations-models')
    setPollinationsUnavailable(null)
    try {
      const models = await listPollinationsModels()
      setPollinationsModels(models)
      setPollinationsModel((current) => (models.some((model) => model.id === current) ? current : (models[0]?.id ?? '')))
    } catch (cause) {
      setPollinationsModels([])
      setPollinationsModel('flux')
      setPollinationsUnavailable(errorMessage(cause))
    } finally {
      setPending(null)
    }
  }, [])

  useEffect(() => {
    if (imageProvider === 'pollinations' && pollinationsModels === null) void loadPollinationsModels()
  }, [imageProvider, pollinationsModels, loadPollinationsModels])

  const loadAgnesModels = useCallback(async () => {
    setPending('agnes-models')
    try {
      const value = await listAgnesMediaModels()
      setAgnesModels(value)
      setAgnesImageModel((current) => (value.images.some((row) => row.id === current) ? current : (value.images[0]?.id ?? '')))
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setPending(null)
    }
  }, [])

  useEffect(() => {
    if ((imageProvider === 'agnes' || videoProvider === 'agnes') && agnesModels === null) void loadAgnesModels()
  }, [imageProvider, videoProvider, agnesModels, loadAgnesModels])

  const run = async (action: Exclude<PendingAction, 'catalog'>, operation: () => Promise<Feedback>) => {
    if (pending !== null) return
    setPending(action)
    setError(null)
    setFeedback(null)
    try {
      setFeedback(await operation())
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setPending(null)
    }
  }

  const submitPollinationsImage = () => run('pollinations-image', async () => {
    if (imagePrompt.trim() === '') throw new Error(t('media.promptRequired'))
    const width = Number(pollinationsWidth)
    const height = Number(pollinationsHeight)
    if (!Number.isInteger(width) || width < 64 || width > 2048) throw new Error(t('media.dimensionInvalid'))
    if (!Number.isInteger(height) || height < 64 || height > 2048) throw new Error(t('media.dimensionInvalid'))
    const result = await generatePollinationsImage({
      prompt: imagePrompt.trim(),
      ...(pollinationsModel === '' ? {} : { model: pollinationsModel }),
      width,
      height,
      ...(imageOutputName.trim() === '' ? {} : { outputName: imageOutputName.trim() }),
    })
    return { title: t('media.imageDone'), detail: result.files.map((file) => file.path).join('\n') }
  })

  const submitAgnesImage = () => run('agnes-image', async () => {
    if (imagePrompt.trim() === '') throw new Error(t('media.promptRequired'))
    const result = await generateAgnesImage({
      prompt: imagePrompt.trim(),
      ...(agnesImageModel === '' ? {} : { model: agnesImageModel }),
      size: agnesImageSize,
      ratio: agnesImageRatio,
      ...(imageOutputName.trim() === '' ? {} : { outputName: imageOutputName.trim() }),
    })
    return { title: t('media.imageDone'), detail: result.files.map((file) => file.path).join('\n') }
  })

  const submitAgnesVideo = () => run('agnes-video', async () => {
    if (videoPrompt.trim() === '') throw new Error(t('media.promptRequired'))
    const seconds = Number(agnesVideoSeconds)
    if (!Number.isInteger(seconds) || seconds < 4 || seconds > 12) throw new Error(t('media.agnesSecondsInvalid'))
    const result = await generateAgnesVideo({ prompt: videoPrompt.trim(), seconds, aspect_ratio: agnesVideoRatio })
    setJobId(result.id)
    setAgnesJobId(result.id)
    return { title: t('media.videoSubmitted'), detail: `${result.id}${result.status === undefined ? '' : ` · ${result.status}`}` }
  })

  const checkAgnesStatus = () => run('agnes-status', async () => {
    if (agnesJobId.trim() === '' && jobId.trim() === '') throw new Error(t('media.jobRequired'))
    const result = await getAgnesVideoStatus((agnesJobId.trim() !== '' ? agnesJobId : jobId).trim())
    return { title: t('media.statusDone'), detail: JSON.stringify(result, null, 2) }
  })

  const downloadAgnes = () => run('agnes-download', async () => {
    if (agnesJobId.trim() === '' && jobId.trim() === '') throw new Error(t('media.jobRequired'))
    const result = await downloadAgnesVideo((agnesJobId.trim() !== '' ? agnesJobId : jobId).trim(), videoOutputName.trim() === '' ? undefined : videoOutputName.trim())
    return { title: t('media.downloadDone'), detail: result.path }
  })

  const submitImage = () => run('image', async () => {
    if (imageModel === '') throw new Error(t('media.modelRequired'))
    if (imageNeedsConfirmation && !imageChargeConfirmed) throw new Error(t('media.manualPaidRequired'))
    if (imagePrompt.trim() === '') throw new Error(t('media.promptRequired'))
    const acknowledgePossibleCharge = imageNeedsConfirmation && imageChargeConfirmed
    if (acknowledgePossibleCharge) setImageChargeConfirmed(false)
    const result = await generateImage({
      model: imageModel,
      prompt: imagePrompt.trim(),
      ...(imageOutputName.trim() === '' ? {} : { outputName: imageOutputName.trim() }),
      ...(acknowledgePossibleCharge ? { acknowledgePossibleCharge: true } : {}),
    })
    return { title: t('media.imageDone'), detail: `${result.manual_paid_override ? `${t('media.manualPaidUsed')}\n` : ''}${result.files.map((file) => file.path).join('\n')}` }
  })

  const submitVideo = () => run('video', async () => {
    if (videoModel === '') throw new Error(t('media.modelRequired'))
    if (videoNeedsConfirmation && !videoChargeConfirmed) throw new Error(t('media.manualPaidRequired'))
    if (videoPrompt.trim() === '') throw new Error(t('media.promptRequired'))
    const duration = videoDuration.trim() === '' ? undefined : Number(videoDuration)
    if (duration !== undefined && (!Number.isInteger(duration) || duration < 1 || duration > 60)) throw new Error(t('media.durationInvalid'))
    const acknowledgePossibleCharge = videoNeedsConfirmation && videoChargeConfirmed
    if (acknowledgePossibleCharge) setVideoChargeConfirmed(false)
    const result = await generateVideo({ model: videoModel, prompt: videoPrompt.trim(), ...(duration === undefined ? {} : { duration }), ...(acknowledgePossibleCharge ? { acknowledgePossibleCharge: true } : {}) })
    setJobId(result.id)
    return { title: t('media.videoSubmitted'), detail: `${result.manual_paid_override ? `${t('media.manualPaidUsed')}\n` : ''}${result.id}${result.status === undefined ? '' : ` · ${result.status}`}` }
  })

  const checkStatus = () => run('status', async () => {
    if (jobId.trim() === '') throw new Error(t('media.jobRequired'))
    const result = await getVideoStatus(jobId.trim())
    return { title: t('media.statusDone'), detail: JSON.stringify(result, null, 2) }
  })

  const download = () => run('download', async () => {
    if (jobId.trim() === '') throw new Error(t('media.jobRequired'))
    const result = await downloadVideo(jobId.trim(), videoOutputName.trim() === '' ? undefined : videoOutputName.trim())
    return { title: t('media.downloadDone'), detail: result.path }
  })

  const busy = pending !== null
  const images = catalog?.images ?? []
  const videos = catalog?.videos ?? []
  const freeImages = images.filter((model) => model.free).length
  const freeVideos = videos.filter((model) => model.free).length
  const imageSelectionAvailable = imageModel !== ''
  const videoSelectionAvailable = videoModel !== ''
  const paidImagesEnabled = catalog?.paid_images_enabled === true
  const paidVideosEnabled = catalog?.paid_videos_enabled === true
  const selectedImage = images.find((model) => model.id === imageModel)
  const selectedVideo = videos.find((model) => model.id === videoModel)
  const imageNeedsConfirmation = selectedImage !== undefined && mediaModelNeedsConfirmation(selectedImage, paidImagesEnabled)
  const videoNeedsConfirmation = selectedVideo !== undefined && mediaModelNeedsConfirmation(selectedVideo, paidVideosEnabled)
  const imageCanSubmit = imageSelectionAvailable && (!imageNeedsConfirmation || imageChargeConfirmed)
  const videoCanSubmit = videoSelectionAvailable && (!videoNeedsConfirmation || videoChargeConfirmed)

  return (
    <main className="dmp-media">
      <div className="dmp-media-intro">
        <div>
          <strong>{t('media.title')}</strong>
          <span>{t('media.intro')}</span>
        </div>
        <span className="dmp-media-safety">{t('media.priceProtection')}</span>
      </div>

      <section className="dmp-media-catalog" aria-live="polite">
        <div>
          <strong>{t('media.catalog')}</strong>
          <span>{pending === 'catalog' ? t('media.catalogLoading') : `${images.length} ${t('media.imageCount')}（${freeImages} ${t('media.free')}） · ${videos.length} ${t('media.videoCount')}（${freeVideos} ${t('media.free')}）`}</span>
        </div>
        <button type="button" disabled={busy} onClick={() => void loadCatalog()}>{t('media.refresh')}</button>
      </section>

      {error !== null && <div className="dmp-media-error" role="alert">{error}</div>}
      {feedback !== null && <div className="dmp-media-feedback" aria-live="polite"><strong>{feedback.title}</strong><pre>{feedback.detail}</pre></div>}

      <div className="dmp-media-grid">
        <section className="dmp-media-card">
          <div className="dmp-media-card-heading">
            <span className="dmp-media-icon" aria-hidden="true">▧</span>
            <div><h3>{t('media.imageTitle')}</h3><p>{t('media.imageDescription')}</p></div>
          </div>
          <div className="dmp-media-provider-row" role="radiogroup" aria-label={t('media.imageProvider')}>
            {(['openrouter', 'pollinations', 'agnes'] as const).map((provider) => (
              <button
                key={provider}
                type="button"
                role="radio"
                aria-checked={imageProvider === provider}
                className={imageProvider === provider ? 'is-active' : ''}
                disabled={busy}
                onClick={() => setImageProvider(provider)}
              >{t(provider === 'openrouter' ? 'media.providerOpenRouter' : provider === 'pollinations' ? 'media.providerPollinations' : 'media.providerAgnes')}</button>
            ))}
          </div>
          {imageProvider === 'agnes' ? (
            <>
              {agnesModels !== null && !agnesModels.credential_ready && <p className="dmp-media-hint" role="alert">{t('media.agnesKeyMissing')}</p>}
              <label className="dmp-media-field">
                <span>{t('media.model')}</span>
                <select value={agnesImageModel} onChange={(event) => setAgnesImageModel(event.currentTarget.value)} disabled={busy}>
                  {(agnesModels?.images ?? []).map((row) => <option key={row.id} value={row.id}>{row.id}</option>)}
                </select>
              </label>
              <div className="dmp-media-dimensions">
                <label className="dmp-media-field">
                  <span>{t('media.size')}</span>
                  <select value={agnesImageSize} onChange={(event) => setAgnesImageSize(event.currentTarget.value)} disabled={busy}>
                    {(agnesModels?.images[0]?.supported_sizes ?? ['1K', '2K', '3K', '4K']).map((size) => <option key={size} value={size}>{size}</option>)}
                  </select>
                </label>
                <label className="dmp-media-field">
                  <span>{t('media.ratio')}</span>
                  <select value={agnesImageRatio} onChange={(event) => setAgnesImageRatio(event.currentTarget.value)} disabled={busy}>
                    {(agnesModels?.images[0]?.supported_ratios ?? ['1:1']).map((ratio) => <option key={ratio} value={ratio}>{ratio}</option>)}
                  </select>
                </label>
              </div>
            </>
          ) : imageProvider === 'pollinations' ? (
            <>
              <label className="dmp-media-field">
                <span>{t('media.model')}</span>
                <select value={pollinationsModel} onChange={(event) => setPollinationsModel(event.currentTarget.value)} disabled={busy}>
                  {(pollinationsModels ?? [{ id: 'flux', free: true }]).map((model) => <option key={model.id} value={model.id}>{model.id}</option>)}
                </select>
              </label>
              {pollinationsUnavailable !== null && <p className="dmp-media-hint" role="status">{t('media.pollinationsFallback', { message: pollinationsUnavailable })}</p>}
              <div className="dmp-media-dimensions">
                <label className="dmp-media-field">
                  <span>{t('media.width')}</span>
                  <input type="number" min="64" max="2048" step="1" value={pollinationsWidth} onChange={(event) => setPollinationsWidth(event.currentTarget.value)} disabled={busy} />
                </label>
                <label className="dmp-media-field">
                  <span>{t('media.height')}</span>
                  <input type="number" min="64" max="2048" step="1" value={pollinationsHeight} onChange={(event) => setPollinationsHeight(event.currentTarget.value)} disabled={busy} />
                </label>
              </div>
            </>
          ) : (
          <label className="dmp-media-field">
            <span>{t('media.model')}</span>
            <select value={imageModel} onChange={(event) => { setImageModel(event.currentTarget.value); setImageChargeConfirmed(false) }} disabled={busy || images.length === 0}>
              {images.length === 0 && <option value="">{t('media.noModels')}</option>}
              {images.length > 0 && !imageSelectionAvailable && <option value="">{t('media.chooseModel')}</option>}
              {images.map((model) => <option key={model.id} value={model.id}>{modelLabel(model, paidImagesEnabled, t)}</option>)}
            </select>
          </label>
          )}
          {imageProvider === 'openrouter' && imageNeedsConfirmation && <label className="dmp-media-paid-confirm">
            <input type="checkbox" checked={imageChargeConfirmed} onChange={(event) => setImageChargeConfirmed(event.currentTarget.checked)} disabled={busy} />
            <span><strong>{t('media.manualPaidTitle')}</strong><small>{t('media.manualPaidDescription')}</small></span>
          </label>}
          <label className="dmp-media-field dmp-media-field-wide">
            <span>{t('media.prompt')}</span>
            <textarea value={imagePrompt} onChange={(event) => setImagePrompt(event.currentTarget.value)} placeholder={t('media.imagePromptPlaceholder')} />
          </label>
          <label className="dmp-media-field">
            <span>{t('media.outputOptional')}</span>
            <input value={imageOutputName} onChange={(event) => setImageOutputName(event.currentTarget.value)} placeholder="my-image" />
          </label>
          {imageProvider === 'agnes' ? (
            <button className="dmp-media-primary" type="button" disabled={busy} onClick={() => void submitAgnesImage()}>
              {pending === 'agnes-image' ? t('media.running') : t('media.generateImage')}
            </button>
          ) : imageProvider === 'pollinations' ? (
            <button className="dmp-media-primary" type="button" disabled={busy} onClick={() => void submitPollinationsImage()}>
              {pending === 'pollinations-image' ? t('media.running') : t('media.generateImage')}
            </button>
          ) : (
          <button className="dmp-media-primary" type="button" disabled={busy || !imageCanSubmit} onClick={() => void submitImage()}>
            {pending === 'image' ? t('media.running') : t('media.generateImage')}
          </button>
          )}
        </section>

        <section className="dmp-media-card">
          <div className="dmp-media-card-heading">
            <span className="dmp-media-icon" aria-hidden="true">▷</span>
            <div><h3>{t('media.videoTitle')}</h3><p>{t('media.videoDescription')}</p></div>
          </div>
          <div className="dmp-media-provider-row" role="radiogroup" aria-label={t('media.videoProvider')}>
            {(['openrouter', 'agnes'] as const).map((provider) => (
              <button
                key={provider}
                type="button"
                role="radio"
                aria-checked={videoProvider === provider}
                className={videoProvider === provider ? 'is-active' : ''}
                disabled={busy}
                onClick={() => setVideoProvider(provider)}
              >{t(provider === 'openrouter' ? 'media.providerOpenRouter' : 'media.providerAgnes')}</button>
            ))}
          </div>
          {videoProvider === 'agnes' ? (
            <>
              {agnesModels !== null && !agnesModels.credential_ready && <p className="dmp-media-hint" role="alert">{t('media.agnesKeyMissing')}</p>}
              <label className="dmp-media-field">
                <span>{t('media.model')}</span>
                <select value={agnesModels?.videos[0]?.id ?? 'agnes-video-2.5-flash'} disabled>
                  <option value={agnesModels?.videos[0]?.id ?? 'agnes-video-2.5-flash'}>{agnesModels?.videos[0]?.id ?? 'agnes-video-2.5-flash'} · 720P</option>
                </select>
              </label>
              <div className="dmp-media-dimensions">
                <label className="dmp-media-field">
                  <span>{t('media.seconds')}</span>
                  <input type="number" min="4" max="12" step="1" value={agnesVideoSeconds} onChange={(event) => setAgnesVideoSeconds(event.currentTarget.value)} disabled={busy} />
                </label>
                <label className="dmp-media-field">
                  <span>{t('media.ratio')}</span>
                  <select value={agnesVideoRatio} onChange={(event) => setAgnesVideoRatio(event.currentTarget.value)} disabled={busy}>
                    {(agnesModels?.videos[0]?.supported_aspect_ratios ?? ['16:9']).map((ratio) => <option key={ratio} value={ratio}>{ratio}</option>)}
                  </select>
                </label>
              </div>
            </>
          ) : (
          <>
          <label className="dmp-media-field">
            <span>{t('media.model')}</span>
            <select value={videoModel} onChange={(event) => { setVideoModel(event.currentTarget.value); setVideoChargeConfirmed(false) }} disabled={busy || videos.length === 0}>
              {videos.length === 0 && <option value="">{t('media.noModels')}</option>}
              {videos.length > 0 && !videoSelectionAvailable && <option value="">{t('media.chooseModel')}</option>}
              {videos.map((model) => <option key={model.id} value={model.id}>{modelLabel(model, paidVideosEnabled, t)}</option>)}
            </select>
          </label>
          {videoNeedsConfirmation && <label className="dmp-media-paid-confirm">
            <input type="checkbox" checked={videoChargeConfirmed} onChange={(event) => setVideoChargeConfirmed(event.currentTarget.checked)} disabled={busy} />
            <span><strong>{t('media.manualPaidTitle')}</strong><small>{t('media.manualPaidDescription')}</small></span>
          </label>}
          <label className="dmp-media-field dmp-media-field-wide">
            <span>{t('media.prompt')}</span>
            <textarea value={videoPrompt} onChange={(event) => setVideoPrompt(event.currentTarget.value)} placeholder={t('media.videoPromptPlaceholder')} />
          </label>
          <label className="dmp-media-field dmp-media-duration">
            <span>{t('media.durationOptional')}</span>
            <input type="number" min="1" max="60" step="1" value={videoDuration} onChange={(event) => setVideoDuration(event.currentTarget.value)} placeholder="5" />
          </label>
          </>
          )}
          {videoProvider === 'agnes' ? (
            <button className="dmp-media-primary" type="button" disabled={busy} onClick={() => void submitAgnesVideo()}>
              {pending === 'agnes-video' ? t('media.running') : t('media.generateVideo')}
            </button>
          ) : (
          <button className="dmp-media-primary" type="button" disabled={busy || !videoCanSubmit} onClick={() => void submitVideo()}>
            {pending === 'video' ? t('media.running') : t('media.generateVideo')}
          </button>
          )}
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
            <button type="button" disabled={busy} onClick={() => void checkStatus()}>{pending === 'status' ? t('media.running') : t('media.checkStatus')}</button>
            <button className="dmp-media-primary" type="button" disabled={busy} onClick={() => void download()}>{pending === 'download' ? t('media.running') : t('media.downloadVideo')}</button>
            <button type="button" disabled={busy} onClick={() => void checkAgnesStatus()}>{pending === 'agnes-status' ? t('media.running') : t('media.agnesCheckStatus')}</button>
            <button type="button" disabled={busy} onClick={() => void downloadAgnes()}>{pending === 'agnes-download' ? t('media.running') : t('media.agnesDownloadVideo')}</button>
          </div>
        </div>
      </section>
    </main>
  )
}
