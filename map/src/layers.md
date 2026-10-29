# Layers

Layers are map items with `type_id = 5`. There are two layer types: **tilemaps**, which contain grids, and **quads**, which contain four-corner visual shapes. The layer item points to a data block containing those tiles or quads.

## Common Header

Every layer item begins with these three integers:

| Field | Type | Description |
| --- | --- | --- |
| _version | Integer | Unused base-layer version. Do not use it to select the payload layout. |
| type | Integer | `2` = Tilemap, `3` = Quads. |
| flags | Integer | Common layer flags. |

The only common layer flag described here is `LAYERFLAG_DETAIL = 1`. It marks a visual layer that can be skipped when high detail is disabled. The Game layer remains active regardless of this flag.

:::info
The common `flags` field and the tilemap's own `flags` field are separate. The Game flag belongs to the tilemap field.
:::

## Tilemap Layer

After the common header, the fields are:

| Field | Type | Description |
| --- | --- | --- |
| version | Integer | Tilemap item version; the 0.6 editor writes `3`. Older maps commonly use `2`. |
| width | Integer | Grid width in tiles. |
| height | Integer | Grid height in tiles. |
| flags | Integer | `1` = `TILESLAYERFLAG_GAME`; `0` = visual tilemap. |
| color_r | Integer | Red tint, 0 to 255. |
| color_g | Integer | Green tint, 0 to 255. |
| color_b | Integer | Blue tint, 0 to 255. |
| color_a | Integer | Alpha tint, 0 to 255. |
| color_env | Item index | Color envelope index, or `-1`. |
| color_env_offset | Integer | Envelope time offset in milliseconds. |
| image | Item index | Image index, or `-1`. |
| data | Data index | Tile grid data block. |
| name | I32String | Version 3+: 3 integers. |

Including the common header, the version 2 layout occupies 60 bytes and version 3 occupies 72 bytes.

A normal 0.6 tile grid contains `width * height` records, each 4 bytes long. Its uncompressed size is:

```c
width * height * 4
```

Tiles are stored in **row-major order**, from left to right and then top to bottom:

```c
record_index = tile_y * width + tile_x
byte_offset = record_index * 4
```

For a grid with width 3 and height 2:

```text
          x=0 x=1 x=2
y=0        0   1   2
y=1        3   4   5
```

Tile `(2, 1)` is record `1 * 3 + 2 = 5`, starting at byte `5 * 4 = 20` in the uncompressed tile block. These record numbers are grid positions, not the tile indices stored in the records.

### Tile Structure

| Relative byte | Field | Description |
| --- | --- | --- |
| 0 | index | Unsigned tile index. Its meaning depends on the layer. |
| 1 | flags | Texture transformation and opacity flags. |
| 2 | skip | Rendering skip count. It does not remove records from a 0.6 grid. |
| 3 | reserved | Unused. |

For visual layers, the index selects a tile in the layer's image. For the Game layer, it selects a physics tile or entity marker. Do not interpret visual layer indices as collision or entity types.

For example, these four bytes describe a solid Game layer tile:

```text
01 00 00 00
// index = 1, flags = 0, skip = 0, reserved = 0
```

The same index in a visual layer selects image tile 1; it does not create a wall.

### Tile Flags

| Value | Source name | Effect in the 0.6 renderer |
| --- | --- | --- |
| 1 | TILEFLAG_VFLIP | Flips texture coordinates left to right. |
| 2 | TILEFLAG_HFLIP | Flips texture coordinates top to bottom. |
| 4 | TILEFLAG_OPAQUE | Marks a tile as opaque for rendering. |
| 8 | TILEFLAG_ROTATE | Rotates texture coordinates by 90 degrees. |

The renderer applies the left-right flip, then the top-bottom flip, then rotation. Flags can be combined using bitwise OR.

These flags do not rotate or change collision shapes. Game layer collision is determined by the tile index.

### The Skip Byte

The client generates skip counts to skip runs of empty tiles during rendering. The grid contains every tile record, located at `4 * (y * width + x)`.

For datafile version 4, decompress the tile data block with zlib before reading the grid.

## Game Layer

The Game layer is a tilemap with `TILESLAYERFLAG_GAME` set. Each tile occupies 32 by 32 world units and identifies a collision tile or an entity marker.

The [Game Layer](./game-layer.md) page lists these indices and explains spawn positions, death tiles, and map clipping.

## Quads Layer

Quads define four-corner visual shapes, such as backgrounds and decorations. They have no effect on server collision.

After the common header, the fields are:

| Field | Type | Description |
| --- | --- | --- |
| version | Integer | Quads item version: `1` or `2`. |
| num_quads | Integer | Number of quads. |
| data | Data index | Quad data block. |
| image | Item index | Image index, or `-1` for untextured quads. |
| name | I32String | Version 2+: 3 integers. |

Including the common header, version 1 occupies 28 bytes and version 2 occupies 40 bytes. The data block contains `num_quads * 152` uncompressed bytes.

### Quad Structure

Each quad contains 38 little-endian integers, totaling 152 bytes:

| Field | Integer count | Description |
| --- | ---: | --- |
| positions | 10 | Five `(x, y)` points: four corners followed by the pivot. |
| corner_colors | 16 | Four `(r, g, b, a)` colors; each component is 0 to 255. |
| texture_coords | 8 | Four `(u, v)` texture coordinate pairs. |
| pos_env | 1 | Position envelope index, or `-1`. |
| pos_env_offset | 1 | Position envelope offset in milliseconds. |
| color_env | 1 | Color envelope index, or `-1`. |
| color_env_offset | 1 | Color envelope offset in milliseconds. |

The corner order is top-left, top-right, bottom-left, bottom-right. The fifth point is the rotation pivot, not another corner.

Positions and texture coordinates use signed **22.10 fixed-point** encoding:

```c
world_position = stored_position / 1024
texture_coordinate = stored_texture_coordinate / 1024
```

For example, stored position `32768` represents world position `32`. A texture coordinate of `1024` represents `1.0`. Texture coordinates may extend beyond the usual 0 to 1 range.

A position envelope adds X and Y offsets and rotates the corners around the pivot. A color envelope multiplies each corner's color. These calculations are performed by the client.

## Example: dm1.map

The Game layer in the example `dm1.map` is layer index 10. It belongs to group 6 and has:

| Field | Value |
| --- | ---: |
| tilemap version | 2 |
| width | 60 |
| height | 50 |
| tilemap flags | 1 |
| image | -1 |
| data | 17 |

Its tile block expands from zlib to `60 * 50 * 4 = 12000` bytes. The world spans 1920 by 1600 units. The other layers in that group are visual tilemaps; they are not additional collision layers.
