// Tiny proxy that signs requests with OAuth 1.0a so secrets stay on the server.
import http from 'node:http'
import crypto from 'node:crypto'
import OAuth from 'oauth-1.0a'

const { AUDIOMACK_KEY, AUDIOMACK_SECRET } = process.env
const oauth = new OAuth({
  consumer: { key: AUDIOMACK_KEY ?? '', secret: AUDIOMACK_SECRET ?? '' },
  signature_method: 'HMAC-SHA1',
  hash_function: (base, key) => crypto.createHmac('sha1', key).update(base).digest('base64'),
})

http.createServer(async (req, res) => {
  try {
    const url = 'https://api.audiomack.com/v1' + req.url.replace(/^\/api/, '')
    const headers = oauth.toHeader(oauth.authorize({ url, method: 'GET' }))
    const upstream = await fetch(url, { headers: { ...headers } })
    res.writeHead(upstream.status, { 'Content-Type': 'application/json' })
    res.end(await upstream.text())
  } catch (e) {
    res.writeHead(502); res.end(JSON.stringify({ error: String(e) }))
  }
}).listen(8787, () => console.log('Proxy on :8787'))
