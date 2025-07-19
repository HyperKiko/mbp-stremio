type MediaType = "movie" | "tv";

export const search = (
    server: string,
    query: string,
    year: number | "" = "",
    type: MediaType | "all" = "all"
) =>
    fetch(
        `${server}/search?` +
            new URLSearchParams({
                q: query,
                year: year.toString(),
                type: type
            }).toString()
    ).then((response) => response.json());

export const getDetails = (server: string, type: MediaType, id: number) =>
    fetch(`${server}/details/${type}/${id}`).then((response) =>
        response.json()
    );

export function getStreams(
    server: string,
    type: "tv",
    id: number,
    season: number,
    episode: number
): Promise<any>;
export function getStreams(
    server: string,
    type: "movie",
    id: number
): Promise<any>;
export function getStreams(
    server: string,
    type: MediaType,
    id: number,
    season?: number,
    episode?: number
) {
    return fetch(
        type === "tv"
            ? `${server}/tv/${id}/${season}/${episode}`
            : `${server}/movie/${id}`
    ).then((response) => response.json());
}

export function getSubtitles(
    server: string,
    type: "tv",
    id: number,
    stream: number,
    season: number,
    episode: number
): Promise<any>;
export function getSubtitles(
    server: string,
    type: "movie",
    id: number,
    stream: number
): Promise<any>;
export function getSubtitles(
    server: string,
    type: MediaType,
    id: number,
    stream: number,
    season?: number,
    episode?: number
) {
    return fetch(
        type === "tv"
            ? `${server}/subtitles/tv/${id}/${season}/${episode}/${stream}`
            : `${server}/subtitles/movie/${id}/${stream}`
    ).then((response) => response.json());
}
