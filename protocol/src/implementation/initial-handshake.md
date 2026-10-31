# Initial Handshake

This page describes how to establish the connection and prepare the client to receive the game context.

## Establishing the Connection

1. The client sends a [CONNECT](./../packets/control-messages.md#_1-connect) control message.
2. The server replies with [CONNECT_ACCEPT](./../packets/control-messages.md#_2-connect-accept).
3. The client sends [NETMSG_INFO](./../chunks/system-messages.md#_1-netmsg-info), containing its network version and the server password, if needed.
4. The server validates the version and password, then sends [NETMSG_MAP_CHANGE](./../chunks/system-messages.md#_2-netmsg-map-change), containing the map name, CRC, and file size. If validation fails, the server sends [CLOSE](./../packets/control-messages.md#_4-close) with the reason.

## Loading the Map

The client loads a local copy matching the announced map and CRC. If no matching copy is available, it requests the file through [NETMSG_REQUEST_MAP_DATA](./../chunks/system-messages.md#_19-netmsg-request-map-data), and the server responds with [NETMSG_MAP_DATA](./../chunks/system-messages.md#_3-netmsg-map-data).

Once the map has been loaded, the client sends [NETMSG_READY](./../chunks/system-messages.md#_14-netmsg-ready). The server replies with [NETMSG_CON_READY](./../chunks/system-messages.md#_4-netmsg-con-ready), telling the client to send its start information.

:::warning
**NETMSG_READY only confirms that the map has been loaded.** The player is not ready to enter the game until the server has processed its start information and sent NETMSGTYPE_SV_READYTOENTER.
:::

The next steps are described on the [Sending Game Context](./sending-game-context.md) page.
