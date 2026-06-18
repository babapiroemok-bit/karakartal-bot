import discord
from discord import app_commands
from discord.ext import commands
from datetime import datetime, timezone
from utils.embeds import make_embed, success_embed, error_embed, BRAND_COLOR
import database as db

LOGISTICS_FOOTER = "🦅 KaraKartal Logistics"


class ActiveDeliveriesView(discord.ui.View):
    def __init__(self, deliveries):
        super().__init__(timeout=120)
        self.deliveries = deliveries

    @discord.ui.button(label="🔄 Yenile", style=discord.ButtonStyle.secondary)
    async def refresh(self, interaction: discord.Interaction, button: discord.ui.Button):
        deliveries = await db.get_open_deliveries(interaction.guild.id)
        embed = build_deliveries_embed(deliveries)
        await interaction.response.edit_message(embed=embed)


def build_deliveries_embed(deliveries):
    if not deliveries:
        return make_embed("📦 Aktif Teslimatlar", "Şu anda açık teslimat bulunmuyor.", color=BRAND_COLOR)
    fields = []
    for d in deliveries[:10]:
        fields.append({
            "name": f"#{d['id']} — {d['start_loc']} → {d['end_loc']}",
            "value": f"📦 Yük: {d['cargo']}\n💰 Ücret: ₺{d['reward']:,}\n📅 Tarih: {d['created_at']}",
            "inline": False,
        })
    return make_embed("📦 Aktif Teslimatlar", f"Toplam **{len(deliveries)}** açık teslimat:", color=BRAND_COLOR, fields=fields)


