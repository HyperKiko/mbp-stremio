import { Hono } from "hono";
import * as directApi from "./api";
import * as serverApi from "./api/server";
import { cors } from "hono/cors";
import manifest from "../manifest.json";
import { any, getMovieInfo, getTVInfo } from "./utils";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use("*", cors({ origin: "*" }));

app.get("/", (c) => c.redirect("/configure"));

app.get("/configure", (c) =>
    c.env.ASSETS.fetch("https://assets/configure.html")
);

app.get("/manifest.json", (c) => c.json(manifest));
app.get("/:config/manifest.json", (c) => {
    const config = new URLSearchParams(c.req.param("config"));
    if (!config.has("token")) return c.json(manifest);
    return c.json({
        ...manifest,
        behaviorHints: {
            ...manifest.behaviorHints,
            configurable: undefined,
            configurationRequired: undefined
        }
    });
});

type Stream = {
    path: string;
    real_quality: string;
    fid: number;
    size_bytes: number;
    filename: string;
    h265: number;
    hdr: number;
    width: number;
    height: number;
    original: number;
    vip_only: number;
    fps: number;
    bitstream?: string;
};

app.get("/:config/stream/:type{(movie|series)}/:id{(.+)\\.json}", async (c) => {
    const type = c.req.param("type");
    const id = c.req.param("id").slice(0, -".json".length);
    const params = new URLSearchParams(c.req.param("config"));
    const token = params.get("token");
    const server = params.get("server");
    if (!token && !server) return c.json({ error: "no token or server" }, 400);
    const api = token ? directApi : serverApi;
    const media =
        type === "movie" ? await getMovieInfo(id) : await getTVInfo(id);
    const searchResults: { data: { id: number }[] } = await (token
        ? directApi.search(media.name, "", type === "movie" ? "movie" : "tv")
        : serverApi.search(
              server!,
              media.name,
              "",
              type === "movie" ? "movie" : "tv"
          ));
    const mediaID = (
        await any(searchResults.data, async (result) => {
            const detailResults: { data: { tmdb_id: number } } = await (token
                ? directApi.getDetails(media.type, result.id)
                : serverApi.getDetails(server!, media.type, result.id));
            return detailResults.data.tmdb_id === media.id;
        })
    )?.id;
    if (!mediaID) return c.json({ error: "not found" }, 404);

    const data: { data: { list: Stream[] } } =
        media.type === "tv"
            ? await api.getStreams(
                  (token || server)!,
                  "tv",
                  mediaID,
                  media.season,
                  media.episode
              )
            : await api.getStreams((token || server)!, "movie", mediaID);

    const streams = data.data.list.filter((stream) => stream.path !== "");

    const processSubtitles = async (stream: Stream) => {
        const data: {
            data: {
                list: {
                    subtitles: {
                        file_path: string;
                        lang: string;
                        sid: number;
                    }[];
                }[];
            };
        } =
            media.type === "tv"
                ? await api.getSubtitles(
                      (token || server)!,
                      "tv",
                      mediaID,
                      stream.fid,
                      media.season,
                      media.episode
                  )
                : await api.getSubtitles(
                      (token || server)!,
                      "movie",
                      mediaID,
                      stream.fid
                  );

        const flatSubtitles = data.data.list.flatMap((x) => x.subtitles);

        return flatSubtitles.map((subtitle) => ({
            id: subtitle.sid,
            lang: subtitle.lang,
            url: subtitle.file_path
        }));
    };

    return c.json({
        streams: await Promise.all(
            streams.map(async (stream) => ({
                url: stream.path,
                name: `${stream.original ? "ORG " : ""}${
                    stream.real_quality
                } - ${stream.bitstream}`,
                description: `${stream.vip_only ? "VIP " : ""}${stream.width}x${
                    stream.height
                }@${stream.fps}fps ${stream.hdr ? "HDR " : ""}${
                    stream.h265 ? "H265 " : ""
                }- ${stream.filename}`,
                subtitles: await processSubtitles(stream),
                behaviorHints: {
                    notWebReady: !new URL(stream.path).pathname.endsWith(
                        ".mp4"
                    ),
                    bingeGroup: `mbp-${stream.original}-${
                        stream.real_quality
                    }-${stream.hdr}-${
                        Math.round(Number(stream.bitstream?.slice(0, -4)) / 2) *
                        2 // round to nearest 2 mb/s
                    }`,
                    videoSize: stream.size_bytes,
                    filename: stream.filename
                }
            }))
        )
    });
});

export default app;
