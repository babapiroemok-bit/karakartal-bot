import discord
from discord import app_commands
from discord.ext import commands
from discord.ext import tasks
from utils.embeds import make_embed, BRAND_COLOR
import database as db

VOICE_CHANNEL_ID = 1517073292802916493


class Status(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self._presence_index = 0
        self.rotate_presence.start()

    def cog_unload(self):
        self.rotate_presence.cancel()
        self.voice_watchdog.cancel()

    async def cog_load(self):
        self.voice_watchdog.start()

    async def _connect_voice(self):
        try:
            channel = await self.bot.fetch_channel(VOICE_CHANNEL_ID)
        except Exception as e:
            print(f"⚠️ Ses kanalı alınamadı: {e}")
            return

        if not isinstance(channel, discord.VoiceChannel):
            print(f"⚠️ {VOICE_CHANNEL_ID} bir ses kanalı değil.")
            return

        guild = channel.guild
        vc = guild.voice_client

        if vc and vc.is_connected():
            return

        if vc:
            try:
                await vc.disconnect(force=True)
            except Exception:
                pass

        try:
            await channel.connect()
            print(f"✅ Ses kanalına bağlanıldı: {channel.name}")
        except Exception as e:
            print(f"⚠️ Ses kanalına bağlanılamadı: {e}")

    @tasks.loop(seconds=60)
    async def voice_watchdog(self):
        await self.bot.wait_until_ready()
        await self._connect_voice()

    @tasks.loop(seconds=30)
    async def rotate_presence(self):
        await self.bot.wait_until_ready()

        presences = [
            discord.Activity(type=discord.ActivityType.playing, name="🦅 KaraKartal Logistics aktif"),
            discord.Activity(type=discord.ActivityType.watching, name="📦 Teslimatları takip ediyor"),
            discord.Activity(type=discord.ActivityType.playing, name="🚛 Şoförlerle birlikte"),
            discord.Activity(type=discord.ActivityType.listening, name="/yardım | karakartal"),
        ]

        guilds = self.bot.guilds
        if guilds:
            try:
                stats = await db.get_server_stats(guilds[0].id)
                presences[1] = discord.Activity(
                    type=discord.ActivityType.watching,
                    name=f"📦 {stats['active_deliveries']} aktif teslimat"
                )
                presences[2] = discord.Activity(
                    type=discord.ActivityType.playing,
                    name=f"🚛 {stats['active_drivers']} aktif şoför"
                )
            except Exception:
                pass

        activity = presences[self._presence_index % len(presences)]
        self._presence_index += 1
        await self.bot.change_presence(activity=activity)

    @app_commands.command(name="durum", description="Sunucu durumunu görüntüle")
    async def durum(self, interaction: discord.Interaction):
        stats = await db.get_server_stats(interaction.guild.id)
        member_count = interaction.guild.member_count

        embed = make_embed(
            title="🦅 KaraKartal Logistics",
            description="━━━━━━━━━━━━━━━━━━━━",
            color=BRAND_COLOR,
            fields=[
                {"name": "📦 Aktif Teslimatlar", "value": str(stats["active_deliveries"]), "inline": True},
                {"name": "🚛 Kayıtlı Şoförler", "value": str(stats["active_drivers"]), "inline": True},
                {"name": "👥 Toplam Üye", "value": str(member_count), "inline": True},
                {"name": "⭐ En İyi Şoför", "value": stats["top_driver"], "inline": False},
                {"name": "\u200b", "value": "━━━━━━━━━━━━━━━━━━━━", "inline": False},
            ],
        )
        await interaction.response.send_message(embed=embed)


async def setup(bot):
    await bot.add_cog(Status(bot))
