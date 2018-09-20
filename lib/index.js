"use strict";

const Calendar = require("./calendar"),
    { default: Twitch } = require("twitch"),
    cache = require("./cache"),
    client = Twitch.withCredentials(process.env.CLIENT_ID);

module.exports = {
    /**
     * @param {string} username - User to get the ID of.
     * @returns {string} ID of the user.
     */
    async getUserId(username) {
        const cacheId = cache.buildKey(username, cache.CACHE_USERID),
            cached = await cache.get(cacheId);
        if(cached) {
            return cached;
        }
        const user = await client.helix.users.getUserByName(username);
        cache.store(cacheId, user.id);
        return user.id;
    },
    /**
     * @param {string} channelId - Channel to get the calendar for.
     * @returns {string} Raw ics calendar for the channel.
     */
    async getChannelCalendar(channelId) {
        const cacheId = cache.buildKey(channelId, cache.CACHE_CHANNEL),
            cached = await cache.get(cacheId);
        if(cached) {
            return cached;
        }
        const events = await client.unsupported.getEvents(channelId),
            cal = new Calendar(`channel/${channelId}`);
        cal.addEvents(events);
        const data = cal.getICAL();
        cache.store(cacheId, data);
        return data;
    },
    /**
     * @param {string} userId - User to get the calendar of events from followed
     *                          channels for.
     * @returns {string} Raw ics calendar of events from followed channels.
     */
    async getFollowsCalendar(userId) {
        const cacheId = cache.buildKey(userId, cache.CACHE_FOLLOWS),
            cached = await cache.get(cacheId);
        if(cached) {
            return cached;
        }
        const follows = await (await client.helix.users.getFollows({
                user: userId
            })).getAll(),
            events = await Promise.all(follows.map((follow) => client.unsupported.getEvents(follow.to_id))),
            cal = new Calendar(`follows/${userId}`);
        cal.addEvents([].concat(...events));
        const data = cal.getICAL();
        cache.store(cacheId, data);
        return data;
    }
};
