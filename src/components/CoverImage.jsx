import { useState } from 'react'

/**
 * Cover image that survives cross origin blocking.
 *
 * Some hosts (Google Drive usercontent links, for example) send a
 * Cross-Origin-Resource-Policy header that makes the browser refuse a plain
 * <img> load from another origin, even when the file is public. The very same
 * URL loads fine when the request is made in CORS mode, so we try the plain
 * load first and retry once with crossOrigin="anonymous" before giving up.
 *
 * The `key` forces a fresh element between attempts, because changing
 * crossOrigin on an already failed <img> does not always trigger a reload.
 */
export default function CoverImage({ src, alt = '', className, ...rest }) {
  const [mode, setMode] = useState('plain') // plain -> cors -> failed

  if (!src || mode === 'failed') {
    return <div className="cover-blocked">Image URL did not load</div>
  }

  return (
    <img
      key={mode}
      src={src}
      alt={alt}
      draggable={false}
      crossOrigin={mode === 'cors' ? 'anonymous' : undefined}
      className={className}
      onError={() => setMode(mode === 'plain' ? 'cors' : 'failed')}
      {...rest}
    />
  )
}
