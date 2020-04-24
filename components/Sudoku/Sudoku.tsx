import React, { FC, useEffect, useState } from 'react';
import './Sudoku.scss';
import { useGlobalEvent, useMouseEvents } from 'beautiful-react-hooks';
import { SudokuCell } from './SudokuCell';

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

        return {
            ...sudoku,
        };
    });
};

export const Sudoku: FC<sudokuProps> = ({ puzzle }) => {
    /*================ Hooks ================*/
    let [sudoku, setSudoku] = useState<sudokuDataProps>({
        fixed: Array(9).fill(undefined).map(() => Array(9).fill(false)),
        selected: Array(9).fill(undefined).map(() => Array(9).fill(false)),
        value: Array(9).fill(undefined).map(() => Array(9).fill(0)),
        pencilMarks: Array(9).fill(undefined).map(() => Array(9).fill([])),
        color: Array(9).fill(undefined).map(() => Array(9).fill('')),
        flagged: Array(9).fill(undefined).map(() => Array(9).fill(false)),
        pencilMarksAlignment: 'corners',
    });

    let [keys, setKeys] = useState({ shiftKey: false, ctrlKey: false, altKey: false });
    let onKeyDown = useGlobalEvent('keydown');
    let onKeyUp = useGlobalEvent('keyup');

    /*const hydratePuzzle = (puzzle) => {
        setGrid(grid => {
            return grid.map((row, r) => row.map((cell, c) => ({
                    ...cell,
                    value: puzzle[r][c],
                    fixed: puzzle[r][c] > 0,
                }),
            ));
        });
        setTestGrid(puzzle);
        console.log(testGrid);
    };

    useEffect(() => {
        hydratePuzzle(puzzle);
    }, []);

    const updateTestGrid = ((value, x, y) => {
        setTestGrid(grid => {
            grid[x][y] = +value;
            return grid;
        });
        console.log(testGrid);
        return true;
    });

    /!*============================================================================
      # Key Events
        -
    ==============================================================================*!/
    let isDuplicate = (input) => input.reduce(function (acc, el, i, arr) {

        if (+el !== 0 && arr.indexOf(el) !== i && acc.indexOf(el) < 0) acc.push(+el);
        return acc;
    }, []) || false;

    onKeyDown((e) => {
        const { key, shiftKey, ctrlKey, altKey } = e;
        (shiftKey || ctrlKey || altKey) && setKeys({ shiftKey, ctrlKey, altKey });

        // Enter Value = NUM
        if (!ctrlKey && key >= 1 && key <= 9) {
            setGrid(grid => {
                return grid.map(row => {
                        return row.map(cell => {
                            const { fixed, value, selected, coordinates } = cell;
                            const [x, y] = coordinates;
                            return {
                                ...cell,
                                value: fixed ? value : selected ? updateTestGrid(+key, x, y) && +key : cell.value,
                            };
                        });
                    },
                );
            });
        }

        // Toggle PencilMarks = CTRL + NUM
        ctrlKey && key >= 1 && key <= 9 && setGrid(grid => {
            e.preventDefault();
            return grid.map(row => row.map(cell => ({
                    ...cell,
                    pencilMarks: cell.selected
                        ? cell.pencilMarks.indexOf(key) !== -1
                            ? cell.pencilMarks.splice(cell.pencilMarks.indexOf(key), 1) && cell.pencilMarks
                            : cell.pencilMarks.push(key) && cell.pencilMarks.sort() && cell.pencilMarks
                        : cell.pencilMarks,
                }),
            ));
        });
        // Remove Value = BACKSPACE || 0 || DELETE
        !ctrlKey && (key === '0' || key === 'Numpad0' || key === 'Backspace' || key === 'Delete') && setGrid(grid => {
            return grid.map(row => row.map(cell => {
                    const { fixed, value, selected, coordinates } = cell;
                    const [x, y] = coordinates;
                    return {
                        ...cell,
                        value: fixed ? value : selected ? updateTestGrid(undefined, x, y) && undefined : cell.value,
                    };
                },
            ));
        });
        // Remove PencilMarks = CTRL + BACKSPACE || 0 || DELETE
        ctrlKey && (key === '0' || key === 'Numpad0' || key === 'Backspace' || key === 'Delete') && setGrid(grid => {
            return grid.map(row => row.map(cell => ({
                    ...cell,
                    pencilMarks: cell.selected
                        ? []
                        : cell.pencilMarks,
                }),
            ));
        });
    });

    onKeyUp((e) => {
        e.preventDefault();
        const { shiftKey, ctrlKey, altKey } = e;
        setKeys({ shiftKey, ctrlKey, altKey });
    });

    /!*============================================================================
      # Selecting Cells
        -
    ==============================================================================*!/
    const clearSelection = () => {
        setGrid(grid => {
            return grid.map(row => row.map(cell => ({
                    ...cell,
                    selected: false,
                }),
            ));
        });
    };

    const onSelectCells = (gridEvent) => {
        let currentNode = gridEvent.currentTarget;
        console.log(gridEvent.target);
        keys.shiftKey || clearSelection();

        let [x, y] = gridEvent.target.attributes['data-coordinates']?.value.split(',').map(i => +i);
        setGrid(grid => {
            return grid.map(row => row.map(cell => ({
                    ...cell,
                    selected: cell.coordinates[0] === x && cell.coordinates[1] === y ? true : cell.selected,
                }),
            ));
        });

        /!*============================================================================
          # Mouse Events
            -
        ==============================================================================*!/
        const useMouseEvents = cellEvent => {
            let [x, y] = cellEvent.currentTarget.attributes['data-coordinates'].value.split(',').map(i => +i);
            setGrid(grid => {
                return grid.map(row => row.map(cell => ({
                        ...cell,
                        selected: cell.coordinates[0] === x && cell.coordinates[1] === y ? true : cell.selected,
                    }),
                ));
            });
            cellEvent.currentTarget.removeEventListener('mouseenter', useMouseEvents);
        };

        for (let i = 0; i < gridEvent.currentTarget.children.length; i++) {
            currentNode.children[i].addEventListener('mouseenter', useMouseEvents);
        }
        document.addEventListener('mouseup', () => {
            for (let i = 0; i < currentNode.children.length; i++) {
                currentNode.children[i].removeEventListener('mouseenter', useMouseEvents);
            }
        });
    };

    /!*============================================================================
      #Test Grid to be Correct
        -
    ==============================================================================*!/

    useEffect(() => {
        testGrid.forEach((row, rowIndex) => {
            let duplicate = isDuplicate(row);
            setGrid(grid => {
                grid[rowIndex] = grid[rowIndex].map(cell => {
                    return {
                        ...cell,
                        flag: duplicate.indexOf(cell.value) >= 0 || false,
                    };
                });
                return grid;
            });
        });
        testGrid.map((row, i) => row.map((cell, j) => testGrid[j][i])).forEach((invertedRow, i) => {
            console.log(isDuplicate(invertedRow), i, 'vertical');
        });
    });*/

    useEffect(() => hydrateSudoku(puzzle, setSudoku), []);

    return (
        <div className="sudoku">
            <div className={`grid pencil-marks--${sudoku.pencilMarksAlignment}`}>{/*onMouseDown={onSelectCells}*/}
                {sudoku.value.map((row, x) => row.map((value, y) => {
                    return <SudokuCell key={x + '' + y}
                                       x={x}
                                       y={y}
                                       value={value}
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