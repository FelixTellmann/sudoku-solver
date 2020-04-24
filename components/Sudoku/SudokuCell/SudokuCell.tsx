import React, { FC } from 'react';
import './SudokuCell.scss';

export type sudokuCellProps = {
    x: number
    y: number
    selected: boolean
    value: number
    pencilMarks: number[]
    color: string
    flagged: boolean
};

export const SudokuCell: FC<sudokuCellProps> = ({ x, y, selected, flagged, pencilMarks, value }) => {

    return (
        <div className={`cell ${selected ? 'selected' : ''} ${flagged ? 'flagged' : ''}`} data-coordinates={x + '' + y}>
            {
                value ? value :
                    pencilMarks.length ? (
                        <div className={`pencil-marks`}>
                            {
                                pencilMarks.map(m => {
                                    return <div key={m}
                                                className={`pencil-marks__number pencil-marks--${pencilMarks.length}`}>{m}</div>;
                                })
                            }
                        </div>
                    ) : null
            }
        </div>
    );
};