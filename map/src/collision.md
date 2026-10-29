# Collision

Collision queries check points, trace lines, and move characters against the map's solid tiles. Positions and velocities in the pseudocode are two-component vectors.

Collision comes from the [Game layer](./game-layer.md). Visual layers, images, tile transformation flags, and quads do not affect it.

## Collision Flags

| Value | Name | Meaning |
| --- | --- | --- |
| 0 | None | No collision flag. |
| 1 | COLFLAG_SOLID | Blocks movement and solid line queries. |
| 2 | COLFLAG_DEATH | Marks a death tile for game logic. |
| 4 | COLFLAG_NOHOOK | Prevents hook attachment; combined with solid. |

A no-hook tile combines `COLFLAG_SOLID` and `COLFLAG_NOHOOK`, producing value `5`. Use bitwise AND to check individual flags.

## Initialization

Translate the Game layer's tile indices into collision values:

| Game tile index | Collision value |
| --- | --- |
| 1, solid | 1 |
| 2, death | 2 |
| 3, no-hook | 5 |
| All other indices | 0 |

```c
for tile in game_tiles:
    switch tile.index:
        case TILE_SOLID: collision.append(COLFLAG_SOLID)
        case TILE_DEATH: collision.append(COLFLAG_DEATH)
        case TILE_NOHOOK: collision.append(COLFLAG_SOLID | COLFLAG_NOHOOK)
        default: collision.append(0)
```

Entity markers have no collision. Keep their original indices available until [entity scanning](./game-layer.md#scanning-entities) is complete.

## Grid Coordinates

The grid dimensions are in tiles. Each tile spans 32 world units.

Point queries round world coordinates to integers, divide by 32 with truncation toward zero, and clamp to the map boundary:

```c
function getCollisionAt(position):
    x = clamp(truncate(round(position.x) / 32), 0, width - 1)
    y = clamp(truncate(round(position.y) / 32), 0, height - 1)
    return collision[y * width + x]
```

Rounding uses the nearest integer, with halfway values rounded away from zero.

A query outside the map samples the nearest edge tile. It does not automatically return solid or report that the position is out of bounds. [Game layer clipping](./game-layer.md#outside-the-map) is a separate rule.

## Point Queries

### checkPoint(position)

Returns whether the sampled tile has `COLFLAG_SOLID` set:

```c
function checkPoint(position):
    return (getCollisionAt(position) & COLFLAG_SOLID) != 0
```

It returns true for solid and no-hook tiles, but false for death tiles.

### getCollisionAt(position)

Returns all flags at the sampled position. For example:

```c
is_death = (getCollisionAt(position) & COLFLAG_DEATH) != 0
```

The query does not kill a character. Game logic must act on the returned flag.

## Line Queries

### intersectLine(start, end)

The routine samples a segment at roughly one-world-unit intervals and returns the first solid sample:

```c
function intersectLine(start, end):
    distance = length(end - start)
    if distance == 0:
        return (0, end, end)

    sample_count = truncate(distance + 1)
    previous = start

    for i from 0 to sample_count - 1:
        position = start + (end - start) * (i / distance)
        if checkPoint(position):
            return (getCollisionAt(position), position, previous)
        previous = position

    return (0, end, end)
```

| Result | Meaning |
| --- | --- |
| flags | Collision flags at the first solid sample; `0` if none. |
| hit_position | First sampled solid position, or the destination on a miss. |
| before_hit | Previous sample, or the destination on a miss. |

The query checks solid tiles at the sampled positions and passes through death tiles. It is a sampled approximation, not an exact intersection with tile boundaries. For a fractional distance, the last tested sample may be before the destination.

A zero-length segment returns `(0, end, end)` without tracing.

The hook uses the returned no-hook flag to decide whether to attach or retract. Projectiles and lasers use the same query for wall hits; character hits are checked separately.

## Box Queries

### testBox(position, size)

`position` is the box center. `size` is its full width and height. The routine checks four corners:

```c
function testBox(position, size):
    half = size / 2
    return checkPoint(position + (-half.x, -half.y))
        or checkPoint(position + ( half.x, -half.y))
        or checkPoint(position + (-half.x,  half.y))
        or checkPoint(position + ( half.x,  half.y))
```

Only the four corners are tested. A large box can contain a solid tile without any corner touching it, so this routine is intended for small physics boxes.

## Movement

The following routines return updated position and velocity values.

### movePoint(position, velocity, elasticity)

This routine checks the destination and reflects blocked velocity components:

```c
function movePoint(position, velocity, elasticity):
    bounces = 0

    if not checkPoint(position + velocity):
        return (position + velocity, velocity, bounces)

    affected = 0
    if checkPoint(position + (velocity.x, 0)):
        velocity.x = velocity.x * -elasticity
        bounces = bounces + 1
        affected = affected + 1

    if checkPoint(position + (0, velocity.y)):
        velocity.y = velocity.y * -elasticity
        bounces = bounces + 1
        affected = affected + 1

    if affected == 0:
        velocity = velocity * -elasticity

    return (position, velocity, bounces)
```

On collision, the position stays unchanged. The bounce counter increments for each individually blocked axis. The combined corner case reflects both axes without incrementing the counter.

This routine tests the destination, not the full path. A fast point can pass through a wall if its destination is clear. Laser logic first traces the wall with `intersectLine()`, then uses `movePoint()` near the hit to calculate reflection.

### moveBox(position, velocity, size, elasticity)

Divide movement into `truncate(length(velocity)) + 1` steps. Each step checks the box and resolves blocked axes separately:

```c
function moveBox(position, velocity, size, elasticity):
    distance = length(velocity)
    if distance <= 0.00001:
        return (position, velocity)

    steps = truncate(distance) + 1
    fraction = 1 / steps

    repeat steps times:
        next = position + velocity * fraction

        if testBox(next, size):
            hits = 0

            if testBox((position.x, next.y), size):
                next.y = position.y
                velocity.y = velocity.y * -elasticity
                hits = hits + 1

            if testBox((next.x, position.y), size):
                next.x = position.x
                velocity.x = velocity.x * -elasticity
                hits = hits + 1

            if hits == 0:
                next = position
                velocity = velocity * -elasticity

        position = next

    return (position, velocity)
```

An elasticity of `0` removes blocked velocity components. An elasticity of `1` reflects them without reducing their magnitude. The reference game uses a 28 by 28 box for characters and a 14 by 14 box with elasticity `0.5` for dropped flags.

## What Collision Does Not Handle

These routines do not implement character-versus-character collision, damage, pickup collection, or hook interaction with players. Those are separate game rules.

Death tiles and out-of-map limits also require separate checks. See [Game Layer](./game-layer.md#death-tiles).
