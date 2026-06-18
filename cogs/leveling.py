import discord
from discord import app_commands
from discord.ext import commands
import random
from utils.embeds import make_embed, success_embed, BRAND_COLOR
import database as db


def xp_for_next_level(level: int) -> int:
    return int(level * 100 * 1.5)


class Leveling(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self._cooldowns: dict = {}

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return

        user_id = message.author.id
        guild_id = message.guild.id
        cooldown_key = (user_id, guild_id)

        import time
        now = time.time()
        if now - self._cooldowns.get(cooldown_key, 0) < 30:
            return
        self._cooldowns[cooldown_key] = now

        user = await db.get_user(user_id, guild_id)
        gained_xp = random.randint(5, 15)
        new_xp = user["xp"] + gained_xp
        current_level = user["level"]
        needed = xp_for_next_level(current_level)

        if new_xp >= needed:
            new_level = current_level + 1
            new_xp = new_xp - needed
            await db.update_user(user_id, guild_id, xp=new_xp, level=new_level)
            embed = success_embed(
                title="🎉 Seviye Atladı!",
                description=f"{message.author.mention} seviye atladı!\n**Yeni Seviye: {new_level}**",
                fields=[
                    {"name": "⭐ Eski Seviye", "value": str(current_level), "inline": True},
                    {"name": "🚀 Yeni Seviye", "value": str(new_level), "inline": True},
                    {"name": "✨ XP", "value": str(new_xp), "inline": True},
                ],
            )
            await message.channel.send(embed=embed)
        else:
            await db.update_user(user_id, guild_id, xp=new_xp)

    @app_commands.command(name="seviye", description="Seviyeni ve XP bilgilerini göster")
    async def seviye(self, interaction: discord.Interaction):
        user = await db.get_user(interaction.user.id, interaction.guild.id)
        level = user["level"]
        xp = user["xp"]
        needed = xp_for_next_level(level)

        top = await db.get_top_xp(interaction.guild.id, limit=100)
        rank = next((i + 1 for i, u in enumerate(top) if u["user_id"] == interaction.user.id), "?")

        bar_filled = int((xp / needed) * 20) if needed > 0 else 0
        bar = "█" * bar_filled + "░" * (20 - bar_filled)

        embed = make_embed(
            title=f"📊 {interaction.user.display_name} — Seviye Bilgisi",
            color=BRAND_COLOR,
            fields=[
                {"name": "🏆 Seviye", "value": str(level), "inline": True},
                {"name": "✨ XP", "value": f"{xp} / {needed}", "inline": True},
                {"name": "🏅 Sıralama", "value": f"#{rank}", "inline": True},
                {"name": "📈 İlerleme", "value": f"`{bar}` {xp}/{needed}", "inline": False},
            ],
        )
        embed.set_thumbnail(url=interaction.user.display_avatar.url)
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="liderlik", description="Sunucunun XP liderlik tablosu")
    async def liderlik(self, interaction: discord.Interaction):
        top = await db.get_top_xp(interaction.guild.id, limit=10)
        medals = ["🥇", "🥈", "🥉"] + ["🏅"] * 7

        lines = []
        for i, u in enumerate(top):
            member = interaction.guild.get_member(u["user_id"])
            name = member.display_name if member else f"Kullanıcı#{u['user_id']}"
            lines.append(f"{medals[i]} **{name}** — Seviye {u['level']} ({u['xp']} XP)")

        embed = make_embed(
            title="🏆 XP Liderlik Tablosu",
            description="\n".join(lines) if lines else "Henüz veri yok.",
        )
        await interaction.response.send_message(embed=embed)


async def setup(bot):
    await bot.add_cog(Leveling(bot))
