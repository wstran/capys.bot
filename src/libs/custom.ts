import axios from "axios";

export const isUserInChannel = async (channelId: string, userId: string) => {
  try {
    const response = await axios.get(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/getChatMember`, {
      params: {
        chat_id: channelId,
        user_id: userId
      }
    });
    return response.data.result.status === 'member' || response.data.result.status === 'administrator' || response.data.result.status === 'creator';
  } catch (error) {
    console.error('Error checking user in channel:', error);
    return false;
  };
}