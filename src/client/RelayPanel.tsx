import { useState } from 'react'

interface RelayPanelProps {
  onOpenConfig: () => void
  t: (key: string, params?: Record<string, unknown>) => string
}

const BAI_RELAY_BASE_PATH = '/model-palette/api/bai-relay/v1'

const BAI_RELAY_PLUGIN_CONFIG = `- id: dsh-model-palette
  config:
    baiRelay:
      enabled: true
      timeoutMs: 180000
      upstreamHost: a18ccd091ab831ac3.awsglobalaccelerator.com
      hostHeader: api.b.ai`

const GENERIC_RELAY_CONFIG = `- id: dsh-model-palette
  config:
    providerRelays:
      example-provider:
        upstreamHost: reachable-entry.example.net
        hostHeader: api.provider.example
        tlsServerName: reachable-entry.example.net
        certificateHost: api.provider.example
        allowedPathPrefix: /v1/
        timeoutMs: 180000`

/** Render the built-in fixed-destination relay instructions and copyable templates. */
export function RelayPanel({ onOpenConfig, t }: RelayPanelProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const origin = loopbackOrigin()
  const baiBaseURL = `${origin}${BAI_RELAY_BASE_PATH}`
  const genericBaseURL = `${origin}/model-palette/api/relay/example-provider/v1`
  const baiProviderConfig = `llm-pi-ai:
  providers:
    your-bai-provider:
      api: openai-responses
      apiKeyEnv: BAI_API_KEY
      baseURL: ${baiBaseURL}
      models:
        - id: deepseek-v4-flash`

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
      window.setTimeout(() => setCopied(current => current === label ? null : current), 1800)
    } catch {
      setCopied(null)
    }
  }

  return (
    <main className="dmp-relay">
      <section className="dmp-relay-intro">
        <div>
          <strong>{t('relay.title')}</strong>
          <span>{t('relay.intro')}</span>
        </div>
        <span className="dmp-relay-status">{t('relay.builtIn')}</span>
      </section>

      <section className="dmp-relay-card dmp-relay-flow">
        <div className="dmp-relay-card-heading">
          <span className="dmp-relay-icon" aria-hidden="true">↗</span>
          <div>
            <h3>{t('relay.howTitle')}</h3>
            <p>{t('relay.howDescription')}</p>
          </div>
        </div>
        <div className="dmp-relay-route" aria-label={t('relay.routeAria')}>
          <span>{t('relay.routeDsh')}</span>
          <b aria-hidden="true">→</b>
          <span>{t('relay.routeLocal')}</span>
          <b aria-hidden="true">→</b>
          <span>{t('relay.routeProvider')}</span>
        </div>
        <p className="dmp-relay-note">{t('relay.security')}</p>
      </section>

      <section className="dmp-relay-card">
        <div className="dmp-relay-card-heading">
          <span className="dmp-relay-icon" aria-hidden="true">B</span>
          <div>
            <h3>{t('relay.baiTitle')}</h3>
            <p>{t('relay.baiDescription')}</p>
          </div>
        </div>
        <dl className="dmp-relay-details">
          <div><dt>{t('relay.localBaseUrl')}</dt><dd><code>{baiBaseURL}</code><button type="button" onClick={() => void copy('url', baiBaseURL)}>{copied === 'url' ? t('relay.copied') : t('relay.copy')}</button></dd></div>
          <div><dt>{t('relay.upstream')}</dt><dd><code>a18ccd091ab831ac3.awsglobalaccelerator.com</code></dd></div>
          <div><dt>{t('relay.hostHeader')}</dt><dd><code>api.b.ai</code></dd></div>
          <div><dt>{t('relay.allowedPath')}</dt><dd><code>/v1/*</code></dd></div>
        </dl>
        <p className="dmp-relay-note">{t('relay.statusHint')}</p>
        <div className="dmp-relay-actions">
          <button type="button" onClick={() => void copy('provider', baiProviderConfig)}>{copied === 'provider' ? t('relay.copied') : t('relay.copyProvider')}</button>
          <button className="dmp-relay-primary" type="button" onClick={onOpenConfig}>{t('relay.openModelConfig')}</button>
        </div>
      </section>

      <section className="dmp-relay-card">
        <div className="dmp-relay-card-heading">
          <span className="dmp-relay-icon" aria-hidden="true">⚙</span>
          <div>
            <h3>{t('relay.pluginConfigTitle')}</h3>
            <p>{t('relay.pluginConfigDescription')}</p>
          </div>
        </div>
        <pre className="dmp-relay-code"><code>{BAI_RELAY_PLUGIN_CONFIG}</code></pre>
        <button type="button" className="dmp-relay-copy-code" onClick={() => void copy('plugin', BAI_RELAY_PLUGIN_CONFIG)}>{copied === 'plugin' ? t('relay.copied') : t('relay.copyPluginConfig')}</button>
      </section>

      <section className="dmp-relay-card dmp-relay-expand">
        <div className="dmp-relay-card-heading">
          <span className="dmp-relay-icon" aria-hidden="true">+</span>
          <div>
            <h3>{t('relay.extendTitle')}</h3>
            <p>{t('relay.extendDescription')}</p>
          </div>
        </div>
        <ol>
          <li>{t('relay.extendStepOne')}</li>
          <li>{t('relay.extendStepTwo')}</li>
          <li>{t('relay.extendStepThree')}</li>
        </ol>
        <pre className="dmp-relay-code"><code>{GENERIC_RELAY_CONFIG}</code></pre>
        <p className="dmp-relay-base-example">{t('relay.genericBaseUrl')} <code>{genericBaseURL}</code></p>
        <div className="dmp-relay-actions">
          <button type="button" onClick={() => void copy('generic-url', genericBaseURL)}>{copied === 'generic-url' ? t('relay.copied') : t('relay.copyGenericBaseUrl')}</button>
          <button type="button" onClick={() => void copy('generic', GENERIC_RELAY_CONFIG)}>{copied === 'generic' ? t('relay.copied') : t('relay.copyGenericConfig')}</button>
        </div>
        <p className="dmp-relay-warning">{t('relay.extendWarning')}</p>
      </section>
    </main>
  )
}

function loopbackOrigin(): string {
  if (typeof window === 'undefined') return 'http://127.0.0.1:3080'
  const location = new URL(window.location.href)
  location.hostname = '127.0.0.1'
  return location.origin
}
