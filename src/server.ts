import * as dotenv from "dotenv";
import { isUserInChannel } from "./libs/custom";
import { Markup, Telegraf } from "telegraf";
import Database from "./libs/database";
import { InlineKeyboardMarkup } from "telegraf/typings/core/types/typegram";

dotenv.config();

import './message';

const bot = new Telegraf(process.env.BOT_TOKEN as string);

bot.telegram.setMyCommands([
    { command: 'start', description: "Let's dive into the world of CAPYS 🦫" },
    { command: 'invite', description: 'Bring your friends, spread the capy love 🦫❤️' },
]);

bot.start(async (ctx) => {
    const tele_id = String(ctx.from?.id);

    const is_user_in_channel = await isUserInChannel('-1002389626874', tele_id);

    if (!is_user_in_channel) {
        const joinMessage = `Hey Capiyer! You need to join the CAPYS community channel to begin your journey with $CAPYS. Don’t miss out! 🦫💼

Once you’re in, just tap /start in the Menu again to access the world of capy vibes.`;

        const operationMenu = Markup.inlineKeyboard([
            [Markup.button.url('Join Capiyers Channel Now', 'https://t.me/capiyers')],
        ]);

        ctx.reply(joinMessage, {
            parse_mode: "HTML",
            reply_markup: operationMenu.reply_markup,
        });
        return;
    };

    const welcomeMessage = `Welcome to the CAPYS Universe! 🦫🎉

Start exploring, invite your buddies, collect $CAPYS, and level up in the capy world. The more capy vibes you share, the higher your rewards! 🏆💰

🚀 Ready to earn $CAPYS? Tap below to start your adventure:`;

    const operationMenu = Markup.inlineKeyboard([
        [Markup.button.url('Join Capiyers Channel Now', 'https://t.me/capiyers')],
        [Markup.button.url('Explore the CAPYS Universe 🌍', ctx.payload.length === 8 ? `https://t.me/CapiyerBot/play?startapp=${ctx.payload}` : 'https://t.me/CapiyerBot/play')],
    ]);

    ctx.reply(welcomeMessage, {
        parse_mode: "HTML",
        reply_markup: operationMenu.reply_markup,
    });
});

bot.command('invite', async (ctx) => {
    if (ctx.chat?.type === 'private') {
        const userId = ctx.from?.id.toString();

        const dbInstance = Database.getInstance();
        const db = await dbInstance.getDb();
        const userCollection = db.collection('users');

        const user = await userCollection.findOne({ tele_id: userId }, { projection: { _id: 0, referral_code: 1 } });

        let inviteMessage: string;
        let operationMenu: Markup.Markup<InlineKeyboardMarkup> | undefined;

        if (user?.referral_code) {
            inviteMessage = `Here’s your exclusive invite link to the CAPYS Universe:

<code>https://t.me/CapiyerBot?start=${user.referral_code}</code>

Invite friends, spread the capy love, and earn $CAPYS and $TON for each successful referral. 🦫💸`;

            operationMenu = Markup.inlineKeyboard([
                [Markup.button.url('Share the Capy Link 🦫', `https://t.me/share/url?url=https://t.me/CapiyerBot?start=${user.referral_code}&text=Join%20my%20capy%20adventure%20now!`)],
            ]);
        } else {
            inviteMessage = `Get started here first: https://t.me/CapiyerBot/play`;
        };

        ctx.reply(inviteMessage, {
            parse_mode: "HTML",
            reply_markup: operationMenu?.reply_markup,
        });
    };
});


bot.command('admin_user', async (ctx) => {
    if (ctx.chat?.type === 'private') {
        const userId = ctx.from?.id.toString();

        if (userId !== '1853181392') return;

        const dbInstance = Database.getInstance();
        const db = await dbInstance.getDb();
        const userCollection = db.collection('users');

        const total_users = await userCollection.countDocuments();

        const inviteMessage = `Total Users: ${total_users}`;

        ctx.reply(inviteMessage, { parse_mode: "HTML" });
    };
});

bot.launch(() => {
    console.log('CAPYS Bot is live! 🦫🚀');
});