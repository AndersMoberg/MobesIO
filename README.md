# MobesIO
Collection of scripts I've developed overtime for personal use.
It is meant to be install and linked up through your global Node installation.

⚠ This code isn't super clean.. but it works for my purposes, and is organized to a decent level. 
⚠ In certain cases, some constants are used that are in my native tongue.

## Installation and usage
Clone this repo and run "npm install", it will automatically run "npm run build" and "npm link".
Use the command "io" to get a command-line help text.

## Explanation
It allows you to select an input and a output mechanism.

Inputs can be:
* Todoist
* Notion-style .csv file (Name, Datum (Date), URL)
* Google Takeout Youtube Playlist-style .csv file

All the input is processed, item by item, and then goes through the Output mechanism.

Output can be:
* Dryrun (displays what was processed in terminal)
* Notion-style .csv file (Name, Datum (Date), URL, Skapare (Creator))
* Obsidian-style .md file + youtube-dlp run (expects "yt-dlp" to be a valid command)

If you use the Todoist input, there's an option to "remove" each tasks after the Output mechanism has concluded. Effectively, "exporting and cleaning" tasks from Todoist.
