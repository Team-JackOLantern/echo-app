import axios from "axios";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;
const USER = "ae8fb765";


interface createGroup {
    name: string;
    bet_deadline_date: string;
    bet_deadline_time: string;
}

export const createGroup = async (payload: createGroup) => {
    const {data} = await axios.post(`${SERVER_URL}/groups/create`, payload, {
        headers: {
            "user-id": USER
        }
    });
    return data;
};