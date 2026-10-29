# Introduction

This documentation describes the Teeworlds 0.6 map format. It explains how to read a `.map` file, decode its layers, find entity positions, and use the Game layer for collision.


## The Map Format

A `.map` file is a **datafile** containing two kinds of records:

- **Items** store metadata, such as a layer's dimensions or an image reference. Their payloads contain 32-bit integers.
- **Data blocks** store variable-length content, such as tile grids, image pixels, and strings.

For example, a layer item does not contain its tiles. It contains a data block index that tells the reader where to find them.

Groups organize layers. Tilemap layers describe grids, while quad layers describe backgrounds and decorations. One tilemap is marked as the **Game layer**. Its tiles define walls, death tiles, spawn points, and pickups.

## What to Expect

The explanations use field tables, byte examples, and pseudocode to describe how maps work. They do not require a particular framework or programming language.

The documentation covers **Teeworlds 0.6** maps. DDNet-specific map items and additional physics layers are not included.

Map files describe the world and its initial entity positions. They do not store active players, current pickup state, or game rules.

## Debugging

Use a hex editor to inspect file headers and offsets, and the Teeworlds map editor to inspect layers and entity markers.

When testing a map reader, compare the decoded layer dimensions and entity positions with the editor.

## Credits

This documentation was created by [Miguilim](https://github.com/miguilimzero). The content is based on [libtw2 docs](https://github.com/heinrich5991/libtw2/tree/master/doc), [Teeworlds 0.6 Source](https://github.com/teeworlds/teeworlds/tree/0.6), and the TeeFrame source code.
