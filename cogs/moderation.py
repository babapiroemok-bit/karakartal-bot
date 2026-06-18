import discord
from discord import app_commands
from discord.ext import commands
from datetime import datetime, timezone, timedelta
from utils.embeds import make_embed, success_embed, error_embed, warn_embed
import database as db


def has_mod_role():
    async def predicate(interaction: discord.Interaction) -> bool:
        allowed = {"Yetkili", "Moderatör"}
        if any(r.name in allowed for r in interaction.user.roles):
            return True
        await interaction.response.send_message(
            embed=error_embed("❌ Yetkisiz", "Bu komutu kullanmak için **Yetkili** veya **Moderatör** rolü gereklidir."),
            ephemeral=True,
        )
        return False
    return app_commands.check(predicate)


async def log_action(guild: discord.Guild, embed: discord.Embed):
    log_channel = discord.utils.get(guild.text_channels, name="yetkili-log") or \
                  discord.utils.get(guild.text_channels, name="mod-log")
    if log_channel:
        await log_channel.send(embed=embed)


class Moderation(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="ban", description="Bir kullanıcıyı yasakla")
    @has_mod_role()
    async def ban(self, interaction: discord.Interaction, kullanici: discord.Member, sebep: str = "Sebep belirtilmedi"):
        if kullanici.top_role >= interaction.user.top_role:
            await interaction.response.send_message(
                embed=error_embed("❌ Hata", "Bu kullanıcıyı banlayamazsın."), ephemeral=True
            )
            return
        await kullanici.ban(reason=sebep)
        now = datetime.now(timezone.utc).strftime("%d.%m.%Y %H:%M")
        embed = make_embed(
            title="🔨 Kullanıcı Yasaklandı",
            color=0xE74C3C,
            fields=[
                {"name": "👤 Yetkili", "value": interaction.user.mention, "inline": True},
                {"name": "🎯 Hedef", "value": str(kullanici), "inline": True},
                {"name": "📝 Sebep", "value": sebep, "inline": False},
                {"name": "📅 Tarih", "value": now, "inline": True},
            ],
        )
        await interaction.response.send_message(embed=embed)
        await log_action(interaction.guild, embed)

    @app_commands.command(name="kick", description="Bir kullanıcıyı sunucudan at")
    @has_mod_role()
    async def kick(self, interaction: discord.Interaction, kullanici: discord.Member, sebep: str = "Sebep belirtilmedi"):
        if kullanici.top_role >= interaction.user.top_role:
            await interaction.response.send_message(
                embed=error_embed("❌ Hata", "Bu kullanıcıyı atamazsın."), ephemeral=True
            )
            return
        await kullanici.kick(reason=sebep)
        now = datetime.now(timezone.utc).strftime("%d.%m.%Y %H:%M")
        embed = make_embed(
            title="👢 Kullanıcı Atıldı",
            color=0xE74C3C,
            fields=[
                {"name": "👤 Yetkili", "value": interaction.user.mention, "inline": True},
                {"name": "🎯 Hedef", "value": str(kullanici), "inline": True},
                {"name": "📝 Sebep", "value": sebep, "inline": False},
                {"name": "📅 Tarih", "value": now, "inline": True},
            ],
        )
        await interaction.response.send_message(embed=embed)
        await log_action(interaction.guild, embed)

    @app_commands.command(name="mute", description="Bir kullanıcıyı sustur")
    @has_mod_role()
    async def mute(self, interaction: discord.Interaction, kullanici: discord.Member, sure_dakika: int = 10, sebep: str = "Sebep belirtilmedi"):
        duration = timedelta(minutes=sure_dakika)
        await kullanici.timeout(duration, reason=sebep)
        now = datetime.now(timezone.utc).strftime("%d.%m.%Y %H:%M")
        embed = make_embed(
            title="🔇 Kullanıcı Susturuldu",
            color=0xF1C40F,
            fields=[
                {"name": "👤 Yetkili", "value": interaction.user.mention, "inline": True},
                {"name": "🎯 Hedef", "value": kullanici.mention, "inline": True},
                {"name": "⏱️ Süre", "value": f"{sure_dakika} dakika", "inline": True},
                {"name": "📝 Sebep", "value": sebep, "inline": False},
                {"name": "📅 Tarih", "value": now, "inline": True},
            ],
        )
        await interaction.response.send_message(embed=embed)
        await log_action(interaction.guild, embed)

    @app_commands.command(name="uyarı", description="Bir kullanıcıya uyarı ver")
    @has_mod_role()
    async def uyari(self, interaction: discord.Interaction, kullanici: discord.Member, sebep: str):
        now = datetime.now(timezone.utc)
        await db.add_warning(kullanici.id, interaction.guild.id, sebep, interaction.user.id, now.strftime("%d.%m.%Y %H:%M"))
        embed = make_embed(
            title="⚠️ Uyarı Verildi",
            color=0xF1C40F,
            fields=[
                {"name": "👤 Yetkili", "value": interaction.user.mention, "inline": True},
                {"name": "🎯 Hedef", "value": kullanici.mention, "inline": True},
                {"name": "📝 Sebep", "value": sebep, "inline": False},
                {"name": "📅 Tarih", "value": now.strftime("%d.%m.%Y %H:%M"), "inline": True},
            ],
        )
        await interaction.response.send_message(embed=embed)
        await log_action(interaction.guild, embed)

    @app_commands.command(name="uyarılar", description="Bir kullanıcının uyarılarını listele")
    @has_mod_role()
    async def uyarilar(self, interaction: discord.Interaction, kullanici: discord.Member):
        warnings = await db.get_warnings(kullanici.id, interaction.guild.id)
        if not warnings:
            await interaction.response.send_message(
                embed=success_embed("✅ Temiz Sicil", f"{kullanici.mention} adlı kullanıcının hiç uyarısı yok."),
                ephemeral=True,
            )
            return

        lines = [f"**#{w['id']}** — {w['reason']} *(Tarih: {w['timestamp']})*" for w in warnings]
        embed = make_embed(
            title=f"⚠️ {kullanici.display_name} — Uyarılar",
            description="\n".join(lines),
        )
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="uyarısil", description="Bir kullanıcının uyarısını sil")
    @has_mod_role()
    async def uyarisil(self, interaction: discord.Interaction, kullanici: discord.Member, uyari_id: int):
        result = await db.delete_warning(uyari_id, kullanici.id, interaction.guild.id)
        if result:
            await interaction.response.send_message(
                embed=success_embed("✅ Uyarı Silindi", f"#{uyari_id} numaralı uyarı silindi.")
            )
        else:
            await interaction.response.send_message(
                embed=error_embed("❌ Hata", "Uyarı bulunamadı."), ephemeral=True
            )


async def setup(bot):
    await bot.add_cog(Moderation(bot))
