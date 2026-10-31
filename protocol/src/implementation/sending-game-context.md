# Sending Game Context

This page describes how the client and server exchange player information, vote options, and tuning parameters after the [Initial Handshake](./initial-handshake.md) has loaded the map. These messages must be exchanged before the player enters the game.

## Preparing the Player

1. The client sends [NETMSGTYPE_CL_STARTINFO](./../chunks/game-messages.md#_20-netmsgtype-cl-startinfo), containing the player's name, clan, country, skin, and colors.
2. The server applies this information and sends [NETMSGTYPE_SV_VOTECLEAROPTIONS](./../chunks/game-messages.md#_11-netmsgtype-sv-voteclearoptions), followed by the available vote options through [NETMSGTYPE_SV_VOTEOPTIONLISTADD](./../chunks/game-messages.md#_12-netmsgtype-sv-voteoptionlistadd).
3. The server sends [NETMSGTYPE_SV_TUNEPARAMS](./../chunks/game-messages.md#_6-netmsgtype-sv-tuneparams), containing the movement and weapon settings used by the game.
4. The server records that the player's start information has been processed, then sends [NETMSGTYPE_SV_READYTOENTER](./../chunks/game-messages.md#_8-netmsgtype-sv-readytoenter).
5. The client responds with [NETMSG_ENTERGAME](./../chunks/system-messages.md#_15-netmsg-entergame). The server adds the player to the game and starts sending snapshots.

**The server must process CL_STARTINFO before accepting ENTERGAME.** Ignore repeated CL_STARTINFO after the first one has been processed, even if it has a different vital sequence number.

:::info
The server must keep track of whether it has processed CL_STARTINFO for each client. **This is what makes the player ready to enter the game.** SV_READYTOENTER and ENTERGAME both have empty payloads; this information is not sent as an extra field.
:::

## Changing Maps

When the server sends NETMSG_MAP_CHANGE on an existing connection, repeat the map-loading and game-context steps. **Do not accept ENTERGAME until the server has processed the client's new CL_STARTINFO.**

**The connection stays established.** Do not reset the connection ACKs or vital chunk sequence numbers when restarting the map handshake.
