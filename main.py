import discord
from discord.ext import commands
import asyncio
import os
import database as db

TOKEN = os.environ.get("DISCORD_TOKEN")

COGS = [
    "cogs.welcome",
    "cogs.leveling",
    "cogs.moderation",
    "cogs.logistics",
    "cogs.tickets",
    "cogs.status",
    "cogs.help",
]

intents = discord.Intents.default()
intents.message_content = True
intents.members = True
intents.guilds = True
intents.voice_states = True


class KaraKartalBot(commands.Bot):
    def __init__(self):
        super().__init__(
            command_prefix="!",
            intents=intents,
            help_command=None,
        )

    async def setup_hook(self):
        await db.init_db()
        for cog in COGS:
            try:
                await self.load_extension(cog)
                print(f"✅ Cog yüklendi: {cog}")
            except Exception as e:
                print(f"❌ Cog yüklenemedi {cog}: {e}")

        synced = await self.tree.sync()
        print(f"\n📋 Slash komutları senkronize edildi ({len(synced)} komut):")
        for cmd in synced:
            print(f"  /{cmd.name}")

    async def on_ready(self):
        print(f"\n{'='*40}")
        print(f"✅ KaraKartal Bot aktif! [{self.user}]")
        print(f"🤖 Bot ID: {self.user.id}")
        print(f"🌐 Sunucu sayısı: {len(self.guilds)}")
        print(f"{'='*40}")

        for guild in self.guilds:
            try:
                self.tree.copy_global_to(guild=guild)
                synced = await self.tree.sync(guild=guild)
                print(f"⚡ [{guild.name}] {len(synced)} komut anında senkronize edildi")
            except Exception as e:
                print(f"⚠️ [{guild.name}] guild sync hatası: {e}")

        print(f"{'='*40}\n")


bot = KaraKartalBot()


@bot.command(name="sync")
@commands.is_owner()
async def sync_commands(ctx):
    bot.tree.copy_global_to(guild=ctx.guild)
    synced = await bot.tree.sync(guild=ctx.guild)
    await ctx.send(f"⚡ {len(synced)} komut bu sunucuya anında senkronize edildi!")


@bot.command(name="gsync")
@commands.is_owner()
async def global_sync(ctx):
    synced = await bot.tree.sync()
    await ctx.send(f"🌐 {len(synced)} komut global olarak senkronize edildi (1 saat sürebilir).")


async def main():
    if not TOKEN:
        print("❌ DISCORD_TOKEN bulunamadı! Lütfen .env dosyasını veya ortam değişkenlerini kontrol edin.")
        return
    async with bot:
        await bot.start(TOKEN)


if __name__ == "__main__":
    asyncio.run(main())
