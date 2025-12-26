<div align="center">
  <a href="https://github.com/logan354/bass-bot">
    <img src="assets/bass_bot_speaker.jpg" alt="Logo" width="128" height="128">
  </a>
</div>

# Bass bot
A music bot for Discord. Turn up the music with Bass! Supports YouTube, Youtube Music, Spotify, and Soundcloud.

### Features
- Supports YouTube/Youtube Music, Spotify, and Soundcloud.
- Supports discord.js v14

## Setup
### Prerequisites
- Node.js 22.12.0
- FFMPEG

### Installation
1. Create Discord App
2. Configuration Files<br>
    Complete the following files: (remove ".example")
    - .env
    - config.json
    - emojis.json

3. Install NPM Packages
    ```sh
    npm install
    ```

## Usage
1. Build
    ```sh
    npm run build
    ```

2. Run
    ```sh
    npm run start
    ```

### Command Guide
*Format: **name** `<required>` `[optional]`*

#### Player
- **disconnect**
- **fast-forward** `<timestamp>`
- **join**
- **next** `[force]`
- **pause**
- **player**
- **previous** `[force]`
- **resume**
- **rewind** `<timestamp>`
- **seek** `<timestamp>`
- **stop**
- **volume** `<level>`

#### Queue
- **clear**
- **jump** `<position>`
- **move** `<index>` `<position>`
- **nowplaying**
- **queue**
- **remove** `<position>`
- **repeat** `<mode>`
- **shuffle**

#### Search
- **play** `[query]` `[source]` `[playnow]`
- **search** `<query>` `[source]` `[playnow]`
- **search-album** `<query>` `[source]` `[playnow]`
- **search-playlist** `<query>` `[source]` `[playnow]`
- **search-track** `<query>` `[source]` `[playnow]`

#### Utility
- **help** `[command]`
- **ping**

## Contributing
TBD