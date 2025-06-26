import { TOKEN } from ".";

export default function getIMDBInfo(id: string): Promise<any> {
    return fetch(
        `https://api.themoviedb.org/3/find/${id}?external_source=imdb_id`,
        {
            headers: {
                Authorization: `Bearer ${TOKEN}`
            }
        }
    ).then((res) => res.json());
}
