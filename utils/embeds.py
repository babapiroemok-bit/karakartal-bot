import discord
from datetime import datetime, timezone


FOOTER_TEXT = "🦅 KaraKartal Logistics"
BRAND_COLOR = 0xE67E22
SUCCESS_COLOR = 0x2ECC71
ERROR_COLOR = 0xE74C3C
WARN_COLOR = 0xF1C40F
INFO_COLOR = 0x3498DB


def make_embed(
    title: str,
    description: str = "",
    color: int = BRAND_COLOR,
    fields: list = None,
    footer: bool = True,
    thumbnail: str = None,
    image: str = None,
) -> discord.Embed:
    embed = discord.Embed(
        title=title,
        description=description,
        color=color,
        timestamp=datetime.now(timezone.utc),
    )
    if footer:
        embed.set_footer(text=FOOTER_TEXT)
    if thumbnail:
        embed.set_thumbnail(url=thumbnail)
    if image:
        embed.set_image(url=image)
    for field in (fields or []):
        embed.add_field(
            name=field.get("name", "\u200b"),
            value=field.get("value", "\u200b"),
            inline=field.get("inline", False),
        )
    return embed


def success_embed(title: str, description: str = "", fields: list = None) -> discord.Embed:
    return make_embed(title, description, SUCCESS_COLOR, fields)


def error_embed(title: str, description: str = "", fields: list = None) -> discord.Embed:
    return make_embed(title, description, ERROR_COLOR, fields)


def warn_embed(title: str, description: str = "", fields: list = None) -> discord.Embed:
    return make_embed(title, description, WARN_COLOR, fields)
