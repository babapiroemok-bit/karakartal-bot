import discord
from discord.ext import commands
from utils.embeds import make_embed, BRAND_COLOR


class Welcome(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        guild = member.guild

        welcome_channel = discord.utils.get(guild.text_channels, name="hoş-geldin") or \
                          discord.utils.get(guild.text_channels, name="genel")

        if welcome_channel:
            embed = make_embed(
                title="🦅 KaraKartal Logistics'e Hoş Geldin!",
                description=(
                    f"Merhaba {member.mention}! Sunucumuza hoş geldin!\n\n"
                    f"Sunucumuzda şu anda **{guild.member_count}** üye bulunmaktadır.\n\n"
                    "📋 Lütfen kurallarımızı okumayı unutma!\n"
                    "🚛 Lojistik ekibimize katılmak için kayıt yaptırabilirsin."
                ),
                color=BRAND_COLOR,
                fields=[
                    {"name": "👤 Kullanıcı", "value": str(member), "inline": True},
                    {"name": "📅 Katılım Tarihi", "value": member.joined_at.strftime("%d.%m.%Y") if member.joined_at else "Bilinmiyor", "inline": True},
                    {"name": "👥 Toplam Üye", "value": str(guild.member_count), "inline": True},
                ],
            )
            embed.set_thumbnail(url=member.display_avatar.url)
            await welcome_channel.send(embed=embed)

        role = discord.utils.get(guild.roles, name="Üye")
        if not role:
            try:
                role = await guild.create_role(name="Üye", reason="Otomatik üye rolü oluşturuldu")
            except discord.Forbidden:
                return
        try:
            await member.add_roles(role)
        except discord.Forbidden:
            pass


async def setup(bot):
    await bot.add_cog(Welcome(bot))
