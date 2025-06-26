import { TOKEN } from ".";
import getIMDBInfo from "./imdb";

export const getMovieName = (id: number): Promise<string> =>
    fetch(`https://api.themoviedb.org/3/movie/${id}?language=en-US`, {
        headers: {
            Authorization: `Bearer ${TOKEN}`
        }
    })
        .then((res) => res.json())
        .then((res: any) => res.original_title);

export const getIMDBMovieDetails = (
    id: string
): Promise<{ id: number; name: string }> =>
    getIMDBInfo(id).then((res) => ({
        name: res.movie_results[0].original_title,
        id: res.movie_results[0].id
    }));
