import { Hono } from "hono";
import { getDetails, getStreams, getSubtitles, search } from "./api";
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
    quality: string;
    real_quality: string;
    fid: number;
    bitstream: string;
    filename: string;
    size_bytes: number;
};

app.get("/:config/stream/:type{(movie|series)}/:id{(.+)\\.json}", async (c) => {
    const type = c.req.param("type");
    const id = c.req.param("id").slice(0, -".json".length);
    const token = new URLSearchParams(c.req.param("config")).get("token");
    if (!token) return c.json({ error: "no token" }, 400);
    const media =
        type === "movie" ? await getMovieInfo(id) : await getTVInfo(id);
    const searchResults: { data: { id: number }[] } = await search(
        media.name,
        "",
        type === "movie" ? "movie" : "tv"
    );
    const mediaID = (
        await any(searchResults.data, async (result) => {
            const detailResults: { data: { tmdb_id: number } } =
                await getDetails(media.type, result.id);
            return detailResults.data.tmdb_id === media.id;
        })
    )?.id;
    if (!mediaID) return c.json({ error: "not found" }, 404);

    const data: { data: { list: Stream[] } } =
        media.type === "tv"
            ? await getStreams(
                  token,
                  "tv",
                  mediaID,
                  media.season,
                  media.episode
              )
            : await getStreams(token, "movie", mediaID);

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
                ? await getSubtitles(
                      token,
                      "tv",
                      mediaID,
                      stream.fid,
                      media.season,
                      media.episode
                  )
                : await getSubtitles(token, "movie", mediaID, stream.fid);

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
                name: `${stream.quality}${
                    stream.quality !== stream.real_quality
                        ? ` (${stream.real_quality})`
                        : ""
                } - ${stream.bitstream}`,
                description: stream.filename,
                subtitles: await processSubtitles(stream),
                behaviorHints: {
                    notWebReady: !new URL(stream.path).pathname.endsWith(
                        ".mp4"
                    ),
                    bingeGroup: `mbp-${stream.quality}-${stream.real_quality}`,
                    videoSize: stream.size_bytes,
                    filename: stream.filename
                }
            }))
        )
    });
});

export default app;
