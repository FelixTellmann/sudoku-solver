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
    fixed: boolean
};

export const SudokuCell: FC<sudokuCellProps> = ({ x, y, selected, flagged, pencilMarks, value, fixed }) => {

    return (
        <div className={`cell ${selected ? 'selected' : ''} ${flagged ? 'flagged' : ''} ${fixed ? 'fixed' : ''}`} data-x={x} data-y={y}>
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