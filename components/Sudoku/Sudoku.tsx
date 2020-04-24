import React, { FC, useEffect, useState, useRef, MouseEvent } from 'react';
import './Sudoku.scss';
import { useGlobalEvent, useMouseEvents } from 'beautiful-react-hooks';
import { SudokuCell } from './SudokuCell';
import { loadGetInitialProps } from "next/dist/next-server/lib/utils";
import { is } from "@babel/types";

type sudokuProps = {
    puzzle: number[][];
}
type sudokuDataProps = {
    fixed: boolean[][],
    selected: boolean[][],
    value: number[][],
    pencilMarks: number[][][],
    color: string[][],
    flagged: boolean[][],
    pencilMarksAlignment: 'corners' | 'center',
}
const hydrateSudoku = (puzzle, setSudokuData) => {
    setSudokuData(sudoku => {
        puzzle.forEach((row, x) => {
            row.forEach((num, y) => {
                sudoku.fixed[x][y] = !!num;
                sudoku.value[x][y] = num;
            });
        });
        return { ...sudoku };
    });
};

const clearSelected = (setSudokuData) => {
    setSudokuData(sudoku => {
        return {
            ...sudoku,
            selected: Array(9).fill(undefined).map(() => Array(9).fill(false)),
        };
    });
};

const addToSelected = ([x, y], setSudokuData) => {
    setSudokuData(sudoku => {
        sudoku.selected[x][y] = true;
        return { ...sudoku };
    });
};

const addValueToSelected = (num, setSudokuData) => {
    setSudokuData(sudoku => {
        sudoku.selected.forEach((row, x) => {
            row.forEach((isSelected, y) => {
                isSelected && !sudoku.fixed[x][y] && (sudoku.value[x][y] = num);
            });
        });
        return { ...sudoku };
    });

};

const clearValueFromSelected = (setSudokuData) => {
    setSudokuData(sudoku => {
        sudoku.selected.forEach((row, x) => {
            row.forEach((isSelected, y) => {
                isSelected && !sudoku.fixed[x][y] && (sudoku.value[x][y] = 0);
            });
        });
        return { ...sudoku };
    });
};

const togglePencilMarksOnSelected = (num, setSudokuData) => {
    setSudokuData(sudoku => {
        sudoku.selected.forEach((row, x) => {
            row.forEach((isSelected, y) => {
                if (isSelected && !sudoku.fixed[x][y]) {
                    sudoku.pencilMarks[x][y].indexOf(num) >= 0
                        ? sudoku.pencilMarks[x][y].splice(sudoku.pencilMarks[x][y].indexOf(num), 1)
                        : sudoku.pencilMarks[x][y].push(num) && sudoku.pencilMarks[x][y].sort();
                }
            });
        });
        return { ...sudoku };
    });
};

const clearPencilMarksFromSelected = (setSudokuData) => {
    setSudokuData(sudoku => {
        sudoku.selected.forEach((row, x) => {
            row.forEach((isSelected, y) => {
                isSelected && !sudoku.fixed[x][y] && (sudoku.pencilMarks[x][y] = []);
            });
        });
        return { ...sudoku };
    });
};

const isPossible = ([x, y], num, sudokuData) => {

    for (let i = 0; i < 9; i++) {
        if (sudokuData.value[x][i] === num) {
            return false;
        }

        if (sudokuData.value[i][y] === num) {
            return false;
        }
    }

    for (let i = ~~((x / 3) + 1) * 3 - 3; i < ~~((x / 3) + 1) * 3; i++) {
        for (let j = ~~((y / 3) + 1) * 3 - 3; j < ~~((y / 3) + 1) * 3; j++) {
            if (sudokuData.value[i][j] === num) {
                return false;
            }
        }
    }

    return true;
};

const calcOneAtATime = (sudoku) => {
    let possibles = Array(9).fill(undefined).map(() => Array(9).fill(undefined).map(() => []));
    for (let x = 0; x < 9; x++) {
        for (let y = 0; y < 9; y++) {
            if (+sudoku.value[x][y] === 0) {
                for (let i = 1; i < 10; i++) {
                    if (isPossible([x, y], i, sudoku)) {
                        possibles[x][y].push(i);
                    }
                }
            }
        }
    }
    for (let x = 0; x < 9; x++) {
        for (let y = 0; y < 9; y++) {
            if (possibles[x][y].length === 1) {
                sudoku.value[x][y] = possibles[x][y][0];
                x = 10;
                y = 10;
                break;
            }
        }
    }
    console.log(sudoku.value.filter(row => row.indexOf(0) >= 0 ))
    /*
    sudoku.value.filter(row => row.indexOf(0) >= 0 ).length && calcOneAtATime(sudoku)*/
};

const solveSudoku = (setSudokuData) => {
    let possibles = Array(9).fill(undefined).map(() => Array(9).fill(undefined).map(() => []));

    setSudokuData(sudoku => {

        calcOneAtATime(sudoku);



        return { ...sudoku };
    });
};

export const Sudoku: FC<sudokuProps> = ({ puzzle }) => {
    /*================ Hooks ================*/
    let [sudoku, setSudoku] = useState<sudokuDataProps>({
        fixed: Array(9).fill(undefined).map(() => Array(9).fill(false)),
        selected: Array(9).fill(undefined).map(() => Array(9).fill(false)),
        value: Array(9).fill(undefined).map(() => Array(9).fill(0)),
        pencilMarks: Array(9).fill(undefined).map(() => Array(9).fill(undefined).map(() => [])),
        color: Array(9).fill(undefined).map(() => Array(9).fill('')),
        flagged: Array(9).fill(undefined).map(() => Array(9).fill(false)),
        pencilMarksAlignment: 'corners',
    });

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
        console.log(key);

        if (!ctrlKey && key >= 1 && key <= 9) addValueToSelected(+key, setSudoku);

        if (!ctrlKey && (key === '0' || key === 'Numpad0' || key === 'Backspace' || key === 'Delete')) clearValueFromSelected(setSudoku);

        // Toggle PencilMarks = CTRL + NUM
        if (ctrlKey && key >= 1 && key <= 9) {
            e.preventDefault();
            togglePencilMarksOnSelected(+key, setSudoku);
        }
        if (ctrlKey && (key === '0' || key === 'Numpad0' || key === 'Backspace' || key === 'Delete')) clearPencilMarksFromSelected(setSudoku);

        if (key === 'Escape') {
            e.preventDefault();
            clearSelected(setSudoku);
        }
    });

    useEffect(() => hydrateSudoku(puzzle, setSudoku), []);

    return (
        <div className="sudoku" onClick={() => solveSudoku(setSudoku)}>
            <div className={`grid pencil-marks--${sudoku.pencilMarksAlignment}`}
                 ref={grid}>{/*onMouseDown={onSelectCells}*/}
                {sudoku.value.map((row, x) => row.map((value, y) => {
                    return <SudokuCell key={x + '' + y}
                                       x={x}
                                       y={y}
                                       value={value}
                                       fixed={sudoku.fixed[x][y]}
                                       selected={sudoku.selected[x][y]}
                                       pencilMarks={sudoku.pencilMarks[x][y]}
                                       flagged={sudoku.flagged[x][y]}
                                       color={sudoku.color[x][y]} />;
                }))}
            </div>
        </div>
    );
};

export default Sudoku;