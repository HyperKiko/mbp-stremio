import { getIMDBMovieDetails, getMovieName } from "./tmdb/movie";
import { getIMDBTVDetails, getTVName } from "./tmdb/tv";

export const parseShowID = (id: string) =>
    id.split(":").length === 4
        ? {
              type: "tmdb" as const,
              id: id.split(":")[1],
              season: id.split(":")[2],
              episode: id.split(":")[3]
          }
        : {
              type: "imdb" as const,
              id: id.split(":")[0],
              season: id.split(":")[1],
              episode: id.split(":")[2]
          };

export const parseMovieID = (id: string) =>
    id.split(":").length === 2
        ? {
              type: "tmdb" as const,
              id: id.split(":")[1]
          }
        : {
              type: "imdb" as const,
              id: id.split(":")[0]
          };

export async function getTVInfo(id: string) {
    const metadata = parseShowID(id);
    let tmdbID;
    let name;
    if (metadata.type === "tmdb") {
        tmdbID = Number(metadata.id);
        name = await getTVName(tmdbID);
    } else {
        const object = await getIMDBTVDetails(metadata.id);
        tmdbID = object.id;
        name = object.name;
    }
    return {
        type: "tv" as const,
        name,
        id: tmdbID,
        season: Number(metadata.season),
        episode: Number(metadata.episode)
    };
}
type MovieMedia = Awaited<ReturnType<typeof getMovieInfo>>;
type TVMedia = Awaited<ReturnType<typeof getTVInfo>>;
export type Media = MovieMedia | TVMedia;

export async function getMovieInfo(id: string) {
    const metadata = parseMovieID(id);
    let tmdbID;
    let name;
    if (metadata.type === "tmdb") {
        tmdbID = Number(metadata.id);
        name = await getMovieName(tmdbID);
    } else {
        const object = await getIMDBMovieDetails(metadata.id);
        tmdbID = object.id;
        name = object.name;
    }
    return {
        type: "movie" as const,
        name,
        id: tmdbID
    };
}

export async function any<T>(
  array: T[],
  predicate: (t: T) => Promise<boolean>,
): Promise<T | undefined> {
  for (const t of array) {
    if (await predicate(t)) {
      return t;
    }
  }
  return undefined;
}
