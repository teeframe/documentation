# Map Items

Map items describe metadata, images, animations, groups, and layers. The tables below list payload fields in file order; each integer occupies 4 bytes. See [Encoding](./encoding.md) for integer and string formats.

## Item Types

| Type ID | Name | Contents |
| --- | --- | --- |
| 0 | [Version](#version-item-type-id-0) | Map format version. |
| 1 | [Info](#info-item-type-id-1) | Author and other metadata. |
| 2 | [Images](#image-item-type-id-2) | Embedded or external images. |
| 3 | [Envelopes](./envelopes.md#envelope-item-type-id-3) | Animation definitions. |
| 4 | [Groups](#group-item-type-id-4) | Layer ranges and view settings. |
| 5 | [Layers](./layers.md) | Tilemap and quad layer definitions. |
| 6 | [Envelope Points](./envelopes.md#envelope-points-type-id-6) | Points shared by all envelopes. |

A type table entry is present only when that type has items. Older maps can omit the Info item, including the `dm1.map` and `ctf1.map` used in the examples.

## Field Types

- **Integer**: one signed 32-bit integer.
- **Data index**: one integer pointing to a raw data block.
- **Item index**: one integer pointing to an item within a particular type, such as an image or envelope. Index 0 selects that type's first item.
- **I32String**: a string stored directly in several integers. See [I32String Encoding](./encoding.md#i32string-encoding).

An optional index uses `-1` for an unused reference. An index of `0` is valid and selects the first entry.

Strings in data blocks are null-terminated UTF-8 strings. The null byte is included in the byte limits below.

## Version Item (type_id = 0)

The map version item has ID 0 and a 4-byte payload.

| Field | Type | Description |
| --- | --- | --- |
| version | Integer | `1` for the map format described here. |

This is the **map version**, not the datafile version or a layer item version.

## Info Item (type_id = 1)

The Info item has ID 0 and a 20-byte payload. It is optional in older maps.

| Field | Type | Description |
| --- | --- | --- |
| version | Integer | Info item version: `1`. |
| author | Data index | Author string, up to 32 bytes. |
| map_version | Data index | Map revision string, up to 16 bytes. |
| credits | Data index | Credits string, up to 128 bytes. |
| license | Data index | License string, up to 32 bytes. |

All four string references may be `-1`. The strings are not stored inline in the item. For example, `author = 2` means that the author string is in data block 2. The byte limits are the capacities used by the 0.6 editor.

```c
function resolveMetadataString(dataIndex):
    if dataIndex == -1:
        return ""
    return readString(dataBlocks[dataIndex])
```

## Image Item (type_id = 2)

The payload is 24 bytes for version 1 and 28 bytes for version 2.

| Field | Type | Description |
| --- | --- | --- |
| version | Integer | Image item version: `1` or `2`. |
| width | Integer | Width in pixels. |
| height | Integer | Height in pixels. |
| external | Integer | `0` for embedded; `1` for external. |
| image_name | Data index | Image name without the `.png` extension, up to 128 bytes. |
| image_data | Data index | Raw pixel data; `-1` for an external image. |
| format | Integer | Version 2 only: `0` = RGB, `1` = RGBA. |

Version 1 embedded images always use RGBA. Embedded pixels are stored in row-major order, without a PNG header:

```text
RGB:  width * height * 3 bytes
RGBA: width * height * 4 bytes
```

When `external = 1`, the client loads `mapres/<image_name>.png`. When `external = 0`, it reads the pixels from the `image_data` block.

For example, `dm1.map` references `bg_cloud1`, `bg_cloud2`, `bg_cloud3`, `grass_doodads`, `grass_main`, `mountains`, and `sun` as external images. A custom external image will only work for clients that already have it. Embed custom images when distributing a map.

## Group Item (type_id = 4)

Groups contain consecutive layers and define how they appear relative to the camera.

| Field | Type | Description |
| --- | --- | --- |
| version | Integer | Group item version: `1`, `2`, or `3`. |
| offset_x | Integer | Horizontal view offset in world units. |
| offset_y | Integer | Vertical view offset in world units. |
| parallax_x | Integer | Horizontal camera factor, in percent. |
| parallax_y | Integer | Vertical camera factor, in percent. |
| start_layer | Integer | Index of the first layer within the layer item type. |
| num_layers | Integer | Number of layers in this group. |
| use_clipping | Integer | Version 2+: whether clipping is enabled. |
| clip_x | Integer | Version 2+: clipping rectangle X in game-world coordinates. |
| clip_y | Integer | Version 2+: clipping rectangle Y. |
| clip_w | Integer | Version 2+: clipping width. |
| clip_h | Integer | Version 2+: clipping height. |
| name | I32String | Version 3+: 3 integers, capacity 11 UTF-8 bytes plus a terminator. |

Payload sizes are 28, 48, and 60 bytes for versions 1, 2, and 3 respectively.

A parallax factor of 100 follows the camera normally. A factor of 0 produces a camera-independent view; smaller factors are commonly used for distant backgrounds. With a factor of 25, moving the camera 100 world units changes that group's view center by 25 units.

A group's layers occupy indices `start_layer` through `start_layer + num_layers - 1` in the layer list. For example, `start_layer = 8` and `num_layers = 6` selects layers 8 through 13.

Clipping limits drawing to the group's rectangle. It affects rendering, not collision.

### The Game Group

The group containing the flagged [Game layer](./game-layer.md) is the Game group. Identify it by its layer, not by a name comparison. Older groups have no name field.

Its expected view settings are offsets of 0, parallax factors of 100, and clipping disabled. The 0.6 reference loader normalizes these settings when it finds the Game layer.

A Game group can also contain visual layers. In `dm1.map`, group 6 contains layers 8 through 13, but only layer 10 is the Game layer.
