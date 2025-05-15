#!/usr/bin/env node

const { program } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

const HIGHSCORE_FILE = path.join(process.env.HOME || process.env.USERPROFILE, '.simon_highscores.json');

const colors = ['red', 'blue', 'green', 'yellow'];

// Load high scores
async function loadHighScores() {
  try {
    const data = await fs.readFile(HIGHSCORE_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save high score
async function saveHighScore(score, name) {
  const highScores = await loadHighScores();
  highScores.push({ name, score, date: new Date().toISOString() });
  highScores.sort((a, b) => b.score - a.score); // Sort by score descending
  highScores.splice(5); // Keep top 5 scores
  await fs.writeFile(HIGHSCORE_FILE, JSON.stringify(highScores, null, 2));
}

// Display high scores
async function showHighScores() {
  const highScores = await loadHighScores();
  if (!highScores.length) {
    console.log(chalk.yellow('No high scores yet.'));
    return;
  }
  console.log(chalk.blue('High Scores:'));
  highScores.forEach((entry, index) => {
    console.log(`${index + 1}. ${entry.name} - ${entry.score} points (${entry.date})`);
  });
}

// Reset high scores
async function resetHighScores() {
  await fs.writeFile(HIGHSCORE_FILE, JSON.stringify([], null, 2));
  console.log(chalk.green('High scores cleared!'));
}

// Get random color
function getRandomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}

// Display sequence with colored output
async function displaySequence(sequence) {
  console.log(chalk.cyan('Watch the sequence...'));
  for (const color of sequence) {
    const colored = color === 'red' ? chalk.red(color) :
                    color === 'blue' ? chalk.blue(color) :
                    color === 'green' ? chalk.green(color) :
                    chalk.yellow(color);
    console.log(colored);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Pause between colors
    console.clear();
  }
  console.log(chalk.cyan('Now repeat the sequence!'));
}

// Play a game
async function playGame() {
  let sequence = [];
  let score = 0;

  console.log(chalk.cyan('Welcome to Simon Says!'));
  console.log(chalk.cyan('Memorize the sequence of colors and repeat it.'));

  while (true) {
    // Add new color to sequence
    sequence.push(getRandomColor());
    score = sequence.length - 1;

    // Show sequence
    await displaySequence(sequence);

    // Get player input
    for (let i = 0; i < sequence.length; i++) {
      const { guess } = await inquirer.prompt([
        {
          type: 'list',
          name: 'guess',
          message: `Enter color ${i + 1}:`,
          choices: colors,
        },
      ]);

      if (guess !== sequence[i]) {
        console.log(chalk.red(`Game over! You got the sequence wrong.`));
        console.log(chalk.red(`Your score: ${score}`));
        const { name } = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Enter your name to save your score:',
            default: 'Player',
          },
        ]);
        await saveHighScore(score, name);
        return;
      }
    }

    console.log(chalk.green('Correct! Next round...'));
    await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause
    console.clear();
  }
}

program
  .command('play')
  .description('Start a new game')
  .action(() => playGame());

program
  .command('highscore')
  .description('View high scores')
  .action(() => showHighScores());

program
  .command('reset')
  .description('Clear high scores')
  .action(() => resetHighScores());

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
  console.log(chalk.cyan('Use the "play" command to start the game!'));
}
