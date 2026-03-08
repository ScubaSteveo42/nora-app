# Nora App - Getting Started Guide

## What is this?

This is the Nora app - a safe dining app for people with food allergies. You can see it live at **https://norarocks.meetjuvra.info**

The code lives on GitHub so we can both work on it from different computers.

---

## One-Time Setup (Do These Steps Once)

### Step 1: Open Terminal

- Press **Command + Space** to open Spotlight
- Type **Terminal** and press Enter

### Step 2: Create a folder for the project

Copy and paste this into Terminal, then press Enter:

```
mkdir -p ~/Projects && cd ~/Projects
```

### Step 3: Clone the project from GitHub

Copy and paste this into Terminal, then press Enter:

```
git clone https://github.com/ScubaSteveo42/nora-app.git
```

If it asks you to log into GitHub, follow the prompts in your browser.

### Step 4: Go into the project folder

```
cd ~/Projects/nora-app
```

### Step 5: Open the project in Claude Code

```
claude
```

This opens Claude Code inside the project. Claude will read the CLAUDE.md file and understand the entire project.

---

## How to Work on the App

Every time you want to make changes:

### Step 1: Open Terminal

Press **Command + Space**, type **Terminal**, press Enter.

### Step 2: Go to the project

```
cd ~/Projects/nora-app
```

### Step 3: Get the latest changes (in case someone else made updates)

```
git pull
```

### Step 4: Open Claude Code

```
claude
```

### Step 5: Tell Claude what you want

Just type what you want in plain English! Examples:

- "Change the green accent color to purple"
- "Add a favorites feature so I can save restaurants I like"
- "The search bar is too small on mobile, make it bigger"
- "Show me what the profile page looks like"
- "Add a new restaurant called Mario's Pizza with peanut-free pasta"

Claude will read the code, make changes, and explain what it did.

### Step 6: Save your changes to GitHub

After Claude makes changes you like, tell it:

- "Commit these changes and push to GitHub"

This saves your work so Steven can see it too.

---

## Quick Reference

| What you want to do | What to type in Terminal |
|---|---|
| Go to the project | `cd ~/Projects/nora-app` |
| Get latest changes | `git pull` |
| Open Claude Code | `claude` |
| See the live site | Open https://norarocks.meetjuvra.info in your browser |

---

## If Something Goes Wrong

- **"command not found: claude"** - Claude Code needs to be installed. Run: `npm install -g @anthropic-ai/claude-code`
- **"command not found: git"** - Run: `xcode-select --install` and follow the prompts
- **Git asks for a password** - You need to log into GitHub. Run: `gh auth login` and follow the prompts
- **Changes aren't showing on the live site** - The code needs to be deployed to the server. Ask Steven or tell Claude "deploy to the VPS"

---

## How This All Works Together

```
Your Computer                  GitHub                    Live Website
(where you edit)    -->    (shared storage)    -->    norarocks.meetjuvra.info
                          ScubaSteveo42/nora-app      (on the VPS server)
```

1. You make changes on your computer using Claude Code
2. You push them to GitHub (the shared place)
3. Steven (or you) can deploy from GitHub to the live website

Both you and Steven can work on the same project from different computers because GitHub keeps everything in sync.
