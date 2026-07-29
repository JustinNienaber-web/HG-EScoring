"use strict";

const CACHE_NAME = "hg-escoring-v1";

const APP_DATEIEN = [
    "./",
    "./index.html",
    "./style.css",
    "./platzdaten.js",
    "./auswertung.js",
    "./app.js",
    "./manifest.json",
];

self.addEventListener(
    "install",
    (event) => {
        event.waitUntil(
            caches
                .open(CACHE_NAME)
                .then(
                    (cache) =>
                        cache.addAll(APP_DATEIEN)
                )
        );

        self.skipWaiting();
    }
);

self.addEventListener(
    "activate",
    (event) => {
        event.waitUntil(
            caches
                .keys()
                .then(
                    (cacheNamen) =>
                        Promise.all(
                            cacheNamen
                                .filter(
                                    (cacheName) =>
                                        cacheName !==
                                        CACHE_NAME
                                )
                                .map(
                                    (cacheName) =>
                                        caches.delete(
                                            cacheName
                                        )
                                )
                        )
                )
        );

        self.clients.claim();
    }
);

self.addEventListener(
    "fetch",
    (event) => {
        if (event.request.method !== "GET") {
            return;
        }

        event.respondWith(
            fetch(event.request)
                .then(
                    (antwort) => {
                        const kopie = antwort.clone();

                        caches
                            .open(CACHE_NAME)
                            .then(
                                (cache) =>
                                    cache.put(
                                        event.request,
                                        kopie
                                    )
                            );

                        return antwort;
                    }
                )
                .catch(
                    () =>
                        caches.match(event.request)
                )
        );
    }
);