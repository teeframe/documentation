# Game Messages

This page describes the structure and purpose of Teeworlds 0.6 game messages. Client IDs range from `0` to `15`.

| Message ID    | Name                                |
| ------------- | :---------------------------------: |
| 0             | *Unused* |
| 1             | [NETMSGTYPE_SV_MOTD](#1---netmsgtype_sv_motd) |
| 2             | [NETMSGTYPE_SV_BROADCAST](#2---netmsgtype_sv_broadcast) |
| 3             | [NETMSGTYPE_SV_CHAT](#3---netmsgtype_sv_chat) |
| 4             | [NETMSGTYPE_SV_KILLMSG](#4---netmsgtype_sv_killmsg) |
| 5             | [NETMSGTYPE_SV_SOUNDGLOBAL](#5---netmsgtype_sv_soundglobal) |
| 6             | [NETMSGTYPE_SV_TUNEPARAMS](#6---netmsgtype_sv_tuneparams) |
| 7             | *Unused* |
| 8             | [NETMSGTYPE_SV_READYTOENTER](#8---netmsgtype_sv_readytoenter) |
| 9             | [NETMSGTYPE_SV_WEAPONPICKUP](#9---netmsgtype_sv_weaponpickup) |
| 10            | [NETMSGTYPE_SV_EMOTICON](#10---netmsgtype_sv_emoticon) |
| 11            | [NETMSGTYPE_SV_VOTECLEAROPTIONS](#11---netmsgtype_sv_voteclearoptions) |
| 12            | [NETMSGTYPE_SV_VOTEOPTIONLISTADD](#12---netmsgtype_sv_voteoptionlistadd) |
| 13            | [NETMSGTYPE_SV_VOTEOPTIONADD](#13---netmsgtype_sv_voteoptionadd) |
| 14            | [NETMSGTYPE_SV_VOTEOPTIONREMOVE](#14---netmsgtype_sv_voteoptionremove) |
| 15            | [NETMSGTYPE_SV_VOTESET](#15---netmsgtype_sv_voteset) |
| 16            | [NETMSGTYPE_SV_VOTESTATUS](#16---netmsgtype_sv_votestatus) |
| 17            | [NETMSGTYPE_CL_SAY](#17---netmsgtype_cl_say) |
| 18            | [NETMSGTYPE_CL_SETTEAM](#18---netmsgtype_cl_setteam) |
| 19            | [NETMSGTYPE_CL_SETSPECTATORMODE](#19---netmsgtype_cl_setspectatormode) |
| 20            | [NETMSGTYPE_CL_STARTINFO](#20---netmsgtype_cl_startinfo) |
| 21            | [NETMSGTYPE_CL_CHANGEINFO](#21---netmsgtype_cl_changeinfo) |
| 22            | [NETMSGTYPE_CL_KILL](#22---netmsgtype_cl_kill) |
| 23            | [NETMSGTYPE_CL_EMOTICON](#23---netmsgtype_cl_emoticon) |
| 24            | [NETMSGTYPE_CL_VOTE](#24---netmsgtype_cl_vote) |
| 25            | [NETMSGTYPE_CL_CALLVOTE](#25---netmsgtype_cl_callvote) |

:::info
- **SV** : Server sending to client
- **CL** : Client sending to server
:::

## 1 - NETMSGTYPE_SV_MOTD

This message sends the server message of the day to a client.

- **Vital** : ✅
- **Instant Sending** : ❌
- **Sending Path** : Server -> Client

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Message       | **String** | The message of the day text, usually taken from the server configuration. |

## 2 - NETMSGTYPE_SV_BROADCAST

This message sends a broadcast message to a specific client.

- **Vital** : ✅
- **Instant Sending** : ❌
- **Sending Path** : Server -> Client

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Message       | **String** | The broadcast text shown to the client. |

## 3 - NETMSGTYPE_SV_CHAT

This message sends a public or team chat line to the client.

- **Vital** : ✅
- **Instant Sending** : ❌
- **Sending Path** : Server -> Client

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Team          | **Integer** | `0` for public chat; `1` for team chat. |
| Client ID     | **Integer** | The sender's client ID (`0` to `15`), or `-1` for server messages. |
| Message       | **String** | The chat text. |

## 4 - NETMSGTYPE_SV_KILLMSG

This message informs clients about a player death and the source of the kill.

- **Vital** : ✅
- **Instant Sending** : ❌
- **Sending Path** : Server -> Client

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Killer        | **Integer** | Client ID of the killer (`0` to `15`). For self-kills and world deaths, this is the victim's client ID. |
| Victim        | **Integer** | Client ID of the player that died (`0` to `15`). |
| Weapon        | **Integer** | Weapon ID (`0` to `5`), or `-3` for game/team changes, `-2` for self-kills, and `-1` for world deaths. |
| Mode Special  | **Integer** | Extra mode-specific value used by the client to render the kill message. |

## 5 - NETMSGTYPE_SV_SOUNDGLOBAL

This message tells the client to play a global sound.

- **Vital** : ✅
- **Instant Sending** : ❌
- **Sending Path** : Server -> Client

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Sound ID      | **Integer** | Sound ID to play globally. |

## 6 - NETMSGTYPE_SV_TUNEPARAMS

This message sends tuning parameters so the client can match the server physics settings. It contains 33 integers in the order below. Each value is scaled by 100; the descriptions refer to the decoded values.

- **Vital** : ✅
- **Instant Sending** : ❌
- **Sending Path** : Server -> Client

Structure:

:::details Show Large Structure
| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Ground Control Speed | **Integer** | Maximum horizontal control speed while grounded. |
| Ground Control Acceleration | **Integer** | Horizontal acceleration while grounded. |
| Ground Friction | **Integer** | Friction applied while grounded. |
| Ground Jump Impulse | **Integer** | Vertical impulse applied by a ground jump. |
| Air Jump Impulse | **Integer** | Vertical impulse applied by an air jump. |
| Air Control Speed | **Integer** | Maximum horizontal control speed while in the air. |
| Air Control Acceleration | **Integer** | Horizontal acceleration while in the air. |
| Air Friction | **Integer** | Friction applied while in the air. |
| Hook Length | **Integer** | Maximum hook length. |
| Hook Fire Speed | **Integer** | Speed at which the hook is fired. |
| Hook Drag Acceleration | **Integer** | Acceleration used while dragging with the hook. |
| Hook Drag Speed | **Integer** | Speed used while dragging with the hook. |
| Gravity | **Integer** | World gravity value. |
| Velramp Start | **Integer** | Start of the velocity ramp. |
| Velramp Range | **Integer** | Range of the velocity ramp. |
| Velramp Curvature | **Integer** | Curvature of the velocity ramp. |
| Gun Curvature | **Integer** | Projectile curvature for the gun. |
| Gun Speed | **Integer** | Projectile speed for the gun. |
| Gun Lifetime | **Integer** | Lifetime in seconds for gun projectiles. |
| Shotgun Curvature | **Integer** | Projectile curvature for shotgun pellets. |
| Shotgun Speed | **Integer** | Projectile speed for shotgun pellets. |
| Shotgun Speeddiff | **Integer** | Speed variation factor for shotgun spread. |
| Shotgun Lifetime | **Integer** | Lifetime in seconds for shotgun projectiles. |
| Grenade Curvature | **Integer** | Projectile curvature for grenades. |
| Grenade Speed | **Integer** | Projectile speed for grenades. |
| Grenade Lifetime | **Integer** | Lifetime in seconds for grenades. |
| Laser Reach | **Integer** | Maximum laser reach. |
| Laser Bounce Delay | **Integer** | Delay between laser bounces in milliseconds. |
| Laser Bounce Num | **Integer** | Number of laser bounces. |
| Laser Bounce Cost | **Integer** | Extra laser energy consumed per bounce, measured in world units of travel distance. |
| Laser Damage | **Integer** | Laser damage value. |
| Player Collision | **Integer** | Enables or disables player collision. |
| Player Hooking | **Integer** | Enables or disables hooking players. |
:::

```c
packed_value = truncate(value * 100)
value = packed_value / 100.0
```

For example, a Gun Lifetime value of `200` decodes to `2` seconds, or 100 ticks at 50 ticks per second. Enabled Player Collision and Player Hooking values are transmitted as `100`; disabled values are `0`.

## 8 - NETMSGTYPE_SV_READYTOENTER

This message tells the client that it may enter the game.

- **Vital** : ✅
- **Instant Sending** : ✅
- **Sending Path** : Server -> Client

Structure:

***Empty payload***

## 9 - NETMSGTYPE_SV_WEAPONPICKUP

This message informs a client that it picked up a weapon.

- **Vital** : ✅
- **Instant Sending** : ❌
- **Sending Path** : Server -> Client

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Weapon        | **Integer** | Weapon ID: `0` = hammer, `1` = gun, `2` = shotgun, `3` = grenade, `4` = rifle/laser, `5` = ninja. |

## 10 - NETMSGTYPE_SV_EMOTICON

This message tells clients to display an emoticon above a player.

- **Vital** : ✅
- **Instant Sending** : ❌
- **Sending Path** : Server -> Client

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Client ID     | **Integer** | The client ID of the player showing the emoticon. |
| Emoticon      | **Integer** | Emoticon ID to display: `0` = oop, `1` = exclamation, `2` = hearts, `3` = drop, `4` = dotdot, `5` = music, `6` = sorry, `7` = ghost, `8` = sushi, `9` = splattee, `10` = deviltee, `11` = zomg, `12` = zzz, `13` = wtf, `14` = eyes, `15` = question. |

## 11 - NETMSGTYPE_SV_VOTECLEAROPTIONS

This message clears the client-side vote option list.

- **Vital** : ✅
- **Instant Sending** : ❌
- **Sending Path** : Server -> Client

Structure:

***Empty payload***

## 12 - NETMSGTYPE_SV_VOTEOPTIONLISTADD

This message adds a batch of vote options to the client-side vote option list.

- **Vital** : ✅
- **Instant Sending** : ❌
- **Sending Path** : Server -> Client

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Num. Options  | **Integer** | Number of active descriptions, from `1` to `15`. |
| Description 0 | **String** | Description slot 0. |
| Description 1 | **String** | Description slot 1. |
| Description 2 | **String** | Description slot 2. |
| Description 3 | **String** | Description slot 3. |
| Description 4 | **String** | Description slot 4. |
| Description 5 | **String** | Description slot 5. |
| Description 6 | **String** | Description slot 6. |
| Description 7 | **String** | Description slot 7. |
| Description 8 | **String** | Description slot 8. |
| Description 9 | **String** | Description slot 9. |
| Description 10 | **String** | Description slot 10. |
| Description 11 | **String** | Description slot 11. |
| Description 12 | **String** | Description slot 12. |
| Description 13 | **String** | Description slot 13. |
| Description 14 | **String** | Description slot 14. |

All 15 strings are sent. The first Num. Options slots contain descriptions; unused slots are empty strings.

## 13 - NETMSGTYPE_SV_VOTEOPTIONADD

This message adds a single vote option to the client-side vote option list.

- **Vital** : ✅
- **Instant Sending** : ❌
- **Sending Path** : Server -> Client

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Description   | **String** | Vote option description to add. |

## 14 - NETMSGTYPE_SV_VOTEOPTIONREMOVE

This message removes a single vote option from the client-side vote option list.

- **Vital** : ✅
- **Instant Sending** : ❌
- **Sending Path** : Server -> Client

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Description   | **String** | Vote option description to remove. |

## 15 - NETMSGTYPE_SV_VOTESET

This message starts, updates, or ends a vote on the client.

- **Vital** : ✅
- **Instant Sending** : ❌
- **Sending Path** : Server -> Client

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Timeout       | **Integer** | Remaining vote timeout in seconds, or `0` when the vote is closed. |
| Description   | **String** | Vote description shown to the client. Empty when the vote is closed. |
| Reason        | **String** | Vote reason shown to the client. Empty when the vote is closed. |

## 16 - NETMSGTYPE_SV_VOTESTATUS

This message updates the client with the current vote count.

- **Vital** : ✅
- **Instant Sending** : ❌
- **Sending Path** : Server -> Client

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Yes           | **Integer** | Number of yes votes. |
| No            | **Integer** | Number of no votes. |
| Pass          | **Integer** | Number of players that have not voted. |
| Total         | **Integer** | Total number of eligible voters. |

## 17 - NETMSGTYPE_CL_SAY

This message sends a chat message from the client to the server.

- **Vital** : ✅
- **Instant Sending** : ❌
- **Sending Path** : Client -> Server

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Team          | **Boolean** | `0` for public chat; `1` for team chat. |
| Message       | **String** | Chat text entered by the client. |

## 18 - NETMSGTYPE_CL_SETTEAM

This message requests a team change from the client.

- **Vital** : ✅
- **Instant Sending** : ❌
- **Sending Path** : Client -> Server

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Team          | **Integer** | Requested team: `-1` = spectators, `0` = red team, `1` = blue team. |

## 19 - NETMSGTYPE_CL_SETSPECTATORMODE

This message changes how the client is spectating.

- **Vital** : ✅
- **Instant Sending** : ❌
- **Sending Path** : Client -> Server

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Spectator ID  | **Integer** | Client ID being spectated, or `-1` (`SPEC_FREEVIEW`) for free view mode. |

## 20 - NETMSGTYPE_CL_STARTINFO

This message sends the player's initial information to the server.

- **Vital** : ✅
- **Instant Sending** : ✅
- **Sending Path** : Client -> Server

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Name          | **String** | Player name. |
| Clan          | **String** | Player clan. |
| Country       | **Integer** | Country code for the player. |
| Skin          | **String** | Skin name. |
| Use Custom Color | **Boolean** | Whether the player uses custom skin colors. |
| Color Body    | **Integer** | Body color value. |
| Color Feet    | **Integer** | Feet color value. |

## 21 - NETMSGTYPE_CL_CHANGEINFO

This message sends updated player information (name, clan, skin, colors) to the server.

- **Vital** : ✅
- **Instant Sending** : ❌
- **Sending Path** : Client -> Server

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Name          | **String** | Player name. |
| Clan          | **String** | Player clan. |
| Country       | **Integer** | Country code for the player. |
| Skin          | **String** | Skin name. |
| Use Custom Color | **Boolean** | Whether the player uses custom skin colors. |
| Color Body    | **Integer** | Body color value. |
| Color Feet    | **Integer** | Feet color value. |

## 22 - NETMSGTYPE_CL_KILL

This message requests the server to kill the client's current character.

- **Vital** : ✅
- **Instant Sending** : ❌
- **Sending Path** : Client -> Server

Structure:

***Empty payload***

## 23 - NETMSGTYPE_CL_EMOTICON

This message sends an emoticon request from the client to the server.

- **Vital** : ✅
- **Instant Sending** : ❌
- **Sending Path** : Client -> Server

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Emoticon      | **Integer** | Emoticon ID selected by the client: `0` = oop, `1` = exclamation, `2` = hearts, `3` = drop, `4` = dotdot, `5` = music, `6` = sorry, `7` = ghost, `8` = sushi, `9` = splattee, `10` = deviltee, `11` = zomg, `12` = zzz, `13` = wtf, `14` = eyes, `15` = question. |

## 24 - NETMSGTYPE_CL_VOTE

This message sends the client's vote choice to the server.

- **Vital** : ✅
- **Instant Sending** : ❌
- **Sending Path** : Client -> Server

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Vote          | **Integer** | Vote choice: `-1` = no, `0` = pass, `1` = yes. |

## 25 - NETMSGTYPE_CL_CALLVOTE

This message requests the server to start a vote.

- **Vital** : ✅
- **Instant Sending** : ❌
- **Sending Path** : Client -> Server

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Type          | **String** | Vote type: `option`, `kick`, or `spectate`. |
| Value         | **String** | Option description, or a decimal client ID string for kick and spectate votes. |
| Reason        | **String** | Reason shown for the vote. |

Authenticated clients perform forced actions through rcon commands.

---

<!--## DDNet-Specific Game Messages

The following messages use UUID-based identifiers and are only available in DDNet-based servers. They use the same wire format as standard game messages (`NETMSGTYPE_EX` = 0 followed by a 16-byte UUID in the message payload).

:::info
For details on how UUID strings are hashed into UUIDv3 values and how the UUID registration system works, see the [DDNet Specific Messages & Snap Items](./../fundamentals.md#ddnet-specific-messages-snap-items) section in the Fundamentals page.
:::

### NETMSGTYPE_CL_SHOWDISTANCE

Sent by the client to set the camera show distance.

- **UUID:** `show-distance@netmsg.ddnet.tw`
- **Vital** : ✅
- **Sending Path** : Client -> Server

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| X             | **Integer** | Camera distance X offset. |
| Y             | **Integer** | Camera distance Y offset. |

### NETMSGTYPE_CL_SHOWOTHERS

Sent by the client to toggle visibility of other players.

- **UUID:** `showothers@netmsg.ddnet.tw`
- **Vital** : ✅
- **Sending Path** : Client -> Server

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Show          | **Integer** | Visibility mode: `0` = own team only, `1` = all teams, `2` = others shown but not active. |

### NETMSGTYPE_CL_CAMERAINFO

Sent by the client to report the current camera settings.

- **UUID:** `camera-info@netmsg.ddnet.org`
- **Vital** : ✅
- **Sending Path** : Client -> Server

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Zoom          | **Integer** | Camera zoom level. |
| Deadzone      | **Integer** | Camera deadzone. |
| Follow Factor | **Integer** | Camera follow factor. |

### NETMSGTYPE_SV_TEAMSSTATE

Sent by the server to synchronize DDRace team state.

- **UUID:** `teamsstate@netmsg.ddnet.tw`
- **Vital** : ✅
- **Sending Path** : Server -> Client

Structure:

***Empty payload***

### NETMSGTYPE_SV_DDRACETIME

Sent by the server to report a DDRace checkpoint or finish time.

- **UUID:** `ddrace-time@netmsg.ddnet.tw`
- **Vital** : ✅
- **Sending Path** : Server -> Client

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Time          | **Integer** | Race time. |
| Check         | **Integer** | Checkpoint ID. |
| Finish        | **Integer** | Whether this is a finish message: `0` = checkpoint, `1` = finish. |

### NETMSGTYPE_SV_RECORD

Sent by the server to report server and player best time records.

- **UUID:** `record@netmsg.ddnet.tw`
- **Vital** : ✅
- **Sending Path** : Server -> Client

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Server Time Best | **Integer** | Current server best time. |
| Player Time Best | **Integer** | Current player best time. |

### NETMSGTYPE_SV_KILLMSGTEAM

Sent by the server to report a team kill.

- **UUID:** `killmsgteam@netmsg.ddnet.tw`
- **Vital** : ✅
- **Sending Path** : Server -> Client

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Team          | **Integer** | Team that got killed (`0` to `63`). |
| First         | **Integer** | First player in the team, or `-1` if none. |

### NETMSGTYPE_SV_YOURVOTE

Sent by the server to inform a client what they voted.

- **UUID:** `yourvote@netmsg.ddnet.org`
- **Vital** : ✅
- **Sending Path** : Server -> Client

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Voted         | **Integer** | Vote choice: `-1` = no, `0` = pass, `1` = yes. |

### NETMSGTYPE_SV_RACEFINISH

Sent by the server to report a race finish.

- **UUID:** `racefinish@netmsg.ddnet.org`
- **Vital** : ✅
- **Sending Path** : Server -> Client

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Client ID     | **Integer** | Client ID of the player that finished (`0` to `63`). |
| Time          | **Integer** | Finish time. |
| Diff          | **Integer** | Time difference. |
| Record Personal | **Integer** | Whether the player set a personal record (boolean). |
| Record Server   | **Integer** | Whether the player set a server record (boolean). |

### NETMSGTYPE_SV_COMMANDINFO

Sent by the server to inform a client about an available chat command.

- **UUID:** `commandinfo@netmsg.ddnet.org`
- **Vital** : ✅
- **Sending Path** : Server -> Client

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Name          | **String** | Command name. |
| Args Format   | **String** | Argument format string. |
| Help Text     | **String** | Help text for the command. |

### NETMSGTYPE_SV_COMMANDINFOREMOVE

Sent by the server to remove a chat command from a client's list.

- **UUID:** `commandinfo-remove@netmsg.ddnet.org`
- **Vital** : ✅
- **Sending Path** : Server -> Client

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Name          | **String** | Name of the command to remove. |

### NETMSGTYPE_SV_VOTEOPTIONGROUPSTART

Sent by the server to begin a group of vote options.

- **UUID:** `sv-vote-option-group-start@netmsg.ddnet.org`
- **Vital** : ✅
- **Sending Path** : Server -> Client

Structure:

***Empty payload***

### NETMSGTYPE_SV_VOTEOPTIONGROUPEND

Sent by the server to signal the end of a group of vote options.

- **UUID:** `sv-vote-option-group-end@netmsg.ddnet.org`
- **Vital** : ✅
- **Sending Path** : Server -> Client

Structure:

***Empty payload***

### NETMSGTYPE_SV_COMMANDINFOGROUPSTART

Sent by the server to begin a group of chat command info messages.

- **UUID:** `sv-commandinfo-group-start@netmsg.ddnet.org`
- **Vital** : ✅
- **Sending Path** : Server -> Client

Structure:

***Empty payload***

### NETMSGTYPE_SV_COMMANDINFOGROUPEND

Sent by the server to signal the end of a group of chat command info messages.

- **UUID:** `sv-commandinfo-group-end@netmsg.ddnet.org`
- **Vital** : ✅
- **Sending Path** : Server -> Client

Structure:

***Empty payload***

### NETMSGTYPE_SV_CHANGEINFOCOOLDOWN

Sent by the server to set a cooldown on player info changes (name, clan, skin).

- **UUID:** `change-info-cooldown@netmsg.ddnet.org`
- **Vital** : ✅
- **Sending Path** : Server -> Client

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Wait Until    | **Integer** | Game tick until which info changes are blocked. |

### NETMSGTYPE_SV_MAPSOUNDGLOBAL

Sent by the server to play a global sound triggered by the map.

- **UUID:** `map-sound-global@netmsg.ddnet.org`
- **Vital** : ✅
- **Sending Path** : Server -> Client

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Sound ID      | **Integer** | Sound ID to play globally. |

### NETMSGTYPE_SV_PREINPUT

Sent by the server to apply pre-input (forced movement) to a specific player.

- **UUID:** `preinput@netmsg.ddnet.org`
- **Vital** : ✅
- **Sending Path** : Server -> Client

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Direction     | **Integer** | Forced direction: `-1` = left, `0` = neutral, `1` = right. |
| Target X      | **Integer** | Forced target X coordinate. |
| Target Y      | **Integer** | Forced target Y coordinate. |
| Jump          | **Integer** | Forced jump input. |
| Fire          | **Integer** | Forced fire input. |
| Hook          | **Integer** | Forced hook input. |
| Wanted Weapon | **Integer** | Forced direct weapon selection. |
| Next Weapon   | **Integer** | Forced next weapon cycle. |
| Prev Weapon   | **Integer** | Forced previous weapon cycle. |
| Owner         | **Integer** | Client ID of the player to apply the pre-input to (`0` to `63`). |
| Intended Tick | **Integer** | Game tick when this input should be applied. |

### NETMSGTYPE_SV_SAVECODE

Sent by the server to deliver a save code to a client.

- **UUID:** `save-code@netmsg.ddnet.org`
- **Vital** : ✅
- **Sending Path** : Server -> Client

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| State         | **Integer** | Save state: `0` = pending, `1` = done, `2` = fallback file, `3` = warning, `4` = error. |
| Error         | **String** | Error message if state is error. |
| Save Requester | **String** | Name of the player who requested the save. |
| Server Name   | **String** | Name of the server. |
| Generated Code | **String** | The generated save code. |
| Code          | **String** | The save code string. |
| Team Members  | **String** | Comma-separated team member names. |

### NETMSGTYPE_SV_SERVERALERT

Sent by the server to show a server alert message to all clients.

- **UUID:** `server-alert@netmsg.ddnet.org`
- **Vital** : ✅
- **Sending Path** : Server -> Client

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Message       | **String** | Alert message text. |

### NETMSGTYPE_SV_MODERATORALERT

Sent by the server to show a moderator alert message to all clients.

- **UUID:** `moderator-alert@netmsg.ddnet.org`
- **Vital** : ✅
- **Sending Path** : Server -> Client

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Message       | **String** | Alert message text. |

### NETMSGTYPE_CL_ENABLESPECTATORCOUNT

Sent by the client to enable or disable the spectator count feature.

- **UUID:** `enable-spectator-count@netmsg.ddnet.org`
- **Vital** : ✅
- **Sending Path** : Client -> Server

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Enable        | **Integer** | Whether to enable spectator count (boolean). |

### NETMSGTYPE_SV_MAPINFO

Sent by the server to provide map description text.

- **UUID:** `map-info@netmsg.ddnet.org`
- **Vital** : ✅
- **Sending Path** : Server -> Client

Structure:

| Field         | Type   | Description |
| ------------- | ------ | ----------- |
| Description   | **String** | Map description text. |-->
