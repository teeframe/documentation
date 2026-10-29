# Encoding

Map files use fixed-width integers, null-terminated strings, and fixed-point numbers. The sections below explain how to read and write each format.

## Integers

Integers in headers, index tables, and item payloads are **little-endian signed 32-bit values**. Each occupies exactly 4 bytes. They do not use the network protocol's variable-length integer packing.

```text
01 00 00 00 // 1
00 01 00 00 // 256
FF FF FF FF // -1
00 FF FF FF // -256
```

The least significant byte comes first. A language-independent decoder can assemble an unsigned value, then convert it to signed:

```c
function readInteger(bytes):
    value = bytes[0]
          | (bytes[1] << 8)
          | (bytes[2] << 16)
          | (bytes[3] << 24)

    if value > 0x7FFFFFFF:
        value = value - 0x100000000

    return value
```

This pseudocode assumes an intermediate value wide enough to hold all 32 unsigned bits. Languages with a signed little-endian 32-bit reader can use that directly.

Negative values matter for coordinates and optional references. An optional image, envelope, or data block index uses `-1` for an unused field.

## Strings in Data Blocks

Strings stored in data blocks are UTF-8 bytes followed by a null byte. There is no separate string-length prefix:

```text
48 65 6C 6C 6F 00 // "Hello"
```

```c
function readString(block):
    end = findFirstNullByte(block)
    if end does not exist:
        reject "unterminated string"
    return bytesBefore(block, end)
```

`bytesBefore(block, end)` selects the bytes before the terminator, excluding the null byte itself.

String limits on the [Map Items](./map-items.md) page include the null terminator. They count bytes, not Unicode characters.

## I32String Encoding

Group, layer, and envelope names are stored directly in consecutive integers rather than separate data blocks. This encoding is called **I32String**.

Each integer holds four UTF-8 bytes. The encoder adds 128 to each byte with wrapping, then places the first character in the integer's most significant byte. The integer is still written little-endian in the file.

For example, `Game` becomes:

```text
characters:           G  a  m  e
UTF-8 bytes:         47 61 6D 65
encoded bytes:       C7 E1 ED E5
integer:             0xC7E1EDE5
bytes in the file:   E5 ED E1 C7
```

### Decoding

1. Read the field's integers in little-endian order.
2. Extract each integer's bytes from most significant to least significant.
3. Subtract 128 from each byte, wrapping to 0 through 255.
4. Set the final decoded byte to zero.
5. Read up to the first decoded null byte.

```c
function decodeI32String(integers):
    bytes = []

    for integer in integers:
        for shift in [24, 16, 8, 0]:
            encoded = (integer >> shift) & 0xFF
            bytes.append((encoded - 128) & 0xFF)

    if bytes is empty:
        return ""

    bytes[last] = 0
    return readString(bytes)
```

The final byte is stored as an unencoded zero. Set it to zero after decoding, then locate the string terminator. Encoded zero bytes elsewhere represent UTF-8 bytes with value 128.

:::info
You can find the reference encoder and decoder in the [StrToInts and IntsToStr functions](https://github.com/teeworlds/teeworlds/blob/0.6/src/game/gamecore.h).
:::

### Encoding

A field of `n` integers has room for `4 * n - 1` string bytes plus its terminator. Pad the remaining character bytes with zeroes before adding 128.

```c
function encodeI32String(textBytes, count):
    capacity = count * 4
    characters = truncateAndPadWithZeroes(textBytes, capacity)
    integers = []

    for offset from 0 to capacity - 1 step 4:
        value = 0
        for i from 0 to 3:
            encoded = (characters[offset + i] + 128) & 0xFF
            value = value | (encoded << (24 - i * 8))
        integers.append(value)

    integers[last] = integers[last] & 0xFFFFFF00
    return writeLittleEndianIntegers(integers)
```

Avoid cutting a UTF-8 character in half when truncating names.

## Fixed-Point Values

Quad positions, quad texture coordinates, and envelope values use signed **22.10 fixed-point** encoding. The fractional part has 10 bits:

```c
decoded_value = stored_integer / 1024
stored_integer = truncate(decoded_value * 1024)
```

| Stored integer | Decoded value |
| --- | ---: |
| 512 | 0.5 |
| 1024 | 1 |
| 32768 | 32 |
| -1024 | -1 |

Color envelope values use this encoding as multipliers, normally 0 to 1 after decoding. Tile tint and quad corner colors are different: their components are ordinary integers from 0 to 255.
