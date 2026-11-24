# Drape fitting edit

Run `npm ci` and `npm start`, then open http://127.0.0.1:4173. The local mirror requires browser camera permission.

Set `DECART_API_KEY` in the environment of the Node server and restart it to enable Lucy Virtual Try-On. The local server gives the browser a short-lived, origin- and model-scoped token. The permanent key stays on the server. Without a key the mirror shows an explicitly labeled local camera preview.

The static Sites build serves the editorial, fit and styling tools, and local camera preview. A production Lucy deployment needs a same-origin POST `/api/realtime-token` endpoint with server-side credentials and access controls.

The editorial is a silent motion edit made from catalog stills. The garment names, photos and sizing measurements come from the Gorur Ghash and Wrongs & Rebels product pages linked in the sizing tool.
