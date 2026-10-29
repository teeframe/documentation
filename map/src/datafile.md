# Datafile

Every `.map` file is a binary datafile. Its header and offset tables locate the items and data blocks that make up the map.

All integers in the structures below occupy **4 bytes** and use signed little-endian encoding. See [Encoding](./encoding.md#integers) for decoding examples.

## File Structure

The sections appear in this order:

| Section | Size in bytes |
| --- | ---: |
| Version header | 8 |
| Header | 28 |
| Item types | `num_item_types * 12` |
| Item offsets | `num_items * 4` |
| Data offsets | `num_data * 4` |
| Uncompressed data sizes | `num_data * 4`, version 4 only |
| Items | `item_size` |
| Data blocks | `data_size` |

## Version Header

| Byte offset | Field | Description |
| --- | --- | --- |
| 0 | magic | 4 ASCII bytes: `DATA`. Readers also accept `ATAD`. |
| 4 | version | Datafile version: `3` or `4`. |

Both signatures use little-endian integers.

## Header

| Byte offset | Field | Description |
| --- | --- | --- |
| 8 | size | Complete file size minus 16 bytes. |
| 12 | swaplen | Number of bytes from offset 16 to the start of the data blocks. |
| 16 | num_item_types | Number of entries in the item type table. |
| 20 | num_items | Total number of items. |
| 24 | num_data | Number of data blocks. |
| 28 | item_size | Total size of the items section, including item headers. |
| 32 | data_size | Total size of the data section as stored in the file. |

`swaplen` marks the region whose integers need byte-order conversion on a big-endian machine. It ends where raw data blocks begin. Data blocks that contain integers, such as quads, are decoded separately according to their own layout.

## Item Types

Each entry occupies 12 bytes:

| Field | Description |
| --- | --- |
| type_id | Item type identifier, fitting in 16 unsigned bits. |
| start | Global item index of the first item of this type. |
| num | Number of consecutive items of this type. |

All items of a type are stored together. If an entry has `start = 14` and `num = 7`, global item indices 14 through 20 belong to that type.

The map-specific type IDs are listed on [Map Items](./map-items.md).

## Offset Tables

The item offset table has one integer per item. Each offset is relative to the beginning of the **items section**, not the beginning of the file.

The data offset table has one integer per data block. Each offset is relative to the beginning of the **data section**.

Version 4 has a third table containing the uncompressed size of each data block. Version 3 has no such table.

```c
items_start = 36
            + num_item_types * 12
            + num_items * 4
            + num_data * 4
            + (version == 4 ? num_data * 4 : 0)

data_start = items_start + item_size
item_position = items_start + item_offsets[item_index]
```

For data block `i`:

```c
start = data_offsets[i]
end = i + 1 < num_data ? data_offsets[i + 1] : data_size
stored_length = end - start
file_position = data_start + start
```

The final block uses `data_size` because there is no extra sentinel offset.

## Items

Each item has an 8-byte header followed by its payload:

| Relative byte offset | Field | Description |
| --- | --- | --- |
| 0 | type_id_and_id | Upper 16 bits are the type ID; lower 16 bits are the item ID. |
| 4 | size | Payload size in bytes, excluding this 8-byte header. |
| 8 | item_data | Type-specific payload. Its size must be divisible by 4. |

```c
type_id = (type_id_and_id >> 16) & 0xFFFF
id = type_id_and_id & 0xFFFF
```

An **item ID** identifies an item within its type. A **global item index** locates it in the items section. A **data block index** locates raw data. These are different identifiers and should not be used interchangeably.

### Reference Example

In the example `dm1.map`, the layer type entry has `start = 21` and `num = 14`. Layer index 10 is therefore global item index `21 + 10 = 31`. Its item header has `type_id = 5` and `id = 10`.

That layer's `data` field is `17`, which selects raw data block 17:

```c
global_item_index = layer_type.start + layer_index // 21 + 10 = 31
item_position = items_start + item_offsets[global_item_index]

// Read the layer payload at item_position + 8.
data_index = layer.data // 17
block_position = data_start + data_offsets[data_index]
```

The item offset locates the layer metadata; the data offset locates its tile grid.

## Data Blocks

### Version 3

Blocks are stored uncompressed. Extract the byte range specified by the data offset table.

### Version 4

Each block is compressed independently using zlib. The offsets refer to the compressed bytes. To read a block:

1. Calculate its stored byte range.
2. Extract exactly that range.
3. Decompress it with a zlib decoder.
4. Check that the result matches its uncompressed size entry.

Each data block is a separate zlib stream. Use a decoder that accepts the zlib wrapper; raw DEFLATE and gzip decoders expect different formats. The header, items, and index tables are stored uncompressed, so decompress each data block individually rather than the whole file.

## Example: dm1.map

The example `dm1.map` has these header values:

| Field | Value |
| --- | ---: |
| version | 4 |
| size | 5789 |
| swaplen | 2416 |
| num_item_types | 6 |
| num_items | 36 |
| num_data | 21 |
| item_size | 2012 |
| data_size | 3373 |

Its file length is 5805 bytes. The section positions are calculated as follows:

```c
items_start = 36 + 6 * 12 + 36 * 4 + 21 * 4 + 21 * 4 // 420
data_start = items_start + 2012                       // 2432
```

The last `21 * 4` term is the uncompressed-size table for datafile version 4.

The first item is the map version item:

```text
00 00 00 00 // type_id = 0, id = 0
04 00 00 00 // item payload size = 4
01 00 00 00 // map version = 1
```

Data block 0 occupies 18 compressed bytes and expands to the 10-byte string `bg_cloud1\0`.

## Reader Checks

A reader should reject negative counts and sizes, truncated sections, out-of-range references, overlapping or invalid byte ranges, and failed decompression. Check dimensions and decompressed sizes before allocating memory for a tile grid or image.

See [Loading a Map](./loading-map.md#validation-checklist) for a validation checklist covering the container and its map contents.
