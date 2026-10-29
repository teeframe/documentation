# Loading a Map

To load a map, read its datafile, decode the group and layer items, locate the Game layer, and read its tiles. The original file is also needed for client downloads.

## Read the Container

Start with the [Datafile](./datafile.md) header and tables. In the pseudocode, `readBytes(file, offset, count)` reads a byte range, and `readIntegerAt(file, offset)` decodes 4 bytes as a signed little-endian integer.

```c
file = readFile(path)
magic = readBytes(file, 0, 4)
version = readIntegerAt(file, 4)

if magic not in ["DATA", "ATAD"] or version not in [3, 4]:
    reject "unsupported datafile"

header = readHeader(file)
types = readItemTypes(file, header.num_item_types)
item_offsets = readItemOffsets(file, header.num_items)
data_offsets = readDataOffsets(file, header.num_data)

if version == 4:
    data_sizes = readUncompressedSizes(file, header.num_data)

items_start = 36 + header.num_item_types * 12
             + header.num_items * 4
             + header.num_data * 4
if version == 4:
    items_start = items_start + header.num_data * 4

data_start = items_start + header.item_size
```

Validate counts, sizes, and byte ranges before using them to read or allocate memory.

## Read Items and Data Blocks

Use each item's offset to locate its header and payload. Decode the upper and lower halves of `type_id_and_id` to identify the item.

```c
items = []
for i from 0 to header.num_items - 1:
    start = items_start + item_offsets[i]
    key = readIntegerAt(file, start)
    size = readIntegerAt(file, start + 4)

    items[i] = {
        type_id: (key >> 16) & 0xFFFF,
        id: key & 0xFFFF,
        data: readBytes(file, start + 8, size)
    }
```

Read data blocks independently. Version 4 offsets refer to compressed bytes, not expanded data:

```c
data_blocks = []
for i from 0 to header.num_data - 1:
    start = data_offsets[i]
    end = header.data_size
    if i + 1 < header.num_data:
        end = data_offsets[i + 1]

    block = readBytes(file, data_start + start, end - start)

    if version == 4:
        block = decompressZlib(block, outputLimit = data_sizes[i])
        if length(block) != data_sizes[i]:
            reject "incorrect uncompressed size"

    data_blocks[i] = block
```

The item type table provides ranges for retrieving items by type:

```c
function itemsOfType(type_id):
    entry = findTypeEntry(types, type_id)
    if entry is none:
        return []
    return slice(items, entry.start, entry.num)
```

`slice(array, start, count)` selects `count` entries starting at `start`. Keep the resulting lists in file order: a layer's image index selects an entry in the image list, while its data index selects a raw data block.

## Find the Game Layer

Decode group items from type 4 and layer items from type 5 using the field tables on [Map Items](./map-items.md#group-item-type-id-4) and [Layers](./layers.md). Each group selects a range in the layer list:

```c
groups = parseGroups(itemsOfType(4))
layers = parseLayers(itemsOfType(5))
game_layer = none

for group in groups:
    for i from group.start_layer to group.start_layer + group.num_layers - 1:
        layer = layers[i]

        if layer.type == 2 and (layer.tilemap_flags & 1) != 0:
            if game_layer is not none:
                reject "multiple Game layers"
            game_layer = layer

if game_layer is none:
    reject "missing Game layer"
```

A map needs one Game layer, identified by its tilemap flag. Here, `tilemap_flags` is the tilemap's own `flags` field, separate from the common layer header's flags.

## Read Tiles and Entity Markers

The Game layer's data block must contain one 4-byte record per tile. `readTile(block, offset)` reads its index, flags, skip, and reserved bytes:

```c
block = data_blocks[game_layer.data]
tiles = []
expected_size = game_layer.width * game_layer.height * 4

if length(block) != expected_size:
    reject "incorrect tile grid size"

for y from 0 to game_layer.height - 1:
    for x from 0 to game_layer.width - 1:
        offset = 4 * (y * game_layer.width + x)
        tile = readTile(block, offset)
        tiles.append(tile)
```

Every tile record is present in the grid. The `skip` byte is used during rendering.

Scan the [entity markers](./game-layer.md#scanning-entities), then construct the [collision grid](./collision.md#initialization). Visual tiles and quads are read separately for client rendering.

## Keep the Original File

Keep the original file bytes for map downloads and CRC checks.

```c
map_size = length(file)
map_crc = crc32(file)
```

The CRC covers the complete stored file, including its header, items, and compressed data blocks. Recompressing or rebuilding a map can change its CRC even when its tiles remain the same.

For network integer packing, represent the checksum as a signed 32-bit value without changing its bits:

```c
if map_crc > 0x7FFFFFFF:
    map_crc = map_crc - 0x100000000
```

Map downloads transfer slices of the original file. See the [protocol documentation](https://github.com/teeframe/protocol-documentation) for the message structures.

## Validation Checklist

A reader should check:

- Supported magic, datafile version, and map version.
- Nonnegative counts and sizes, with arithmetic overflow checks.
- Header sizes and section boundaries against the actual file length.
- Unique item types and unique `(type_id, id)` pairs.
- Valid type ranges and ordered item/data offsets.
- Complete item headers and payloads, with payload sizes divisible by 4.
- Successful zlib decoding and matching uncompressed block lengths.
- Positive layer dimensions and complete tile or quad records.
- Valid group layer ranges without overlap.
- Valid data, image, envelope, and envelope-point references.
- Exactly one Game layer.
- Valid string termination and lengths.

Apply memory limits to both individual blocks and the complete map. A declared uncompressed size is part of an untrusted file, not permission to allocate that much memory.

## Example: dm1.map

The example `dm1.map` has a file size of 5805 bytes and CRC32 `0xF2159E6E`, represented as `-233464210` when signed.

Its Game layer has these values:

| Field | Value |
| --- | ---: |
| Group index | 6 |
| Layer index | 10 |
| Tilemap version | 2 |
| Width | 60 |
| Height | 50 |
| Tilemap flags | 1 |
| Image | -1 |
| Data block | 17 |

The tile block expands to `60 * 50 * 4 = 12000` bytes. Its world dimensions are 1920 by 1600 units. It contains 32 recognized entity markers.

These values describe this particular file revision; a resaved map can have different file sizes, indices, or CRCs.
