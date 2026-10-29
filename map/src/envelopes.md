# Envelopes

Envelopes animate quad positions and layer colors. Each point gives values at a time in milliseconds, and the curve determines how those values change until the next point. The client evaluates the animation at the current time.

## Envelope Item (type_id = 3)

The 0.6 editor creates position envelopes with 3 channels and color envelopes with 4 channels.

| Field | Type | Description |
| --- | --- | --- |
| version | Integer | Envelope item version: `1` or `2`. |
| channels | Integer | Number of active values per point: `3` for position, `4` for color. |
| start_point | Integer | First point index in the Envelope Points item. |
| num_points | Integer | Number of points belonging to this envelope. |
| name | I32String | 8 integers, capacity 31 UTF-8 bytes plus a terminator. |
| synchronized | Integer | Version 2 only: `1` for game-time synchronization; `0` for local client time. |

The named version 1 layout occupies 48 bytes; version 2 occupies 52 bytes. Older version 1 layouts may lack a usable name, so readers must consider the payload size as well as the version.

For live play, synchronized envelopes follow the game's round time. The 0.6 client also treats version 1 envelopes as synchronized. These animations do not change collision tiles.

## Envelope Points (type_id = 6)

This item has ID 0 and contains the points for all envelopes. There is no leading version or count field. Each point occupies **24 bytes**, or 6 integers.

| Field | Type | Description |
| --- | --- | --- |
| time | Integer | Time in milliseconds. |
| curve_type | Integer | Interpolation from this point to the next. |
| values | Integer[4] | Four signed 22.10 fixed-point values. |

```c
point_count = item_payload_size / 24
points_for_envelope = slice(points, start_point, num_points)
```

Times should increase within each envelope's range. Point indices refer to this shared array.

For example, an envelope with `start_point = 0` and `num_points = 2` uses points 0 and 1. A second envelope with `start_point = 2` and `num_points = 3` uses points 2, 3, and 4. Here, `slice(array, start, count)` selects that many entries from the starting index.

## Point Values

Divide stored values by **1024** to recover their numeric values:

| Envelope | values[0] | values[1] | values[2] | values[3] |
| --- | --- | --- | --- | --- |
| Position | X offset | Y offset | Rotation in degrees | Unused |
| Color | Red multiplier | Green multiplier | Blue multiplier | Alpha multiplier |

Color envelope values are multipliers, normally from 0 to 1 after conversion. Stored alpha `512` means `0.5`; `1024` means `1.0`. Tile tint and quad corner colors use ordinary integer components from 0 to 255 instead.

Position envelopes add their X and Y offsets to a quad's coordinates and rotate its corners around the pivot. Color envelopes multiply the layer tint or quad corner colors.

## Curve Types

For interpolation progress `a` from 0 to 1, the client uses:

| Value | Name | Adjusted progress |
| --- | --- | --- |
| 0 | Step | `0` until the next point. |
| 1 | Linear | `a` |
| 2 | Slow | `a * a * a` |
| 3 | Fast | `1 - (1 - a)^3` |
| 4 | Smooth | `3 * a^2 - 2 * a^3` |

Progress `a` is 0 at the first point and 1 at the second. The curve adjusts that progress before interpolating the values. The curve type belongs to the first point of the segment.

In the pseudocode below, `applyCurve(curve_type, a)` uses the formula from this table.

:::info
You can see how the client evaluates these curves in [RenderEvalEnvelope](https://github.com/teeworlds/teeworlds/blob/0.6/src/game/client/render_map.cpp).
:::

## Evaluating an Envelope

An envelope with no points produces zero values. With one point, it produces that point's decoded values. Multi-point envelopes loop using the last point's time as their period.

```c
function evaluateEnvelope(points, time_ms, channels):
    if points is empty:
        return [0, 0, 0, 0]

    if count(points) == 1:
        return points[0].values / 1024

    period = points[last].time
    if period <= 0:
        reject "invalid envelope duration"
    time_ms = time_ms modulo period

    for i from 0 to count(points) - 2:
        first = points[i]
        second = points[i + 1]

        if first.time <= time_ms and time_ms <= second.time:
            duration = second.time - first.time
            if duration <= 0:
                reject "invalid envelope segment"
            a = (time_ms - first.time) / duration
            a = applyCurve(first.curve_type, a)
            result = [0, 0, 0, 0]

            for channel from 0 to channels - 1:
                start = first.values[channel] / 1024
                end = second.values[channel] / 1024
                result[channel] = start + (end - start) * a

            return result

    return points[last].values / 1024
```

Envelope offsets in tilemap and quad items are in milliseconds. Add the offset to the chosen animation time before evaluating the envelope.

### Example

A linear position envelope with these two points moves a quad 32 world units to the right over one second:

```c
point 0: time = 0,    values = [0, 0, 0, 0]
point 1: time = 1000, values = [32768, 0, 0, 0]
```

At 500 milliseconds, progress is `500 / 1000 = 0.5`. The stored X value is `32768 * 0.5 = 16384`, which decodes to `16` world units. At 1000 milliseconds, the animation loops back to the start.

### Color Example

A constant color envelope can use one point:

```c
values = [1024, 1024, 1024, 512] // Multipliers: [1, 1, 1, 0.5]
```

Applied to an opaque white quad corner `[255, 255, 255, 255]`, RGB stays unchanged and alpha is multiplied by `0.5`. This makes the quad half-transparent without changing its position or collision.
