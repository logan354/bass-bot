<div align="center">
  <a href="https://github.com/logan354/bass-bot">
    <img src="assets/Bass Bot Speaker - Profile.jpg" alt="Logo" width="128" height="128">
  </a>
</div>

# Bass bot
A music bot for Discord. Turn up the music with Bass! Supports YouTube, Youtube Music, Spotify, and Soundcloud.

### Features
- Supports YouTube, Youtube Music, Spotify, and Soundcloud.
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
    npm install npm@latest -g
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
A command guide for Bass bot.</br>
Format: **name** &lt;required&gt; [optional]

#### Player
- **disconnect**
- **fastforward** &lt;timestamp&gt;
- **join**
- **next** [force]
- **pause**
- **previous** [force]
- **resume**
- **rewind** &lt;timestamp&gt;
- **seek** &lt;timestamp&gt;
- **stop**
- **volume** &lt;level&gt;

#### Queue
- **clear**
- **jump** &lt;position&gt;
- **nowplaying**
- **move** &lt;start-position&gt; &lt;end-position&gt;
- **remove** &lt;position&gt;
- **repeat** &lt;mode&gt;
- **shuffle**
- **queue**

#### Search
- **play** [query] [source] [playnow]
- **search** &lt;query&gt; [source] [playnow]
- **search album** &lt;query&gt; [source] [playnow]
- **search playlist** &lt;query&gt; [source] [playnow]

#### Utility
- **help** [command]
- **ping**

## Contributing
TBD