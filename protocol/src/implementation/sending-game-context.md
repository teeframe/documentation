# Sending Game Context

This page describes the messages exchanged after the client has loaded the map and received NETMSG_CON_READY, completing the [Initial Handshake](./initial-handshake.md).

## Preparing the Player

1. The client sends [NETMSGTYPE_CL_STARTINFO](./../chunks/game-messages.md#_20-netmsgtype-cl-startinfo), containing the player's name, clan, country, skin, and colors.
2. The server applies this information and sends [NETMSGTYPE_SV_VOTECLEAROPTIONS](./../chunks/game-messages.md#_11-netmsgtype-sv-voteclearoptions), followed by the available vote options through [NETMSGTYPE_SV_VOTEOPTIONLISTADD](./../chunks/game-messages.md#_12-netmsgtype-sv-voteoptionlistadd).
3. The server sends [NETMSGTYPE_SV_TUNEPARAMS](./../chunks/game-messages.md#_6-netmsgtype-sv-tuneparams).
4. The server marks the player as ready and sends [NETMSGTYPE_SV_READYTOENTER](./../chunks/game-messages.md#_8-netmsgtype-sv-readytoenter).
5. The client responds with [NETMSG_ENTERGAME](./../chunks/system-messages.md#_15-netmsg-entergame). The server adds the player to the game and starts sending snapshots.

**The server must process CL_STARTINFO before accepting ENTERGAME.** Ignore repeated CL_STARTINFO after initialization, even if it has a different vital sequence number.

:::info
Readiness is tracked by the server. SV_READYTOENTER and ENTERGAME both have empty payloads; no extra readiness field is sent.
:::

## Changing Maps

When the server sends NETMSG_MAP_CHANGE on an existing connection, reset the player's readiness and repeat the map-loading and game-context steps. The client must send its start information again before entering the new game.

**The connection stays established.** Do not reset the connection ACKs or vital chunk sequence numbers when restarting the map handshake.
