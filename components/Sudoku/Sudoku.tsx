import React, { FC, useEffect, useRef, useState, useCallback } from 'react';
import './Sudoku.scss';
import { useGlobalEvent, useMouseEvents, useInterval, useLocalStorage } from 'beautiful-react-hooks';
import { SudokuCell } from './SudokuCell';
import { SudokuControls } from "./SudokuControls";
/*
*  TODO:
 * Documentation - Blog Post
 - Leaderboard
 - Timer
 - Responsive Design
 - Custom Rules
 * */

/* TODO: Break contstruction into Bloggable Components - learning Exercise
*   1. Design Elements & Sketching on Paper
*   2. Project Setup - HTML & CSS - creating UI elements - responsive
*   3. Thinking about functionality - whats needed - Data Stucture Setup
*   4. Selecting Components - mouse/keyboard/touch
*   5. Adding Values - Pencilmarks
*   6. Adding History / UNDO/REDO functionality
*   7. Handle Verification - Solving Algorithm
*   8. Creating a soduku creation algorithm
*   9. Play a game?
* */
type sudokuProps = {
    puzzle: number[][];
}

type sudokuDataProps = {
    fixed: boolean[][],
    selected: boolean[][],
    selectedFocus: number[]
    value: number[][],
    possible: boolean[][],
    pencilMarks: number[][][],
    color: string[][],
    errorColor: string[][],
    flagged: boolean[][],
    solutions: number[][][],
    easyMode: boolean,
    simpleSolvable: boolean,
    difficulty: string,
    historyIndex: number,
    highscores: {
        easy: number
        medium: number
        hard: number
    }
}

type sudokuHistoryDataProps = sudokuDataProps[]

// Initialize Sudoku
function hydrateSudoku(puzzle: number[][], setSudokuData: Function, setSudokuHistory: Function, setTimeElapsed: Function) {
    setSudokuData(sudoku => {
        sudoku = {
            ...sudoku,
            fixed: Array(9).fill(undefined).map(() => Array(9).fill(false)),
            selected: Array(9).fill(undefined).map(() => Array(9).fill(false)),
            possible: Array(9).fill(undefined).map(() => Array(9).fill(true)),
            value: Array(9).fill(undefined).map(() => Array(9).fill(0)),
            pencilMarks: Array(9).fill(undefined).map(() => Array(9).fill(undefined).map(() => [])),
            color: Array(9).fill(undefined).map(() => Array(9).fill('')),
            errorColor: Array(9).fill(undefined).map(() => Array(9).fill('')),
            flagged: Array(9).fill(undefined).map(() => Array(9).fill(false)),
            pencilMarksAlignment: 'corners',
            simpleSolvable: true,
            selectedFocus: [],
            difficulty: 'easy',
            highscores: getHighScores() || { easy: 0, medium: 0, hard: 0 },
            historyIndex: 0,

        };
        puzzle.forEach((row, x) => {
            row.forEach((num, y) => {
                sudoku.fixed[x][y] = !!num;
                sudoku.value[x][y] = num;
            });
        });
        setSudokuHistory([JSON.parse(JSON.stringify({ value: sudoku.value, historyIndex: sudoku.historyIndex }))]);
        setTimeElapsed(0);
        return { ...sudoku };
    });
}

// Handle Selection
function clearSelected(setSudokuData: Function) {
    setSudokuData(sudoku => {
        return {
            ...sudoku,
            selected: Array(9).fill(undefined).map(() => Array(9).fill(false)),
        };
    });
}

function addToSelected([x, y]: [number, number] | number[], setSudokuData: Function) {
    setSudokuData(sudoku => {
        sudoku.selected[x][y] = true;
        sudoku.selectedFocus = [+x, +y];
        return { ...sudoku };
    });
}

function navigateFocus([x, y]: [number, number], setSudokuData: Function) {
    let i = x === 0 && 1 || 0;
    let j = x === 0 && y || x;
    setSudokuData(sudoku => {
        sudoku.selectedFocus[i] = sudoku.selectedFocus[i] + j;
        sudoku.selectedFocus[i] === -1 && (sudoku.selectedFocus[i] = 0);
        sudoku.selectedFocus[i] === 9 && (sudoku.selectedFocus[i] = 8);
        return { ...sudoku };
    });
}

