import axios from "axios";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;
const USER = "ae8fb765";

interface CreateGroupParams {
    name: string;
    bet_deadline?: string;
}

export const createGroup = async ({ name, bet_deadline }: CreateGroupParams) => {
    const body = {
        name,
        ...(bet_deadline && { bet_deadline })
    };

    const { data } = await axios.post(`${SERVER_URL}/groups/create`, body, {
        headers: {
            "user-id": USER
        }
    });

    return data;
};