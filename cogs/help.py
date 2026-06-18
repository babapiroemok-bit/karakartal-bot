import discord
from discord import app_commands
from discord.ext import commands
from utils.embeds import make_embed, BRAND_COLOR


HELP_PAGES = [
    {
        "title": "👥 Üye Sistemi",
        "fields": [
            {"name": "/seviye", "value": "Seviyeni ve XP bilgilerini göster", "inline": False},
            {"name": "/liderlik", "value": "Sunucunun XP liderlik tablosu (Top 10)", "inline": False},
            {"name": "/bakiye", "value": "Mevcut bakiyeni görüntüle", "inline": False},
        ],
    },
    {
        "title": "🛡️ Moderasyon",
        "fields": [
            {"name": "/ban @kullanıcı [sebep]", "value": "Kullanıcıyı yasakla", "inline": False},
            {"name": "/kick @kullanıcı [sebep]", "value": "Kullanıcıyı at", "inline": False},
            {"name": "/mute @kullanıcı [dakika] [sebep]", "value": "Kullanıcıyı sustur", "inline": False},
            {"name": "/uyarı @kullanıcı [sebep]", "value": "Kullanıcıya uyarı ver", "inline": False},
            {"name": "/uyarılar @kullanıcı", "value": "Kullanıcının uyarılarını listele", "inline": False},
            {"name": "/uyarısil @kullanıcı [id]", "value": "Uyarıyı sil", "inline": False},
        ],
    },
    {
        "title": "📦 Lojistik",
        "fields": [
            {"name": "/şoför-kayıt [ad] [plaka]", "value": "Şoför olarak kayıt ol", "inline": False},
            {"name": "/şoför-profil", "value": "Şoför profilini görüntüle", "inline": False},
            {"name": "/şoförler", "value": "Tüm aktif şoförleri listele", "inline": False},
            {"name": "/araç-ekle [plaka] [model] [kapasite]", "value": "Sisteme araç ekle (Admin)", "inline": False},
            {"name": "/araç-listesi", "value": "Tüm araçları listele", "inline": False},
            {"name": "/teslimat-oluştur [baş] [bitiş] [yük] [ücret]", "value": "Yeni teslimat oluştur", "inline": False},
            {"name": "/teslimat-al [id]", "value": "Teslimatı üstlen", "inline": False},
            {"name": "/teslimat-tamamla [id]", "value": "Teslimatı tamamla ve ödülünü al", "inline": False},
            {"name": "/aktif-teslimatlar", "value": "Açık teslimatları listele", "inline": False},
            {"name": "/teslimat-geçmiş", "value": "Tamamladığın teslimatlar", "inline": False},
            {"name": "/sıralama", "value": "En zengin şoförler listesi", "inline": False},
        ],
    },
    {
        "title": "🎫 Destek",
        "fields": [
            {"name": "/destek", "value": "Destek talebi, başvuru veya şikayet oluştur", "inline": False},
        ],
    },
    {
        "title": "📊 Durum & Seviye",
        "fields": [
            {"name": "/durum", "value": "Sunucu istatistiklerini görüntüle", "inline": False},
            {"name": "/seviye", "value": "Kendi seviye bilgilerini görüntüle", "inline": False},
            {"name": "/liderlik", "value": "Top 10 XP sıralaması", "inline": False},
        ],
    },
]


class HelpView(discord.ui.View):
    def __init__(self, page: int = 0):
        super().__init__(timeout=120)
        self.page = page
        self._update_buttons()

    def _update_buttons(self):
        self.prev_btn.disabled = self.page == 0
        self.next_btn.disabled = self.page == len(HELP_PAGES) - 1
        self.page_label.label = f"{self.page + 1} / {len(HELP_PAGES)}"

    def build_embed(self) -> discord.Embed:
        data = HELP_PAGES[self.page]
        return make_embed(
            title=f"📖 Yardım — {data['title']}",
            description=f"Sayfa {self.page + 1}/{len(HELP_PAGES)}",
            color=BRAND_COLOR,
            fields=data["fields"],
        )

    @discord.ui.button(label="◀ Önceki", style=discord.ButtonStyle.secondary)
    async def prev_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        self.page = max(0, self.page - 1)
        self._update_buttons()
        await interaction.response.edit_message(embed=self.build_embed(), view=self)

    @discord.ui.button(label="1 / 5", style=discord.ButtonStyle.secondary, disabled=True)
    async def page_label(self, interaction: discord.Interaction, button: discord.ui.Button):
        pass

    @discord.ui.button(label="Sonraki ▶", style=discord.ButtonStyle.secondary)
    async def next_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        self.page = min(len(HELP_PAGES) - 1, self.page + 1)
        self._update_buttons()
        await interaction.response.edit_message(embed=self.build_embed(), view=self)


class Help(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="yardım", description="Tüm komutları görüntüle")
    async def yardim(self, interaction: discord.Interaction):
        view = HelpView(page=0)
        await interaction.response.send_message(embed=view.build_embed(), view=view)


async def setup(bot):
    await bot.add_cog(Help(bot))
