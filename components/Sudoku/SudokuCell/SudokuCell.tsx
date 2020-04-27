import React, { FC } from 'react';
import './SudokuCell.scss';

export type sudokuCellProps = {
    x: number
    y: number
    selected: boolean
    value: number
    pencilMarks: number[]
    color: string
    flagged: boolean,
    fixed: boolean,
    focus: boolean
    possible: boolean
};

export const SudokuCell: FC<sudokuCellProps> = ({ x, y, selected, flagged, pencilMarks, value, fixed, focus, possible, color }) => {
    const backgroundColor = color ? { backgroundColor: color, filter: 'brightness(1.3)' } : {};
    return (
        <div className={`cell ${selected ? 'selected' : ''} ${flagged ? 'flagged' : ''} ${fixed ? 'fixed' : ''} ${focus
            ? 'focus'
            : ''} ${!possible ? 'incorrect' : ''}`} data-x={x} data-y={y} style={backgroundColor}>
            {
                value ? value :
                    pencilMarks.length ? (
                        <div className={`pencil-marks`} data-x={x} data-y={y}>
                            {
                                pencilMarks.map(m => {
                                    return <div key={x + '' + y + '' + m} data-x={x} data-y={y}
                                                className={`pencil-marks__number pencil-marks--${pencilMarks.length}`}>{m}</div>;
                                })
                            }
                        </div>
                    ) : null
            }
        </div>
    );
};