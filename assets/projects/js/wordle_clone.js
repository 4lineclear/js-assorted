function isLetter(str) {
    return str.length === 1 && str.match(/[a-z]/i);
}
/**
 * Provides valid guess box ids
 * @param {number} row The row to generate for
 * @param {number} col The column to generate for
 * @returns The id matching the given row & column
 */
function boxID(row, col) {
    return "guess-box-" + row + "-" + col;
}
/**
 * Generates the guess boxes
 */
function generateBoxes() {
    let guess_boxes = document.getElementById("guess-holder");
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 5; col++) {
            let box = document.createElement("div");
            box.className = "guess-box";
            box.id = boxID(row, col);
            guess_boxes.appendChild(box);
        }
    }
}
/**
 * Generates the visual keyboard
 */
function generateKeyboard() {
    let keyboard = document.getElementById("keyboard");

    let top = generateKeyboardRow("QWERTYUIOP");
    let middle = generateKeyboardRow("ASDFGHJKL");
    let bottom = generateKeyboardRow("ZXCVBNM");

    let enter = document.createElement("div");
    enter.id = "enter";
    enter.className = "keyboard-tile";
    enter.textContent = "Enter";
    enter.onclick = function () {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    };

    let backspace = document.createElement("div");
    backspace.id = "backspace";
    backspace.className = "keyboard-tile";
    backspace.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24' +
        '" width="20" ><path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.' +
        "36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H7.07L2.4 1" +
        "2l4.66-7H22v14zm-11.59-2L14 13.41 17.59 17 19 15.59 15.41 12 19 8.41 1" +
        '7.59 7 14 10.59 10.41 7 9 8.41 12.59 12 9 15.59z"></path></svg>';
    backspace.onclick = function () {
        document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Backspace" })
        );
    };
    bottom.prepend(enter);
    bottom.appendChild(backspace);

    keyboard.appendChild(top);
    keyboard.appendChild(middle);
    keyboard.appendChild(bottom);
}
/**
 * Create a keyboard row
 * @param {String} letters The letters to create a row for
 * @returns A div containing the letters within letters
 */
function generateKeyboardRow(letters) {
    let row = document.createElement("div");
    for (let i = 0; i < letters.length; i++) {
        let tile = document.createElement("div");
        tile.className = "keyboard-tile";
        tile.textContent = letters.charAt(i);
        tile.onclick = function () {
            document.dispatchEvent(
                new KeyboardEvent("keydown", { key: letters.charAt(i) })
            );
        };
        row.appendChild(tile);
    }
    return row;
}
/**
 * Checks the row against the guess,
 * changing the guess boxes to their matching colors
 * @param {number} row The current row
 * @param {string} word The correct word
 * @param {string} guess The user's guess
 * @returns If the user's guess matches the word
 */
function checkGuess(row, word, guess) {
    let correct_count = 0;
    for (let i = 0; i < guess.length; i++) {
        document.getElementById(boxID(row, i)).style.transition =
            "background-color 100ms linear";
        if (guess.charAt(i) == word.charAt(i)) {
            document.getElementById(boxID(row, i)).classList.add("correct");
            correct_count += 1;
        } else if (word.includes(guess.charAt(i))) {
            document.getElementById(boxID(row, i)).classList.add("almost");
        } else {
            document.getElementById(boxID(row, i)).classList.add("wrong");
        }
    }
    return correct_count == 5;
}
/**
 *
 * @returns The guess that will be correct
 */
async function chooseGuess() {
    const resp = await fetch("/rand-five-letter");
    return await resp.text();
}
function setPopup(text) {
    let popup = document.getElementById("popup");
    popup.innerHTML = "<div>" + text + "</div>";
    popup.className = "popup show";
    return popup;
}
function addKeyPress(word) {
    let row = 0;
    let col = 0;
    document.addEventListener("keydown", function (event) {
        if (
            event.ctrlKey ||
            event.altKey ||
            event.metaKey ||
            event.repeat ||
            event.isComposing
        )
            return;
        if (isLetter(event.key) && col < 5) {
            document.getElementById(boxID(row, col++)).textContent =
                event.key.toUpperCase();
        } else if (event.key == "Backspace" && col > 0) {
            document.getElementById(boxID(row, --col)).textContent = null;
        } else if (event.key == "Enter") {
            let guesses = "";
            for (let i = 0; i < 5; i++) {
                let guess = document.getElementById(boxID(row, i)).textContent;

                if (guess != "") {
                    guesses += guess;
                } else {
                    let popup = setPopup("Not enough letters");
                    setTimeout(() => (popup.className = "popup"), 2000);
                    return;
                }
            }
            if (checkGuess(row, word, guesses)) {
                setPopup("Well done!");
                document.removeEventListener(
                    "keydown",
                    arguments.callee,
                    false
                );
                return;
            }
            col = 0;
            row++;
            if (row > 5) {
                setPopup(word.toLowerCase());
                document.removeEventListener(
                    "keydown",
                    arguments.callee,
                    false
                );
            }
        }
    });
}
chooseGuess().then(
    (word) => {
        generateBoxes();
        generateKeyboard();
        addKeyPress(word);
    },
    (error) => {
        let popup = document.getElementById("popup");
        popup.innerHTML = "<div>Unable to pull word from serve</div>";
        popup.className = "popup show";
        console.error(error);
    }
);
