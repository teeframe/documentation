# Chunks Concept

This page describes the concept of chunks, their structure, when they should be sent, and how they are used in the protocol.

## Understanding Chunks

Each chunk has its header with chunk flags, a sequence number, a message ID, and a custom payload structure to follow. There are two types of chunks: **System Messages and Game Messages**. 

Fundamentally, they work in the same way. Theoretically, the System Messages are part of the server engine and do not know anything about the game context.

::: details Quote from heinrich5991 about System vs Game Messages
- **ChillerDragon**: does someone know why there are system and game messages? I do not understand their difference.
- **heinrich5991**: *ChillerDragon*, the system messages are part of the engine and do not really know anything about the game
- **heinrich5991**: both snapshots and inputs are transmitted in a way that makes the engine more or less oblivious of its contents
:::

## Vital & Non-Vital Chunks

Whether a chunk is a game or system message, it can be vital or non-vital. **Vital chunks have a sequence number and must be received by the destination (and in order)**, while non-vital chunks are chunks that do not have a sequence number, and reaching the destination is not crucial.

You can find the chunks listing that are vital or non-vital in the [System Messages](./../chunks/system-messages.md) and [Game Messages](./../chunks/game-messages.md) pages.

:::info
***1.*** The sequence value is the number of vital chunks sent by the source to the destination + chunk position. 

***2.*** The sequence number of the last sent vital chunk should be the peer ACK (the ACK the destination uses to track how much vital chunks it received from you).
:::

## Chunks Queueing

Since multiple chunks can be added in a single packet, the server and the client should queue the chunks to be sent. When the chunk queue reaches the [packet size limit](./../fundamentals.md#size-limits), the queue must be processed. 

**Some chunks must be sent instantly, and when such a chunk is added to the queue, the entire queue must be processed.** You can find the chunks listing that must be sent instantly in the [System Messages](./../chunks/system-messages.md) and [Game Messages](./../chunks/game-messages.md) pages.

:::info
Every default packet has a maximum of 255 chunks regardless of the packet size limit.
:::

## Re-sending Chunks

Some times the internet connection can fail, and some [vital chunks](#vital-non-vital-chunks) may not be received by the destination. When that happens, the destination must send a packet with the [RESEND flag](./../fundamentals.md#packet-flags) and its current ACK number.

The source will need to re-send the vital chunks that the peer has not acknowledged. Keep their original sequence numbers and add the [RESEND chunk flag](./../chunks/chunk-structure.md#chunk-flags). Compare sequence numbers accounting for [rollover](./../fundamentals.md#sequence-number), not just their numerical values.

:::info
The packet RESEND flag requests chunks from the peer. The chunk RESEND flag marks a re-sent chunk. **A retransmission response does not need the packet RESEND flag**, unless it also requests chunks from the peer.
:::

**For this to be done smoothly, you, as the client or server, must store all the vital chunks that you have sent until they are acknowledged.** Remove the stored chunks according to the latest peer ACK and their sequence numbers. Non-vital chunks do not need to be stored for retransmission.

Re-sending a chunk does not allocate another sequence number or another stored copy. The re-sent chunks must still follow the [packet size and chunk count limits](#chunks-queueing), splitting them across packets when needed.

### Resend Buffer

The stored chunks form the **resend buffer**. Bound this buffer for each connection, including vital chunks still queued for sending. A peer that continues sending packets without advancing its ACK must not allow the buffer to grow indefinitely.

*The original 0.6 server* uses a **32 KiB** resend buffer and disconnects the peer if another vital chunk cannot fit. This size is a server policy, **not a limit imposed by the protocol.**

*TeeFrame* also limits pending vital chunks to **511**, including queued chunks. This keeps them below half the 1024-value sequence space used by its backroom comparison. Without this limit, an unchanged ACK could cause newer chunks to be mistaken for old ones and removed before being received.

:::info
You can use a different buffer size or another way to store unacknowledged chunks. Choose a limit that keeps ACKs unambiguous across sequence rollover. Do not discard unacknowledged vital chunks while continuing the connection as if they had been delivered.
:::

## Input & Input Timing Chunks

[Input](./../chunks/system-messages.md#_16-netmsg-input) and [Input Timing](./../chunks/system-messages.md#_9-netmsg-inputtiming) chunks carry player input and keep the client's prediction aligned with the server.

The Input chunk contains the player's input, its prediction tick, and the tick of the latest snapshot successfully reconstructed by the client. **The acknowledged snapshot is used as the delta snap for [snapshot differences](./snaps-concept.md#snap-payload), if the server still has it.**

The server sends Input Timing when the received prediction tick is newer than the previous input's tick. It returns the same intended tick sent by the client and reports the time left until that tick, in milliseconds. Negative values mean the input was late. **This chunk is used to adjust the client's prediction margin.**

The server buffers inputs and applies them at their scheduled game tick. **Receiving an input for a later tick does not invalidate inputs already queued for earlier ticks.** 

*The original 0.6 server* uses a 200-entry ring buffer, a fixed-size buffer that overwrites the oldest input when full, to store inputs. If the requested tick has already been processed, it schedules the input for the next tick instead. The 200-entry ring buffer is a server policy, **not an implementation imposed by the protocol.**

:::info
You can use a different buffer size or another way to store inputs.
:::

Keep the buffer bounded, including for dead players and spectators. Inputs whose scheduled tick has passed must not accumulate indefinitely or be replayed when a character respawns.

:::warning
Input Timing must refer to the **original tick sent by the client**, even when the server reschedules the input. An input for the next tick to be processed must not be delayed by an additional tick.
:::

Below, you can find the explanation of particular values of both chunks that may be difficult to understand or calculate.

### Input particular values

- **Ack Game Tick** : the tick of the latest snapshot successfully reconstructed by the client, or `-1` when no snapshot is acknowledged.
- **Prediction Tick** : the tick of the server that the client is predicting.

### Input Timing particular values

- **Intended Tick** : the prediction tick value sent by the client.
- **Time Left** : signed time remaining until the original intended tick, in milliseconds. Negative values mean the input arrived late.
<br><br>
:::info
To measure latency, use Ack Game Tick to find the acknowledged snapshot's send time and subtract it from the current time. **Time Left is not the player's ping.**
:::