// Handle Value Inptut
function addValue(num: number, setSudokuData: Function, setSudokuHistoryData: Function, timeElapsed) {
    setSudokuData(sudoku => {
        sudoku.selected.forEach((row, x) => {
            row.forEach((isSelected, y) => {
                if (isSelected && !sudoku.fixed[x][y]) {
                    sudoku.value[x][y] = num;
                }
            });
        });
        sudoku.errorColor = Array(9).fill(undefined).map(() => Array(9).fill(''));
        sudoku.easyMode ? (sudoku.possible = checkAllPossible(sudoku.value)) : sudoku.possible = Array(9)
            .fill(undefined)
            .map(() => Array(9).fill(true));
        sudoku.historyIndex = updateHistory(sudoku, setSudokuHistoryData);
        sudoku.value.filter(row => row.indexOf(0) !== -1).length === 0 && validatePuzzle(setSudokuData, timeElapsed);
        return { ...sudoku };
    });
}

function clearValue(setSudokuData: Function) {
    setSudokuData(sudoku => {
        sudoku.selected.forEach((row, x) => {
            row.forEach((isSelected, y) => {
                isSelected && !sudoku.fixed[x][y] && (sudoku.value[x][y] = 0);
            });
        });
        sudoku.easyMode ? (sudoku.possible = checkAllPossible(sudoku.value)) : sudoku.possible = Array(9)
            .fill(undefined)
            .map(() => Array(9).fill(true));
        return { ...sudoku };
    });
    return true;
}

// Handle Color
function addColor(num: number, setSudokuData: Function, colorArray: string[]) {
    setSudokuData(sudoku => {
        sudoku.selected.forEach((row, x) => {
            row.forEach((isSelected, y) => {
                if (isSelected) {
                    sudoku.color[x][y] = colorArray[num];
                }
            });
        });
        sudoku.errorColor = Array(9).fill(undefined).map(() => Array(9).fill(''));
        return { ...sudoku };
    });
}

function clearColor(setSudokuData: Function) {
    setSudokuData(sudoku => {
        sudoku.selected.forEach((row, x) => {
            row.forEach((isSelected, y) => {
                isSelected && (sudoku.color[x][y] = '');
            });
        });
        return { ...sudoku };
    });
    return true;
}

// Handle Pencilmarks
function togglePencilMarks(num: number, setSudokuData: Function) {
    setSudokuData(sudoku => {
        sudoku.selected.forEach((row, x) => {
            row.forEach((isSelected, y) => {
                const { pencilMarks, fixed } = sudoku;
                if (isSelected && !fixed[x][y]) {
                    pencilMarks[x][y].indexOf(num) >= 0
                        ? pencilMarks[x][y].splice(pencilMarks[x][y].indexOf(num), 1)
                        : pencilMarks[x][y].push(num) && pencilMarks[x][y].sort();
                }
            });
        });
        sudoku.errorColor = Array(9).fill(undefined).map(() => Array(9).fill(''));
        return { ...sudoku };
    });
}

function clearPencilMarks(setSudokuData: Function) {
    setSudokuData(sudoku => {
        sudoku.selected.forEach((row, x) => {
            row.forEach((isSelected, y) => {
                isSelected && !sudoku.fixed[x][y] && (sudoku.pencilMarks[x][y] = []);
            });
        });
        return { ...sudoku };
    });
    return true;
}

// Handle Verification
function isPossible([x, y]: [number, number], num: number, value: number[][]) {
    if (num === 0) {
        return true;
    }
    for (let i = 0; i < 9; i++) {
        if (value[x][i] === num && i !== y) {
            return false;
        }
        if (value[i][y] === num && i !== x) {
            return false;
        }
    }
    for (let i = ~~((x / 3) + 1) * 3 - 3; i < ~~((x / 3) + 1) * 3; i++) {
        for (let j = ~~((y / 3) + 1) * 3 - 3; j < ~~((y / 3) + 1) * 3; j++) {
            if (value[i][j] === num && i !== x && j !== y) {
                return false;
            }
        }
    }
    return true;
}

function checkAllPossible(value: number[][]) {
    return value.map((row, x) => row.map((num, y) => {
        return isPossible([x, y], num, value);
    }));
}

function solveSudoku(setSudokuData: Function) {
    let j = 0;
    let solutions = [];

    setSudokuData(sudoku => {
        const solve = () => {
            for (let x = 0; x < 9; x++) {
                for (let y = 0; y < 9; y++) {
                    if (sudoku.value[x][y] === 0) {
                        for (let i = 1; i < 10; i++) {
                            if (isPossible([x, y], i, sudoku.value)) {
                                sudoku.value[x][y] = i;
                                if (solve()) {
                                    return true;
                                } else {
                                    sudoku.value[x][y] = 0;
                                }
                            }
                        }
                        return false;
                    }
                }
            }
            return true;
        };
        solve();
        return { ...sudoku };
    });
}

