# 🦅 KaraKartal Logistics Discord Bot

KaraKartal Logistics sunucusu için geliştirilmiş kapsamlı bir Discord botu. Lojistik yönetimi, moderasyon, seviye sistemi ve destek sistemi içerir.

## Özellikler

- **👋 Hoş Geldin Sistemi** — Yeni üyelere hoş geldin mesajı ve otomatik rol atama
- **📊 Seviye Sistemi** — Mesaj başına XP, seviye atlama ve liderlik tablosu
- **🛡️ Moderasyon** — Ban, kick, mute, uyarı sistemi ve log kanalı
- **🚛 Lojistik Sistemi** — Şoför kaydı, araç yönetimi, teslimat oluşturma ve takibi
- **🎫 Ticket Sistemi** — Destek talebi, başvuru formu ve şikayet bildirme
- **📡 Durum Sistemi** — Dönen presence mesajları ve sunucu istatistikleri

## Kurulum

### Yerel Kurulum

```bash
# Bağımlılıkları yükle
pip install -r requirements.txt

# .env dosyası oluştur
cp .env.example .env
# .env dosyasına DISCORD_TOKEN değerini ekle

# Botu başlat
python main.py
```

### Railway Deployment

1. [Railway.app](https://railway.app) hesabı oluştur
2. **New Project → Deploy from GitHub Repo** seç
3. Bu repoyu bağla: `karakartal-bot`
4. **Variables** sekmesinden `DISCORD_TOKEN` ekle
5. Deploy!

## Gerekli Kanal İsimleri

| Kanal | Açıklama |
|-------|----------|
| `#hoş-geldin` veya `#genel` | Hoş geldin mesajları |
| `#yetkili-log` veya `#mod-log` | Moderasyon logları |
| `#ticket-log` | Ticket logları |

## Gerekli Roller

| Rol | Açıklama |
|-----|----------|
| `Üye` | Otomatik atanan temel üye rolü |
| `Yetkili` veya `Moderatör` | Moderasyon komutlarına erişim |

## Komutlar

### Üye Komutları
- `/seviye` — Seviye ve XP bilgisi
- `/liderlik` — Top 10 XP sıralaması
- `/bakiye` — Mevcut bakiye
- `/yardım` — Tüm komutlar

### Moderasyon Komutları *(Yetkili/Moderatör rolü gerekli)*
- `/ban @kullanıcı [sebep]`
- `/kick @kullanıcı [sebep]`
- `/mute @kullanıcı [dakika] [sebep]`
- `/uyarı @kullanıcı [sebep]`
- `/uyarılar @kullanıcı`
- `/uyarısil @kullanıcı [id]`

### Lojistik Komutları
- `/şoför-kayıt [ad] [plaka]`
- `/şoför-profil`
- `/şoförler`
- `/araç-ekle [plaka] [model] [kapasite]` *(Admin)*
- `/araç-listesi`
- `/teslimat-oluştur [baş] [bitiş] [yük] [ücret]`
- `/teslimat-al [id]`
- `/teslimat-tamamla [id]`
- `/aktif-teslimatlar`
- `/teslimat-geçmiş`
- `/sıralama`

### Destek & Durum
- `/destek` — Ticket aç
- `/durum` — Sunucu istatistikleri

## Teknolojiler

- **Python 3.10+**
- **discord.py 2.x** — Slash commands (app_commands)
- **aiosqlite** — Asenkron SQLite veritabanı
- **PyNaCl** — Ses kanalı desteği

## Lisans

MIT
