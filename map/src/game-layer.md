# Game Layer

The Game layer defines collision tiles and initial entity positions. It is a tilemap layer with `TILESLAYERFLAG_GAME` set in its tilemap flags.

Find it by this flag, not by a layer or group name. Older maps do not have name fields. See [Layers](./layers.md#tilemap-layer) for the item layout.

## Coordinates

Each Game layer tile spans **32 by 32 world units**. Tile `(0, 0)` is at the top-left corner. X increases to the right, and Y increases downward.

```c
grid_index = tile_y * width + tile_x
world_x = tile_x * 32 + 16
world_y = tile_y * 32 + 16
```

The `+16` places an entity at the tile's center. A marker at tile `(10, 5)` produces world position `(336, 176)`.

## Physics Tiles

| Tile index | Name | Meaning |
| --- | --- | --- |
| 0 | TILE_AIR | No collision. |
| 1 | TILE_SOLID | Solid, hookable wall. |
| 2 | TILE_DEATH | Death tile, checked separately from solid collision. |
| 3 | TILE_NOHOOK | Solid wall that the hook cannot attach to. |

The hook retracts when it hits a no-hook tile. It does not bounce off it.

Tile texture flags do not change these collision shapes. A flipped solid tile is still a full solid tile. Visual layers with the same numeric tile indices do not define collision.

## Entity Tiles

Entity markers identify spawn points, flag stands, and pickups. They have no solid collision.

The 0.6 source uses `ENTITY_OFFSET = 191`. The stored tile index is the entity ID plus this offset:

```c
entity_id = tile.index - ENTITY_OFFSET
```

| Tile index | Entity ID | Name | Purpose |
| --- | --- | --- | --- |
| 191 | 0 | ENTITY_NULL | No entity. |
| 192 | 1 | ENTITY_SPAWN | General spawn point. |
| 193 | 2 | ENTITY_SPAWN_RED | Red team spawn point. |
| 194 | 3 | ENTITY_SPAWN_BLUE | Blue team spawn point. |
| 195 | 4 | ENTITY_FLAGSTAND_RED | Red flag stand. |
| 196 | 5 | ENTITY_FLAGSTAND_BLUE | Blue flag stand. |
| 197 | 6 | ENTITY_ARMOR_1 | Armor pickup. |
| 198 | 7 | ENTITY_HEALTH_1 | Health pickup. |
| 199 | 8 | ENTITY_WEAPON_SHOTGUN | Shotgun pickup. |
| 200 | 9 | ENTITY_WEAPON_GRENADE | Grenade pickup. |
| 201 | 10 | ENTITY_POWERUP_NINJA | Ninja pickup. |
| 202 | 11 | ENTITY_WEAPON_RIFLE | Laser rifle pickup. |

The grid stores the tile index; the game controller receives the entity ID after subtracting `ENTITY_OFFSET`.

### Scanning Entities

```c
for y from 0 to height - 1:
    for x from 0 to width - 1:
        index = tiles[y * width + x].index

        if 192 <= index and index <= 202:
            entity_id = index - 191
            position = (x * 32 + 16, y * 32 + 16)
            handleEntity(entity_id, position)
```

A spawn marker registers a possible spawn position. A pickup marker creates a pickup. Flag markers are used by CTF game logic. The chosen game mode determines how these positions are used; selecting a map does not itself select a game mode.

Markers contain no respawn duration, initial delay, or current pickup state. Those values belong to game logic, not the `.map` file.

Keep entity indices available until scanning is complete. Building a separate collision grid avoids replacing the markers with collision flags.

## Death Tiles

A death tile is not solid. Movement and line queries can pass through it. Character logic must check `COLFLAG_DEATH` separately and trigger death when a sampled position touches it.

The 0.6 character checks four positions offset by `28 / 3` from its center:

```c
radius = 28 / 3

for offset in [(radius, -radius), (radius, radius),
               (-radius, -radius), (-radius, radius)]:
    if (getCollisionAt(position + offset) & COLFLAG_DEATH) != 0:
        killCharacter()
        stop
```

The flag controller checks the flag's position and returns it to its stand if it touches a death tile.

## Outside the Map

Collision queries clamp to the nearest edge tile. They do not determine whether an entity is too far outside the map.

The 0.6 game uses a separate clipping check with a **200-tile margin**:

```c
function gameLayerClipped(position):
    x = truncate(round(position.x) / 32)
    y = truncate(round(position.y) / 32)

    return x < -200 or x > width + 200
        or y < -200 or y > height + 200
```

Rounding uses the nearest integer, with halfway values rounded away from zero. Integer division truncates toward zero.

Characters die, projectiles terminate, and flags return to their stands when this check reports clipping. Crossing the visible map edge alone does not trigger it; the entity must pass the 200-tile margin.