function unsolveSudoku(setSudokuData: Function) {
    setSudokuData(sudoku => {
        const solve = () => {
            for (let x = 0; x < 9; x++) {
                for (let y = 0; y < 9; y++) {
                    if (sudoku.value[x][y] === 0) {
                        for (let i = 1; i < 10; i++) {
                            if (isPossible([x, y], i, sudoku.value)) {
                                sudoku.value[x][y] = i;
                                if (solve()) {
                                    return true;
                                } else {
                                    sudoku.value[x][y] = 0;
                                }
                            }
                        }

                        return false;
                    }
                    if (x === 8 && y === 8) {
                        sudoku.solutions.push([...JSON.parse(JSON.stringify(sudoku.value))]);
                    }
                }
            }
            return true;
        };
        solve();
        console.log(sudoku.solutions);
        return { ...sudoku };
    });
}

function validatePuzzle(setSudokuData: Function, timeElapsed) {
    setSudokuData(sudoku => {
        if (sudoku.value.filter(row => row.indexOf(0) !== -1).length === 0) {
            sudoku.possible = checkAllPossible(sudoku.value);
            if (sudoku.possible.filter(row => row.filter(col => col === false).length > 0).length > 0) {
                alert("That doesn't look right");
            } else {
                alert('well done!');
                setHighScores({
                    easy: sudoku.difficulty === 'easy' ? timeElapsed : 0,
                    medium: sudoku.difficulty === 'medium' ? timeElapsed : 0,
                    hard: sudoku.difficulty === 'hard' ? timeElapsed : 0,
                });
                sudoku.highscores = {
                    easy: sudoku.difficulty === 'easy' ? timeElapsed : 0,
                    medium: sudoku.difficulty === 'medium' ? timeElapsed : 0,
                    hard: sudoku.difficulty === 'hard' ? timeElapsed : 0,
                };
                // stop timer & Set record
            }
        }
        sudoku.value.map((row, x) => row.map((val, y) => {
            if (!val) {
                sudoku.errorColor[x][y] = 'rgba(222,136,124,0.75)';
            }
        }));
        sudoku.selected = Array(9).fill(undefined).map(() => Array(9).fill(false));
        sudoku.selectedFocus = [];

        return { ...sudoku };
    });
}

function getHighScores() {

    return JSON.parse(localStorage.getItem('sudoku-highscores'));
}

function setHighScores(highscores) {
    localStorage.setItem('sudoku-highscores', JSON.stringify(highscores));
}

// Handle History
function goBackInHistory(sudokuHistory: sudokuHistoryDataProps, setSudoku: Function) {
    setSudoku(sudoku => {
        if (sudoku.historyIndex >= 1) {
            sudoku.easyMode && (sudoku.possible = checkAllPossible(sudokuHistory[sudoku.historyIndex - 1].value));
            return {
                ...sudoku,
                ...JSON.parse(JSON.stringify(sudokuHistory[sudoku.historyIndex - 1])),
            };
        } else {
            return { ...sudoku };
        }
    });
}

function goForwardInHistory(sudokuHistory: sudokuHistoryDataProps, setSudoku: Function) {
    setSudoku(sudoku => {
        if (sudoku.historyIndex >= 0 && sudoku.historyIndex < sudokuHistory.length - 1) {
            sudoku.easyMode && (sudoku.possible = checkAllPossible(sudokuHistory[sudoku.historyIndex + 1].value));
            return {
                ...sudoku,
                ...JSON.parse(JSON.stringify(sudokuHistory[sudoku.historyIndex + 1])),
            };
        } else {
            return { ...sudoku };
        }
    });
}

function updateHistory(sudoku: sudokuDataProps, setSudokuHistoryData) {
    setSudokuHistoryData(sudokuHistory => {
        if (sudoku.historyIndex === sudokuHistory.length) {
            sudokuHistory.push(JSON.parse(JSON.stringify({ value: sudoku.value, historyIndex: sudoku.historyIndex })));
        } else {
            sudokuHistory.splice(sudoku.historyIndex, sudokuHistory.length);
            sudokuHistory.push(JSON.parse(JSON.stringify({ value: sudoku.value, historyIndex: sudoku.historyIndex })));
        }

        return [...sudokuHistory];
    });
    return sudoku.historyIndex + 1;
}

