#!/bin/bash
# Nora App - One-time setup script
# Run this once on a new computer to get everything ready

echo ""
echo "========================================="
echo "  Nora App - Setting Up Your Computer"
echo "========================================="
echo ""

# Check for git
if ! command -v git &> /dev/null; then
    echo "Installing developer tools (this may take a few minutes)..."
    xcode-select --install
    echo ""
    echo "After the install finishes, run this script again."
    exit 1
fi
echo "  Git: installed"

# Check for node/npm
if ! command -v node &> /dev/null; then
    echo ""
    echo "Node.js is not installed. Installing via Homebrew..."
    if ! command -v brew &> /dev/null; then
        echo "Installing Homebrew first..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
    brew install node
fi
echo "  Node.js: installed ($(node --version))"

# Check for GitHub CLI
if ! command -v gh &> /dev/null; then
    echo "Installing GitHub CLI..."
    brew install gh
fi
echo "  GitHub CLI: installed"

# Check GitHub auth
if ! gh auth status &> /dev/null; then
    echo ""
    echo "You need to log into GitHub."
    echo "A browser window will open - log in there."
    echo ""
    gh auth login --hostname github.com --git-protocol https --web
    gh auth setup-git
fi
echo "  GitHub: logged in"

# Check for Claude Code
if ! command -v claude &> /dev/null; then
    echo "Installing Claude Code..."
    npm install -g @anthropic-ai/claude-code
fi
echo "  Claude Code: installed"

# Clone the project if not already there
PROJ_DIR="$HOME/Projects/nora-app"
if [ ! -d "$PROJ_DIR" ]; then
    echo ""
    echo "Downloading the Nora project..."
    mkdir -p "$HOME/Projects"
    git clone https://github.com/ScubaSteveo42/nora-app.git "$PROJ_DIR"
else
    echo "  Project: already downloaded"
    cd "$PROJ_DIR" && git pull
fi

echo ""
echo "========================================="
echo "  All set! Here's what to do next:"
echo "========================================="
echo ""
echo "  1. Open Terminal"
echo "  2. Run: cd ~/Projects/nora-app"
echo "  3. Run: claude"
echo "  4. Start telling Claude what you want to change!"
echo ""
echo "  Live site: https://norarocks.meetjuvra.info"
echo ""
