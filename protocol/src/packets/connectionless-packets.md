# Connectionless Packets

This page describes the connectionless packet structure and the server information exchange used by TeeFrame. These packets are used to query servers in the server browser and to **retrieve server information while already in-game.**

## Structure

Connectionless packets have a six-byte header followed by a message identifier and its data:

```sh
byte[0-5]   // packet header
byte[6-9]   // FF FF FF FF
byte[10-13] // message identifier: four ASCII bytes, without a null terminator
byte[14-...] // message data
```

Unlike [Control Messages](./control-messages.md) and [Default Packets](./default-packets.md), these packets do not carry an ACK or chunks. Their payload is never compressed, and they do not use vital-chunk sequence numbers or re-sending.

:::info
The six-byte header has its own structure. **Do not interpret it as the flags, ACK, and chunk count of a default packet.** The request and response headers are described below.
:::

## Encoding

Server information responses use the following field types:

| Type | Encoding |
| ---- | -------- |
| **String** | UTF-8 bytes followed by a null terminator (`00`), without a length prefix. |
| **Decimal String** | The number written as decimal ASCII text, followed by a null terminator (`00`). |

For example, the number `64` is sent as:

```sh
36 34 00 // "64" followed by a null terminator
```

**Numbers in these responses do not use [Integer Packing](../encoding.md#integer-packing).** This includes the token, counts, scores, and boolean values. The request is different: its token fields contain raw bytes, as described below.

## Messages

| Identifier | Name | Sending Path |
| ---------- | ---- | ------------ |
| `gie3` | [Server Information Request](#gie3-server-information-request) | Client -> Server |
| `iext` | [Server Information](#iext-server-information) | Server -> Client |
| `iex+` | [More Server Information](#iex-more-server-information) | Server -> Client |

### gie3 - Server Information Request

The client sends this packet to request the server's name, version, map, game type, capacity, and client list.

- **Sending Path** : Client -> Server

Structure:

```sh
byte[0-1]   // 78 65: ASCII "xe"
byte[2-3]   // extra token: unsigned 16-bit, big-endian
byte[4-5]   // reserved: 00 00
byte[6-9]   // FF FF FF FF
byte[10-13] // 67 69 65 33: ASCII "gie3"
byte[14]    // token: unsigned 8-bit
```

The complete request is **15 bytes**. The `xe` marker identifies an extended connectionless request. Reserved bytes must be sent as zero and ignored by the receiver.

The client chooses both token values. The server combines them into a single response token:

```c
extra_token = (byte[2] << 8) | byte[3]
response_token = (extra_token << 8) | byte[14]
```

For example:

```sh
78 65 12 34 00 00 FF FF FF FF 67 69 65 33 2A
      -----                            --
      extra token: 0x1234               token: 0x2A
```

The combined response token is `0x12342A`, which is sent as the decimal string `"1193002\0"` in the response. The client uses it to match replies to its request. **This token is not an ACK or a connection authentication token.**

### iext - Server Information

The server sends this packet with its information and as many complete client records as fit in the packet.

- **Sending Path** : Server -> Client

The response header and identifier are:

```sh
byte[0-5]   // FF FF FF FF FF FF
byte[6-9]   // FF FF FF FF
byte[10-13] // 69 65 78 74: ASCII "iext"
byte[14-...] // fields below, in order
```

Structure:

| Field | Type | Description |
| ----- | ---- | ----------- |
| Token | **Decimal String** | The combined token from the request. |
| Version | **String** | The server version. It must begin with `0.6` for protocol compatibility. This is not the network-version hash sent in `NETMSG_INFO`. |
| Name | **String** | The server name, up to 256 bytes before the null terminator. |
| Map | **String** | The map name, up to 32 bytes before the null terminator. |
| Map CRC | **Decimal String** | The map CRC announced in `NETMSG_MAP_CHANGE`. |
| Map Size | **Decimal String** | The complete map file size in bytes. |
| Game Type | **String** | The game type, such as `DM`, `TDM`, or `CTF`, up to 16 bytes before the null terminator. |
| Flags | **Decimal String** | Server flags. Flag value `1` means a password is required; `0` means no password is required. These are not packet flags. |
| Num Players | **Decimal String** | The number of non-spectator clients. |
| Max Players | **Decimal String** | The maximum number of non-spectator clients. Reserved spectator slots reduce this value. |
| Num Clients | **Decimal String** | The total number of clients, including spectators and clients still connecting. |
| Max Clients | **Decimal String** | The server's configured connection capacity. |
| Reserved | **String** | Must be empty. Receivers must ignore its contents. |
| Clients | **Client Records** | Zero or more complete records, using the structure below. |

**This format does not impose a 16-client limit.** Num Clients describes the complete list, not just the records contained in this first packet. If the list does not fit, the remaining records are sent in `iex+` packets.

### iex+ - More Server Information

This packet carries client records that did not fit in the initial `iext` packet. It does not repeat the server's name, map, or capacity.

- **Sending Path** : Server -> Client

The response header and identifier are:

```sh
byte[0-5]   // FF FF FF FF FF FF
byte[6-9]   // FF FF FF FF
byte[10-13] // 69 65 78 2B: ASCII "iex+"
byte[14-...] // fields below, in order
```

Structure:

| Field | Type | Description |
| ----- | ---- | ----------- |
| Token | **Decimal String** | The same combined token as the initial response. |
| Packet Number | **Decimal String** | A number from `1` to `63`, increasing for each additional packet. The initial `iext` packet has an implicit packet number of `0`. |
| Reserved | **String** | Must be empty. Receivers must ignore its contents. |
| Clients | **Client Records** | The next complete client records. |

## Client Records

Each client is described by the following fields, in order:

| Field | Type | Description |
| ----- | ---- | ----------- |
| Name | **String** | The client's name, up to 16 bytes before the null terminator. TeeFrame sends `"(connecting)"` until the client enters the game. |
| Clan | **String** | The client's clan, up to 12 bytes before the null terminator. Empty while connecting. |
| Country | **Decimal String** | The country code supplied by the client. |
| Score | **Decimal String** | The client's score. May be negative. |
| Is Player | **Decimal String** | `1` for a non-spectator client; `0` for a spectator. |
| Reserved | **String** | Must be empty. Receivers must ignore its contents. |

The reserved string is part of **every** client record. Even when empty, it occupies one null byte and must not be omitted.

## Receiving Multiple Packets

The [1400-byte packet size limit](../fundamentals.md#size-limits) includes the six-byte header, the message identifier and padding, and all encoded fields. **A client record must never be split across packets.**

UDP packets may arrive out of order, be duplicated, or be lost. When collecting a response:

1. Group packets by the server's address, port, and response token.
2. Treat `iext` as packet `0`, and use the Packet Number field for `iex+` packets.
3. Ignore duplicate packet numbers, so their client records are not counted twice.
4. Read complete client records until the end of each packet.
5. The list is complete when the number of collected records equals **Num Clients**, including spectators, from `iext`.

If a reply is incomplete, the client can send a new request with a new token. Connectionless packets do not participate in the connection's ACK or vital-chunk re-sending mechanism.
