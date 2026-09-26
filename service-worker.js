/* =========================================================
   Palomas Pro v10.1 — Service Worker Offline
   GitHub Pages / PWA / iOS
   ========================================================= */

const CACHE_VERSION = 'palomas-v10.1-offline-v1';
const APP_CACHE = `${CACHE_VERSION}-app`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const APP_SHELL = [
  './',
  './index.html'
];


/* =========================================================
   INSTALACIÓN
   ========================================================= */

self.addEventListener('install', event => {

  event.waitUntil(
    caches.open(APP_CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );

});


/* =========================================================
   ACTIVACIÓN
   Elimina cachés antiguas de la aplicación.
   ========================================================= */

self.addEventListener('activate', event => {

  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(

        keys
          .filter(key =>
            key !== APP_CACHE &&
            key !== RUNTIME_CACHE
          )
          .map(key => caches.delete(key))

      ))
      .then(() => self.clients.claim())
  );

});


/* =========================================================
   FETCH
   ========================================================= */

self.addEventListener('fetch', event => {

  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }


  /* ---------------------------------------------------------
     HTML / NAVEGACIÓN

     Con Internet:
     obtiene la versión más reciente y actualiza la caché.

     Sin Internet:
     utiliza la última versión almacenada.
     --------------------------------------------------------- */

  if (request.mode === 'navigate') {

    event.respondWith(

      fetch(request)

        .then(response => {

          if (response && response.ok) {

            const copy = response.clone();

            caches.open(APP_CACHE)
              .then(cache =>
                cache.put(request, copy)
              );

          }

          return response;

        })

        .catch(async () => {

          const exact = await caches.match(request);

          if (exact) {
            return exact;
          }


          const index =
            await caches.match('./index.html');

          if (index) {
            return index;
          }


          const root =
            await caches.match('./');

          if (root) {
            return root;
          }


          return new Response(

            `<!doctype html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport"
                    content="width=device-width,initial-scale=1">
              <title>Palomas Pro</title>
            </head>
            <body>
              <h2>Sin conexión</h2>
              <p>
                Abre Palomas Pro una vez con Internet
                para guardar la aplicación.
              </p>
            </body>
            </html>`,

            {
              headers: {
                'Content-Type':
                  'text/html; charset=utf-8'
              }
            }

          );

        })

    );

    return;

  }


  /* ---------------------------------------------------------
     RECURSOS EXTERNOS

     Se almacenarán automáticamente al utilizarlos:

     • Font Awesome
     • Fuentes de Font Awesome
     • Google Material Icons
     • Fuentes de Material Icons
     • html2canvas
     • Cualquier otro recurso GET utilizado por la app
     --------------------------------------------------------- */

  event.respondWith(

    caches.match(request)

      .then(cached => {

        if (cached) {
          return cached;
        }


        return fetch(request)

          .then(response => {

            if (!response) {
              return response;
            }


            /*
               También permite guardar respuestas "opaque"
               procedentes de CDN y Google Fonts.
            */

            if (
              response.ok ||
              response.type === 'opaque'
            ) {

              const copy = response.clone();

              caches.open(RUNTIME_CACHE)
                .then(cache =>
                  cache.put(request, copy)
                );

            }


            return response;

          })

          .catch(() => cached);

      })

  );

});


/* =========================================================
   ACTUALIZACIÓN INMEDIATA
   ========================================================= */

self.addEventListener('message', event => {

  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }

});
