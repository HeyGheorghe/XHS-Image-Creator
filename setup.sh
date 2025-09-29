#!/bin/bash

# This script checks for and installs the necessary dependencies for the project.

echo "Starting environment setup..."

# Check if running in a Bash-compatible environment
if [[ "$(uname)" == "Darwin" ]]; then
    echo "✅ Running on macOS."
elif [[ "$(uname)" == "Linux" ]]; then
    # Could be WSL or native Linux
    if grep -qEi '(microsoft|wsl)' /proc/version 2>/dev/null; then
        echo "✅ Running in WSL (Windows Subsystem for Linux)."
    else
        echo "✅ Running on native Linux."
    fi
elif [[ "$(uname)" == "MINGW"* || "$(uname)" == "CYGWIN"* ]]; then
    echo "✅ Running in Git Bash or Cygwin on Windows."
else
    echo "❌ Error: This script requires a Bash-compatible environment (e.g., Git Bash, WSL, macOS, Linux)."
    echo "If you are on Windows, please install Git Bash (https://git-scm.com/downloads) or enable WSL (https://docs.microsoft.com/en-us/windows/wsl/install) and run this script from there."
    exit 1
fi

# 1. Check for Node.js and npm
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo "❌ Error: Node.js and npm are not installed."
    echo "Please install them from https://nodejs.org/ and run this script again."
    exit 1
else
    echo "✅ Node.js and npm are found."
fi




# 3. Check for system-specific dependencies (realpath for macOS)
if [[ "$(uname)" == "Darwin" ]]; then
    if ! command -v realpath &> /dev/null; then
        echo "⚠️ Warning: 'realpath' command not found."
        if ! command -v brew &> /dev/null; then
            echo "❌ Error: Homebrew (brew) is not installed."
            echo "Please install Homebrew from https://brew.sh/, then run 'brew install coreutils', and finally run this script again."
            exit 1
        else
            echo "Attempting to install 'coreutils' via Homebrew to get 'realpath'..."
            if brew install coreutils; then
                echo "✅ 'coreutils' installed successfully."
                # It's good practice to inform the user about adding it to PATH, though Homebrew often handles this.
                echo "Please ensure that the coreutils binaries are in your PATH."
            else
                echo "❌ Error: Failed to install 'coreutils' via Homebrew."
                echo "Please install it manually by running 'brew install coreutils' and then run this script again."
                exit 1
            fi
        fi
    else
        echo "✅ 'realpath' command is found."
    fi
fi

# 4. Install Node.js dependencies from package.json
echo "Installing Node.js dependencies (http-server, playwright, nodejieba)..."
if npm install --cache ./.npm-cache; then
    echo "✅ Node.js dependencies installed successfully."
    echo "Downloading Playwright browsers..."
    if npx playwright install; then
        echo "✅ Playwright browsers downloaded successfully."
    else
        echo "❌ Error: Failed to download Playwright browsers."
        echo "Please check the output above for errors and try again."
        exit 1
    fi
else
    echo "❌ Error: Failed to install Node.js dependencies."
    echo "Please check the output above for errors and try again."
    exit 1
fi

echo "🎉 Environment setup complete!"
echo "You can now run the application using 'npm start' and other scripts."
