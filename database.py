import aiosqlite
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "karakartal.db")


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY,
                guild_id INTEGER,
                xp INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                balance INTEGER DEFAULT 0,
                warnings INTEGER DEFAULT 0
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS warnings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                guild_id INTEGER,
                reason TEXT,
                moderator_id INTEGER,
                timestamp TEXT
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS drivers (
                user_id INTEGER PRIMARY KEY,
                guild_id INTEGER,
                full_name TEXT,
                plate TEXT,
                total_deliveries INTEGER DEFAULT 0,
                total_earned INTEGER DEFAULT 0,
                active INTEGER DEFAULT 1
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS deliveries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id INTEGER,
                start_loc TEXT,
                end_loc TEXT,
                cargo TEXT,
                reward INTEGER,
                status TEXT DEFAULT 'open',
                driver_id INTEGER,
                created_at TEXT,
                completed_at TEXT
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS vehicles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id INTEGER,
                plate TEXT,
                model TEXT,
                capacity TEXT,
                assigned_driver INTEGER
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id INTEGER,
                user_id INTEGER,
                type TEXT,
                channel_id INTEGER,
                status TEXT DEFAULT 'open',
                created_at TEXT
            )
        """)
        await db.commit()


async def get_user(user_id: int, guild_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM users WHERE user_id = ? AND guild_id = ?",
            (user_id, guild_id)
        ) as cursor:
            row = await cursor.fetchone()
            if row:
                return dict(row)
            await db.execute(
                "INSERT INTO users (user_id, guild_id) VALUES (?, ?)",
                (user_id, guild_id)
            )
            await db.commit()
            return {"user_id": user_id, "guild_id": guild_id, "xp": 0, "level": 1, "balance": 0, "warnings": 0}


async def update_user(user_id: int, guild_id: int, **kwargs):
    if not kwargs:
        return
    fields = ", ".join(f"{k} = ?" for k in kwargs)
    values = list(kwargs.values()) + [user_id, guild_id]
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            f"UPDATE users SET {fields} WHERE user_id = ? AND guild_id = ?",
            values
        )
        await db.commit()


async def get_top_xp(guild_id: int, limit: int = 10):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM users WHERE guild_id = ? ORDER BY xp DESC LIMIT ?",
            (guild_id, limit)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def add_warning(user_id: int, guild_id: int, reason: str, moderator_id: int, timestamp: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO warnings (user_id, guild_id, reason, moderator_id, timestamp) VALUES (?, ?, ?, ?, ?)",
            (user_id, guild_id, reason, moderator_id, timestamp)
        )
        await db.execute(
            "UPDATE users SET warnings = warnings + 1 WHERE user_id = ? AND guild_id = ?",
            (user_id, guild_id)
        )
        await db.commit()


async def get_warnings(user_id: int, guild_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM warnings WHERE user_id = ? AND guild_id = ? ORDER BY id DESC",
            (user_id, guild_id)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def delete_warning(warning_id: int, user_id: int, guild_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            "SELECT id FROM warnings WHERE id = ? AND user_id = ? AND guild_id = ?",
            (warning_id, user_id, guild_id)
        ) as cursor:
            row = await cursor.fetchone()
        if row:
            await db.execute("DELETE FROM warnings WHERE id = ?", (warning_id,))
            await db.execute(
                "UPDATE users SET warnings = MAX(0, warnings - 1) WHERE user_id = ? AND guild_id = ?",
                (user_id, guild_id)
            )
            await db.commit()
            return True
        return False


async def register_driver(user_id: int, guild_id: int, full_name: str, plate: str):
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT user_id FROM drivers WHERE user_id = ?", (user_id,)) as cursor:
            existing = await cursor.fetchone()
        if existing:
            return False
        await db.execute(
            "INSERT INTO drivers (user_id, guild_id, full_name, plate) VALUES (?, ?, ?, ?)",
            (user_id, guild_id, full_name, plate)
        )
        await db.commit()
        return True


async def get_driver(user_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM drivers WHERE user_id = ?", (user_id,)) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None


async def get_all_drivers(guild_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM drivers WHERE guild_id = ? AND active = 1",
            (guild_id,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def add_vehicle(guild_id: int, plate: str, model: str, capacity: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO vehicles (guild_id, plate, model, capacity) VALUES (?, ?, ?, ?)",
            (guild_id, plate, model, capacity)
        )
        await db.commit()


async def get_vehicles(guild_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM vehicles WHERE guild_id = ?", (guild_id,)) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def create_delivery(guild_id: int, start_loc: str, end_loc: str, cargo: str, reward: int, created_at: str):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO deliveries (guild_id, start_loc, end_loc, cargo, reward, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (guild_id, start_loc, end_loc, cargo, reward, created_at)
        )
        await db.commit()
        return cursor.lastrowid


async def get_delivery(delivery_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM deliveries WHERE id = ?", (delivery_id,)) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None


async def claim_delivery(delivery_id: int, driver_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            "SELECT status FROM deliveries WHERE id = ?", (delivery_id,)
        ) as cursor:
            row = await cursor.fetchone()
        if not row or row[0] != 'open':
            return False
        await db.execute(
            "UPDATE deliveries SET status = 'active', driver_id = ? WHERE id = ?",
            (driver_id, delivery_id)
        )
        await db.commit()
        return True


async def complete_delivery(delivery_id: int, driver_id: int, completed_at: str):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM deliveries WHERE id = ? AND driver_id = ? AND status = 'active'",
            (delivery_id, driver_id)
        ) as cursor:
            row = await cursor.fetchone()
        if not row:
            return None
        d = dict(row)
        await db.execute(
            "UPDATE deliveries SET status = 'completed', completed_at = ? WHERE id = ?",
            (completed_at, delivery_id)
        )
        await db.execute(
            "UPDATE drivers SET total_deliveries = total_deliveries + 1, total_earned = total_earned + ? WHERE user_id = ?",
            (d['reward'], driver_id)
        )
        await db.execute(
            "UPDATE users SET balance = balance + ? WHERE user_id = ? AND guild_id = ?",
            (d['reward'], driver_id, d['guild_id'])
        )
        await db.commit()
        return d


async def get_open_deliveries(guild_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM deliveries WHERE guild_id = ? AND status = 'open' ORDER BY id DESC",
            (guild_id,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def get_driver_deliveries(driver_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM deliveries WHERE driver_id = ? AND status = 'completed' ORDER BY completed_at DESC",
            (driver_id,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def get_top_drivers(guild_id: int, limit: int = 10):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT d.*, u.balance FROM drivers d LEFT JOIN users u ON d.user_id = u.user_id WHERE d.guild_id = ? ORDER BY u.balance DESC LIMIT ?",
            (guild_id, limit)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def create_ticket(guild_id: int, user_id: int, ticket_type: str, channel_id: int, created_at: str):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO tickets (guild_id, user_id, type, channel_id, created_at) VALUES (?, ?, ?, ?, ?)",
            (guild_id, user_id, ticket_type, channel_id, created_at)
        )
        await db.commit()
        return cursor.lastrowid


async def close_ticket(channel_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE tickets SET status = 'closed' WHERE channel_id = ?",
            (channel_id,)
        )
        await db.commit()


async def get_server_stats(guild_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            "SELECT COUNT(*) FROM deliveries WHERE guild_id = ? AND status = 'open'", (guild_id,)
        ) as c:
            active_deliveries = (await c.fetchone())[0]
        async with db.execute(
            "SELECT COUNT(*) FROM drivers WHERE guild_id = ? AND active = 1", (guild_id,)
        ) as c:
            active_drivers = (await c.fetchone())[0]
        async with db.execute(
            "SELECT d.full_name FROM drivers d LEFT JOIN users u ON d.user_id = u.user_id WHERE d.guild_id = ? ORDER BY u.balance DESC LIMIT 1",
            (guild_id,)
        ) as c:
            top_row = await c.fetchone()
            top_driver = top_row[0] if top_row else "Henüz yok"
        return {
            "active_deliveries": active_deliveries,
            "active_drivers": active_drivers,
            "top_driver": top_driver
        }
