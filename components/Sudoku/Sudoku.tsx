import React, { FC, useEffect, useRef, useState } from 'react';
import './Sudoku.scss';
import { useGlobalEvent, useMouseEvents, useInterval } from 'beautiful-react-hooks';
import { SudokuCell } from './SudokuCell';
import { SudokuControls } from "./SudokuControls";
/*
*  TODO:
 - Control Dashboard
 - Color Highlighting
 - Documentation - Blog Post
 - Leaderboard
 - Timer
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
    flagged: boolean[][],
    pencilMarksAlignment: 'corners' | 'center',
    simpleSolvable: boolean,
    historyIndex: number,
}

type sudokuHistoryDataProps = sudokuDataProps[]

// Initialize Sudoku
function hydrateSudoku(puzzle: number[][], setSudokuData: Function, setSudokuHistory: Function, setTimeElapsed: Function) {
    setSudokuData(sudoku => {
        sudoku = {
            fixed: Array(9).fill(undefined).map(() => Array(9).fill(false)),
            selected: Array(9).fill(undefined).map(() => Array(9).fill(false)),
            possible: Array(9).fill(undefined).map(() => Array(9).fill(true)),
            value: Array(9).fill(undefined).map(() => Array(9).fill(0)),
            pencilMarks: Array(9).fill(undefined).map(() => Array(9).fill(undefined).map(() => [])),
            color: Array(9).fill(undefined).map(() => Array(9).fill('')),
            flagged: Array(9).fill(undefined).map(() => Array(9).fill(false)),
            pencilMarksAlignment: 'corners',
            simpleSolvable: true,
            selectedFocus: [],
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
function addValue(num: number, setSudokuData: Function, setSudokuHistoryData: Function) {
    setSudokuData(sudoku => {
        sudoku.selected.forEach((row, x) => {
            row.forEach((isSelected, y) => {
                if (isSelected && !sudoku.fixed[x][y]) {
                    sudoku.value[x][y] = num;
                }
            });
        });
        sudoku.possible = checkAllPossible(sudoku.value);
        sudoku.historyIndex = updateHistory(sudoku, setSudokuHistoryData);
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
        sudoku.possible = checkAllPossible(sudoku.value);
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
};

// Handle History
function goBackInHistory(sudokuHistory: sudokuHistoryDataProps, setSudoku: Function) {
    setSudoku(sudoku => {
        if (sudoku.historyIndex >= 1) {
            return {
                ...sudoku,
                ...JSON.parse(JSON.stringify(sudokuHistory[sudoku.historyIndex - 1])),
                possible: checkAllPossible(sudokuHistory[sudoku.historyIndex - 1].value),
            };
        } else {
            return { ...sudoku };
        }
    });
}

function goForwardInHistory(sudokuHistory: sudokuHistoryDataProps, setSudoku: Function) {
    setSudoku(sudoku => {
        if (sudoku.historyIndex >= 0 && sudoku.historyIndex < sudokuHistory.length - 1) {
            return {
                ...sudoku,
                ...JSON.parse(JSON.stringify(sudokuHistory[sudoku.historyIndex + 1])),
                possible: checkAllPossible(sudokuHistory[sudoku.historyIndex + 1].value),
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
        flagged: Array(9).fill(undefined).map(() => Array(9).fill(false)),
        pencilMarksAlignment: 'corners',
        simpleSolvable: true,
        selectedFocus: [],
        historyIndex: 0,
    });
    let [sudokuHistory, setSudokuHistory] = useState<sudokuHistoryDataProps>([JSON.parse(JSON.stringify({
        value: sudoku.value,
        historyIndex: sudoku.historyIndex,
    }))]);
    let [activeControl, setActiveControls] = useState('value');

    const [timeElapsed, setTimeElapsed] = useState(0);
// count every second
    const [stopTimeElapsing, setStopTimeElapsing] = useInterval(() => {
        setTimeElapsed(timeElapsed + 1);
    }, 1000);

    let onKeyDown = useGlobalEvent('keydown');
    let onKeyUp = useGlobalEvent('keyup');
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
            addValue(+lowerCaseKey, setSudoku, setSudokuHistory);
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
        if (lowerCaseKey === 'Escape') {
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
        action === 'value' && addValue(+number, setSudoku, setSudokuHistory);
        action === 'pencilMarks' && togglePencilMarks(+number, setSudoku);
        action === 'color' && addValue(+number, setSudoku, setSudokuHistory);
        action === 'togglePencilMark' && togglePencilMarks(+number, setSudoku);
        action === 'DELETE' && clearValue(setSudoku) && clearPencilMarks(setSudoku);
        action === 'UNDO' && goBackInHistory(sudokuHistory, setSudoku);
        action === 'REDO' && goForwardInHistory(sudokuHistory, setSudoku);
        action === 'RESET' && hydrateSudoku(puzzle, setSudoku, setSudokuHistory, setTimeElapsed);
        action === 'TOGGLE' && setActiveControls(toggle);
        console.log(action);
    };

    useEffect(() => hydrateSudoku(puzzle, setSudoku, setSudokuHistory, setTimeElapsed), []);
    //onClick={() => solveSudoku(setSudoku)}

    return (
        <div className="sudoku">
            <div className={`grid pencil-marks--${sudoku.pencilMarksAlignment}`}
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
                                       color={sudoku.color[x][y]} />;
                }))}
            </div>
            <SudokuControls timeElapsed={timeElapsed} onControlClick={onControlClick} activeControl={activeControl} />
        </div>
    );
};
