# Owlbear Rodeo tracker extension
> **obr_tracker**

Simple browser extension, adding combat tracker for Owlbear Rodeo tabletop map simulator. 
It lets you track dice rolls, combat turns, health and conditions of characters on the map.

This extension adds following functions to the Owlbear Rodeo:
- **Combat tracker**, that lets you track rounds and turns of the characters on the map.
- **Dice tracker**, that lets you track who rolled what and when it happened.
- **Extension menu** allows toggling modules on/off and keeps track of your games.

OBRT works only with [Owlbear Rodeo](https://owlbear.rodeo) and depends on its updates. The latest OBR version that was tested with the extension is specified in OBRT menu.

Note: OBR Tracker is developed independently, and is not officially endorsed by or affiliated with Owlbear Rodeo.

## Installation

Quick links to single-click installation from various Web Stores:
- [Chrome Web Store](https://chrome.google.com/webstore/detail/owlbear-rodeo-combat-trac/lcfcmebjoechmikocfjjeocnljconfdp) for Chrome and most other browsers
- [Edge Addons Store](https://microsoftedge.microsoft.com/addons/detail/owlbear-rodeo-tracker/eejflcokmghbnkekboiflnpjjidcdjif) for MS Edge
- [Firefox AMO](https://addons.mozilla.org/firefox/addon/owlbear-combat-tracker/) for Firefox (including Nightly build on Android)
- [Opera Addons](https://addons.opera.com/extensions/details/owlbear-rodeo-tracker/)  for Opera

## Combat tracker

Adds small collapsible overlay window to keep track of whose turn it is, and other optional minor stuff like HP, damage and conditions. It takes named tokens from the map and allows assigning them INIT values as well as other data. Then you can switch turns, it will count combat rounds for you. Conditions will automatically drop after set amount of rounds. 

Combat tracker should be managed by one player (usually GM) and other and other OBRT users on the same map can just see the info. They won't see the exact HP values, just general condition & damage done. To initialize combat tracker data sharing, GM needs to create a Note with "!" (exclamation mark) somewhere outside the map.

## Dice tracker

Adds dice log to keep track of player's dice rolls, with information on what exactly happened and when. It takes the dice values from left panel and puts them to a new small log overlay in the bottom-right corner of the screen. Unlike the native dice panel, it shows individual dice rolls with the timestamp, so no more wondering what dice were cast if the player has multiple dice in his tray.

It also optionally adds dice roll sounds when a dice is cast by user or other players. It also prevents abusing dice rerolls, and makes dice tray collapse on click.

## Extension button

Each feature can be enabled or disabled via OBRT menu available through extension button. To apply settings you need to reload the page. Extension menu also keeps track of the recent games, and lets you quickly open a recent game or just switch to the Owlbear Rodeo tab if it's already open somewhere.

____

Copyright 2021 Redweller (redweller@gmail.com)

Licensed under the Apache License, Version 2.0
