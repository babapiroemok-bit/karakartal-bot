import discord
from discord import app_commands
from discord.ext import commands
from datetime import datetime, timezone
import asyncio
from utils.embeds import make_embed, success_embed, BRAND_COLOR
import database as db


TICKET_TYPES = {
    "support": ("🎫 Destek Talebi", "destek"),
    "application": ("📋 Başvuru Formu", "basvuru"),
    "complaint": ("⚠️ Şikayet", "sikayet"),
}


class TicketCloseView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="🔒 Ticketı Kapat", style=discord.ButtonStyle.danger, custom_id="close_ticket")
    async def close_ticket(self, interaction: discord.Interaction, button: discord.ui.Button):
        channel = interaction.channel
        await db.close_ticket(channel.id)

        log_channel = discord.utils.get(interaction.guild.text_channels, name="ticket-log")
        if log_channel:
            embed = make_embed(
                title="🔒 Ticket Kapatıldı",
                color=0xE74C3C,
                fields=[
                    {"name": "📌 Kanal", "value": channel.name, "inline": True},
                    {"name": "👤 Kapatan", "value": interaction.user.mention, "inline": True},
                    {"name": "📅 Tarih", "value": datetime.now(timezone.utc).strftime("%d.%m.%Y %H:%M"), "inline": True},
                ],
            )
            await log_channel.send(embed=embed)

        await interaction.response.send_message("Ticket **5 saniye** içinde silinecek...")
        await asyncio.sleep(5)
        try:
            await channel.delete(reason="Ticket kapatıldı")
        except discord.NotFound:
            pass


class TicketOpenView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="🎫 Destek Talebi Aç", style=discord.ButtonStyle.primary, custom_id="ticket_support")
    async def support(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self._create_ticket(interaction, "support")

    @discord.ui.button(label="📋 Başvuru Formu", style=discord.ButtonStyle.success, custom_id="ticket_application")
    async def application(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self._create_ticket(interaction, "application")

    @discord.ui.button(label="⚠️ Şikayet Bildir", style=discord.ButtonStyle.danger, custom_id="ticket_complaint")
    async def complaint(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self._create_ticket(interaction, "complaint")

    async def _create_ticket(self, interaction: discord.Interaction, ticket_type: str):
        guild = interaction.guild
        user = interaction.user

        existing = discord.utils.get(
            guild.text_channels,
            name=f"ticket-{user.name.lower().replace(' ', '-')}"
        )
        if existing:
            await interaction.response.send_message(
                f"Zaten açık bir ticketın var: {existing.mention}", ephemeral=True
            )
            return

        staff_role = discord.utils.get(guild.roles, name="Yetkili") or \
                     discord.utils.get(guild.roles, name="Moderatör")

        overwrites = {
            guild.default_role: discord.PermissionOverwrite(read_messages=False),
            user: discord.PermissionOverwrite(read_messages=True, send_messages=True),
        }
        if staff_role:
            overwrites[staff_role] = discord.PermissionOverwrite(read_messages=True, send_messages=True)

        ticket_label, prefix = TICKET_TYPES[ticket_type]
        channel_name = f"ticket-{user.name.lower().replace(' ', '-')}"

        category = discord.utils.get(guild.categories, name="Tickets") or \
                   discord.utils.get(guild.categories, name="Destek")

        try:
            channel = await guild.create_text_channel(
                name=channel_name,
                overwrites=overwrites,
                category=category,
                reason=f"Ticket: {user}",
            )
        except discord.Forbidden:
            await interaction.response.send_message(
                "Ticket oluştururken hata oluştu. Yetkim yok.", ephemeral=True
            )
            return

        now = datetime.now(timezone.utc).strftime("%d.%m.%Y %H:%M")
        await db.create_ticket(guild.id, user.id, ticket_type, channel.id, now)

        embed = make_embed(
            title=f"{ticket_label}",
            description=(
                f"Merhaba {user.mention}! 👋\n\n"
                "Talebini buraya yazabilirsin. Ekibimiz en kısa sürede sana yardımcı olacak.\n\n"
                "Ticketı kapatmak için aşağıdaki butonu kullanabilirsin."
            ),
            color=BRAND_COLOR,
            fields=[
                {"name": "👤 Kullanıcı", "value": str(user), "inline": True},
                {"name": "📅 Tarih", "value": now, "inline": True},
            ],
        )
        view = TicketCloseView()
        await channel.send(embed=embed, view=view)
        await interaction.response.send_message(
            f"✅ Ticketın oluşturuldu: {channel.mention}", ephemeral=True
        )


class Tickets(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="destek", description="Destek talebi, başvuru veya şikayet oluştur")
    async def destek(self, interaction: discord.Interaction):
        embed = make_embed(
            title="🎫 KaraKartal Logistics — Destek Sistemi",
            description=(
                "Aşağıdaki butonları kullanarak talebini iletebilirsin.\n\n"
                "🎫 **Destek Talebi** — Teknik sorun veya yardım\n"
                "📋 **Başvuru Formu** — Ekibe katılmak için\n"
                "⚠️ **Şikayet Bildir** — Bir kullanıcı hakkında şikayet"
            ),
            color=BRAND_COLOR,
        )
        view = TicketOpenView()
        await interaction.response.send_message(embed=embed, view=view)


async def setup(bot):
    await bot.add_cog(Tickets(bot))