class Logistics(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="şoför-kayıt", description="Şoför olarak kayıt ol")
    async def sofor_kayit(self, interaction: discord.Interaction, ad_soyad: str, araç_plakası: str):
        result = await db.register_driver(interaction.user.id, interaction.guild.id, ad_soyad, araç_plakası)
        if not result:
            await interaction.response.send_message(
                embed=error_embed("❌ Hata", "Zaten bir şoför kaydın mevcut!"), ephemeral=True
            )
            return
        await interaction.response.send_message(
            embed=success_embed(
                "✅ Şoför Kaydı Tamamlandı",
                f"{interaction.user.mention} başarıyla sisteme kaydedildi!",
                fields=[
                    {"name": "👤 Ad Soyad", "value": ad_soyad, "inline": True},
                    {"name": "🚗 Plaka", "value": araç_plakası, "inline": True},
                ],
            )
        )

    @app_commands.command(name="şoför-profil", description="Şoför profilini görüntüle")
    async def sofor_profil(self, interaction: discord.Interaction):
        driver = await db.get_driver(interaction.user.id)
        if not driver:
            await interaction.response.send_message(
                embed=error_embed("❌ Kayıt Yok", "Şoför kaydın bulunmuyor. `/şoför-kayıt` ile kayıt olabilirsin."),
                ephemeral=True,
            )
            return
        user = await db.get_user(interaction.user.id, interaction.guild.id)
        embed = make_embed(
            title=f"🚛 Şoför Profili — {driver['full_name']}",
            color=BRAND_COLOR,
            fields=[
                {"name": "🚗 Araç Plakası", "value": driver["plate"], "inline": True},
                {"name": "📦 Toplam Teslimat", "value": str(driver["total_deliveries"]), "inline": True},
                {"name": "💰 Toplam Kazanç", "value": f"₺{driver['total_earned']:,}", "inline": True},
                {"name": "💳 Mevcut Bakiye", "value": f"₺{user['balance']:,}", "inline": True},
                {"name": "✅ Durum", "value": "Aktif" if driver["active"] else "Pasif", "inline": True},
            ],
        )
        embed.set_thumbnail(url=interaction.user.display_avatar.url)
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="şoförler", description="Tüm aktif şoförleri listele")
    async def soforler(self, interaction: discord.Interaction):
        drivers = await db.get_all_drivers(interaction.guild.id)
        if not drivers:
            await interaction.response.send_message(
                embed=error_embed("📋 Şoförler", "Henüz kayıtlı şoför bulunmuyor.")
            )
            return
        fields = [
            {"name": f"🚛 {d['full_name']}", "value": f"Plaka: {d['plate']} | Teslimat: {d['total_deliveries']}", "inline": False}
            for d in drivers
        ]
        embed = make_embed(f"🚛 Aktif Şoförler ({len(drivers)})", color=BRAND_COLOR, fields=fields)
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="araç-ekle", description="Sisteme yeni araç ekle (Admin)")
    @app_commands.checks.has_permissions(administrator=True)
    async def arac_ekle(self, interaction: discord.Interaction, plaka: str, model: str, kapasite: str):
        await db.add_vehicle(interaction.guild.id, plaka, model, kapasite)
        await interaction.response.send_message(
            embed=success_embed(
                "✅ Araç Eklendi",
                fields=[
                    {"name": "🚗 Plaka", "value": plaka, "inline": True},
                    {"name": "🔧 Model", "value": model, "inline": True},
                    {"name": "📦 Kapasite", "value": kapasite, "inline": True},
                ],
            )
        )

    @app_commands.command(name="araç-listesi", description="Tüm araçları listele")
    async def arac_listesi(self, interaction: discord.Interaction):
        vehicles = await db.get_vehicles(interaction.guild.id)
        if not vehicles:
            await interaction.response.send_message(embed=error_embed("🚗 Araçlar", "Henüz araç eklenmemiş."))
            return
        fields = [
            {"name": f"🚗 {v['plate']}", "value": f"Model: {v['model']} | Kapasite: {v['capacity']}", "inline": False}
            for v in vehicles
        ]
        embed = make_embed(f"🚗 Araç Listesi ({len(vehicles)})", color=BRAND_COLOR, fields=fields)
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="teslimat-oluştur", description="Yeni teslimat oluştur")
    async def teslimat_olustur(self, interaction: discord.Interaction, başlangıç: str, bitiş: str, yük: str, ücret: int):
        now = datetime.now(timezone.utc).strftime("%d.%m.%Y %H:%M")
        delivery_id = await db.create_delivery(interaction.guild.id, başlangıç, bitiş, yük, ücret, now)
        await interaction.response.send_message(
            embed=success_embed(
                "📦 Teslimat Oluşturuldu",
                f"Teslimat ID: **#{delivery_id}**",
                fields=[
                    {"name": "📍 Başlangıç", "value": başlangıç, "inline": True},
                    {"name": "🏁 Bitiş", "value": bitiş, "inline": True},
                    {"name": "📦 Yük", "value": yük, "inline": True},
                    {"name": "💰 Ücret", "value": f"₺{ücret:,}", "inline": True},
                ],
            )
        )

    @app_commands.command(name="teslimat-al", description="Teslimatı üstlen")
    async def teslimat_al(self, interaction: discord.Interaction, id: int):
        driver = await db.get_driver(interaction.user.id)
        if not driver:
            await interaction.response.send_message(
                embed=error_embed("❌ Kayıt Yok", "Önce `/şoför-kayıt` komutu ile kayıt olmalısın."), ephemeral=True
            )
            return
        result = await db.claim_delivery(id, interaction.user.id)
        if not result:
            await interaction.response.send_message(
                embed=error_embed("❌ Hata", "Bu teslimat mevcut değil veya zaten alınmış."), ephemeral=True
            )
            return
        await interaction.response.send_message(
            embed=success_embed("✅ Teslimat Alındı", f"#{id} numaralı teslimat senin üzerine kaydedildi!")
        )

    @app_commands.command(name="teslimat-tamamla", description="Teslimatı tamamla ve ödülünü al")
    async def teslimat_tamamla(self, interaction: discord.Interaction, id: int):
        now = datetime.now(timezone.utc).strftime("%d.%m.%Y %H:%M")
        delivery = await db.complete_delivery(id, interaction.user.id, now)
        if not delivery:
            await interaction.response.send_message(
                embed=error_embed("❌ Hata", "Bu teslimat sana ait değil veya zaten tamamlanmış."), ephemeral=True
            )
            return
        await interaction.response.send_message(
            embed=success_embed(
                "🎉 Teslimat Tamamlandı!",
                f"#{id} numaralı teslimat başarıyla tamamlandı!",
                fields=[
                    {"name": "📍 Güzergah", "value": f"{delivery['start_loc']} → {delivery['end_loc']}", "inline": False},
                    {"name": "💰 Kazanılan", "value": f"₺{delivery['reward']:,}", "inline": True},
                ],
            )
        )

    @app_commands.command(name="aktif-teslimatlar", description="Açık teslimatları görüntüle")
    async def aktif_teslimatlar(self, interaction: discord.Interaction):
        deliveries = await db.get_open_deliveries(interaction.guild.id)
        embed = build_deliveries_embed(deliveries)
        view = ActiveDeliveriesView(deliveries)
        await interaction.response.send_message(embed=embed, view=view)

    @app_commands.command(name="teslimat-geçmiş", description="Tamamladığın teslimatları görüntüle")
    async def teslimat_gecmis(self, interaction: discord.Interaction):
        deliveries = await db.get_driver_deliveries(interaction.user.id)
        if not deliveries:
            await interaction.response.send_message(
                embed=error_embed("📋 Teslimat Geçmişi", "Henüz tamamlanmış teslimatın yok.")
            )
            return
        fields = [
            {"name": f"#{d['id']} — {d['start_loc']} → {d['end_loc']}", "value": f"💰 ₺{d['reward']:,} | 📅 {d['completed_at']}", "inline": False}
            for d in deliveries[:10]
        ]
        embed = make_embed(f"📋 Teslimat Geçmişi ({len(deliveries)})", color=BRAND_COLOR, fields=fields)
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="bakiye", description="Mevcut bakiyeni görüntüle")
    async def bakiye(self, interaction: discord.Interaction):
        user = await db.get_user(interaction.user.id, interaction.guild.id)
        await interaction.response.send_message(
            embed=make_embed(
                "💳 Bakiye",
                f"{interaction.user.mention} adlı kullanıcının mevcut bakiyesi:",
                color=BRAND_COLOR,
                fields=[{"name": "💰 Bakiye", "value": f"₺{user['balance']:,}", "inline": True}],
            )
        )

    @app_commands.command(name="sıralama", description="En zengin şoförler listesi")
    async def siralama(self, interaction: discord.Interaction):
        top = await db.get_top_drivers(interaction.guild.id, limit=10)
        medals = ["🥇", "🥈", "🥉"] + ["🏅"] * 7
        if not top:
            await interaction.response.send_message(embed=error_embed("📊 Sıralama", "Henüz veri yok."))
            return
        lines = [
            f"{medals[i]} **{d['full_name']}** — ₺{(d.get('balance') or 0):,}"
            for i, d in enumerate(top)
        ]
        embed = make_embed("💰 En Zengin Şoförler", "\n".join(lines), color=BRAND_COLOR)
        await interaction.response.send_message(embed=embed)


async def setup(bot):
    await bot.add_cog(Logistics(bot))
