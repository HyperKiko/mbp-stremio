import { TOKEN } from ".";
import getIMDBInfo from "./imdb";

export const getTVName = (id: number): Promise<string> =>
    fetch(`https://api.themoviedb.org/3/tv/${id}?language=en-US`, {
        headers: {
            Authorization: `Bearer ${TOKEN}`
        }
    })
        .then((res) => res.json())
        .then((res: any) => res.original_name);

export const getIMDBTVDetails = (
    id: string
): Promise<{ id: number; name: string }> =>
    getIMDBInfo(id).then((res) => ({
        name: res.tv_results[0].original_name,
        id: res.tv_results[0].id
    }));
