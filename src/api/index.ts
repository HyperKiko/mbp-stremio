import { apiCall } from "./apicall";
import { getUDID } from "./get_udid";

type MediaType = "movie" | "tv";

export const search = (
    query: string,
    year: number | "" = "",
    type: MediaType | "all" = "all"
) =>
    apiCall({
        module: "Search5",
        keyword: query,
        year: year.toString(),
        type: type,
        page: 1,
        pagelimit: 999999999,
        private_mode: 1
    });

export const getDetails = (type: MediaType, id: number) =>
    type === "tv"
        ? apiCall({
              module: "TV_detail_v2",
              tid: id
          })
        : apiCall({
              module: "Movie_detail",
              mid: id
          });

export function getStreams(
    token: string,
    type: "tv",
    id: number,
    season: number,
    episode: number
): Promise<any>;
export function getStreams(
    token: string,
    type: "movie",
    id: number
): Promise<any>;
export function getStreams(
    token: string,
    type: MediaType,
    id: number,
    season?: number,
    episode?: number
) {
    return type === "tv"
        ? apiCall({
              module: "TV_downloadurl_v3",
              tid: id,
              season,
              episode,
              uid: token,
              open_udid: getUDID(token)
          })
        : apiCall({
              module: "Movie_downloadurl_v3",
              mid: id,
              uid: token,
              open_udid: getUDID(token)
          });
}

export function getSubtitles(
    token: string,
    type: "tv",
    id: number,
    stream: number,
    season: number,
    episode: number
): Promise<any>;
export function getSubtitles(
    token: string,
    type: "movie",
    id: number,
    stream: number
): Promise<any>;
export function getSubtitles(
    token: string,
    type: MediaType,
    id: number,
    stream: number,
    season?: number,
    episode?: number
) {
    return type === "tv"
        ? apiCall({
              module: "TV_srt_list_v3",
              tid: id,
              season,
              episode,
              uid: token,
              fid: stream,
              lang: "en",
              open_udid: getUDID(token)
          })
        : apiCall({
              module: "Movie_srt_list_v3",
              mid: id,
              uid: token,
              fid: stream,
              lang: "en",
              open_udid: getUDID(token)
          });
}