export const Sudoku: FC<sudokuProps> = ({ puzzle }) => {
    /*================ Hooks ================ */
    let [sudoku, setSudoku] = useState<sudokuDataProps>({
        fixed: Array(9).fill(undefined).map(() => Array(9).fill(false)),
        selected: Array(9).fill(undefined).map(() => Array(9).fill(false)),
        possible: Array(9).fill(undefined).map(() => Array(9).fill(true)),
        value: Array(9).fill(undefined).map(() => Array(9).fill(0)),
        pencilMarks: Array(9).fill(undefined).map(() => Array(9).fill(undefined).map(() => [])),
        color: Array(9).fill(undefined).map(() => Array(9).fill('')),
        errorColor: Array(9).fill(undefined).map(() => Array(9).fill('')),
        flagged: Array(9).fill(undefined).map(() => Array(9).fill(false)),
        easyMode: false,
        solutions: [],
        simpleSolvable: true,
        selectedFocus: [],
        difficulty: 'easy',
        highscores: { easy: 0, medium: 0, hard: 0 },
        historyIndex: 0,
    });
    let [sudokuHistory, setSudokuHistory] = useState<sudokuHistoryDataProps>([JSON.parse(JSON.stringify({
        value: sudoku.value,
        historyIndex: sudoku.historyIndex,
    }))]);
    let [activeControl, setActiveControls] = useState('value');
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [stopTimeElapsing, setStopTimeElapsing] = useInterval(() => {
        setTimeElapsed(timeElapsed + 1);
    }, 1000);

    const [colorArray, setColorArray] = useState([
        'transparent',
        '#1e3ff8',
        '#c6127b',
        '#ff5301',
        '#ffb401',
        '#73c200',
        '#00bbbc',
        '#fff',
        '#171717',
        '#1700a6',
    ]);

    let onKeyDown = useGlobalEvent('keydown');
    let grid = useRef();
    let { onMouseDown, onMouseUp, onMouseOver } = useMouseEvents(grid);

    /*================ Mouse Events ================*/
    onMouseOver(({ buttons, target: { dataset: { x, y } } }) => {
        if (buttons === 1 && x && y) {
            addToSelected([x, y], setSudoku);
        }
    });
    onMouseDown(({ shiftKey, buttons, target: { dataset: { x, y } } }) => {
        if (!shiftKey) clearSelected(setSudoku);
        if (buttons === 1 && x && y) addToSelected([x, y], setSudoku);
    });

    /*================ Keyboard Events ================*/
    onKeyDown((e) => {
        const { key, shiftKey, ctrlKey, altKey } = e;
        let lowerCaseKey = key.toLowerCase();
        console.log(lowerCaseKey);
        // Num Keys - Enter Value
        if (!ctrlKey && lowerCaseKey >= 1 && lowerCaseKey <= 9) {
            addValue(+lowerCaseKey, setSudoku, setSudokuHistory, timeElapsed);
        }
        // Delete - 0 - Backspace - Remove Value
        if (!ctrlKey && (lowerCaseKey === '0' || lowerCaseKey === 'numpad0' || lowerCaseKey === 'backspace' || lowerCaseKey === 'delete')) {
            clearValue(setSudoku);
        }
        // Ctrl + Num Keys - Enter Pencilmarks
        if (ctrlKey && lowerCaseKey >= 1 && lowerCaseKey <= 9) {
            e.preventDefault();
            togglePencilMarks(+lowerCaseKey, setSudoku);
        }
        // Ctrl + Delete - 0 - Backspace
        if (ctrlKey && (lowerCaseKey === '0' || lowerCaseKey === 'numpad0' || lowerCaseKey === 'backspace' || lowerCaseKey === 'delete')) {
            clearPencilMarks(setSudoku);
        }
        // Ctrl + z - UNDO
        if (ctrlKey && lowerCaseKey === 'z' && !shiftKey) {
            goBackInHistory(sudokuHistory, setSudoku);
        }
        // Ctrl + Shift + z or Ctrl + y - REDO
        if ((ctrlKey && lowerCaseKey === 'z' && shiftKey) || (ctrlKey && lowerCaseKey === 'y')) {
            goForwardInHistory(sudokuHistory, setSudoku);
        }
        // Escape - Clear selection
        if (lowerCaseKey === 'escape') {
            e.preventDefault();
            clearSelected(setSudoku);
        }
        // Navigation Selection - WASD - ArrowKeys + Possible SHIFT for multi select
        if (lowerCaseKey.indexOf('arrow') >= 0 || (lowerCaseKey === 'w' || lowerCaseKey === 'a' || lowerCaseKey === 's' || lowerCaseKey === 'd')) {
            if (sudoku.selectedFocus.length === 2) {

                switch (lowerCaseKey) {
                    case 'arrowup':
                    case 'w':
                        navigateFocus([-1, 0], setSudoku);
                        shiftKey || clearSelected(setSudoku);
                        addToSelected(sudoku.selectedFocus, setSudoku);
                        break;
                    case 'arrowdown':
                    case 's':
                        navigateFocus([1, 0], setSudoku);
                        shiftKey || clearSelected(setSudoku);
                        addToSelected(sudoku.selectedFocus, setSudoku);
                        break;
                    case 'arrowleft':
                    case 'a':
                        navigateFocus([0, -1], setSudoku);
                        shiftKey || clearSelected(setSudoku);
                        addToSelected(sudoku.selectedFocus, setSudoku);
                        break;
                    case 'arrowright':
                    case 'd':
                        navigateFocus([0, 1], setSudoku);
                        shiftKey || clearSelected(setSudoku);
                        addToSelected(sudoku.selectedFocus, setSudoku);
                        break;
                }
            } else {
                setSudoku({ ...sudoku, selectedFocus: [0, 0] });
                shiftKey || clearSelected(setSudoku);
                addToSelected([0, 0], setSudoku);
            }
        }
    });

    const onControlClick = ({ currentTarget: { dataset: { action, number, toggle } } }) => {
        action === 'value' && addValue(+number, setSudoku, setSudokuHistory, timeElapsed);
        action === 'pencilMarks' && togglePencilMarks(+number, setSudoku);
        action === 'color' && addColor(+number, setSudoku, colorArray);
        action === 'togglePencilMark' && togglePencilMarks(+number, setSudoku);
        action === 'DELETE' && clearValue(setSudoku) && clearColor(setSudoku) && clearPencilMarks(setSudoku);
        action === 'UNDO' && goBackInHistory(sudokuHistory, setSudoku);
        action === 'REDO' && goForwardInHistory(sudokuHistory, setSudoku);
        action === 'RESET' && hydrateSudoku(puzzle, setSudoku, setSudokuHistory, setTimeElapsed);
        action === 'TOGGLE' && setActiveControls(toggle);
        action === 'VALIDATE' && validatePuzzle(setSudoku, timeElapsed);
        if (action === 'MODE') {
            if (toggle === 'easy') {
                setSudoku({
                    ...sudoku,
                    easyMode: false,
                    possible: Array(9).fill(undefined).map(() => Array(9).fill(true)),
                });
            } else if (toggle === 'hard') {
                setSudoku({ ...sudoku, easyMode: true, possible: checkAllPossible(sudoku.value) });
            }
        }
        console.log(action);
    };

    useEffect(() => {
        window['cheating'] = () => solveSudoku(setSudoku);
        window['unCheat'] = () => unsolveSudoku(setSudoku);
        hydrateSudoku(puzzle, setSudoku, setSudokuHistory, setTimeElapsed);
    }, []);
    //onClick={() => solveSudoku(setSudoku)}

    useEffect(() => {
        sudoku.value.filter(row => row.indexOf(0) !== -1).length === 0 && validatePuzzle(setSudoku, timeElapsed);
    }, []);

    return (
        <div className="sudoku">
            <div className={`grid pencil-marks--${sudoku.easyMode}`}
                 ref={grid}>{/*onMouseDown={onSelectCells}*/}
                {sudoku.value.map((row, x) => row.map((value, y) => {
                    return <SudokuCell key={x + '' + y}
                                       x={x}
                                       y={y}
                                       focus={sudoku.selectedFocus[0] === x && sudoku.selectedFocus[1] === y}
                                       value={value}
                                       possible={sudoku.possible[x][y]}
                                       fixed={sudoku.fixed[x][y]}
                                       selected={sudoku.selected[x][y]}
                                       pencilMarks={sudoku.pencilMarks[x][y]}
                                       flagged={sudoku.flagged[x][y]}
                                       color={(sudoku.errorColor[x][y] ? sudoku.errorColor[x][y] : sudoku.color[x][y])}
                    />;
                }))}
            </div>
            <SudokuControls timeElapsed={timeElapsed} onControlClick={onControlClick} activeControl={activeControl}
                            easyMode={sudoku.easyMode} highscores={sudoku.highscores} />
        </div>
    );
};
