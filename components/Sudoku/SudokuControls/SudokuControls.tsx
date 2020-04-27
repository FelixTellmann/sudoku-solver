import React, { Fragment, FC } from 'react';
import './SudokuControls.scss';

function padTo2(num) {
    var s = '' + num;
    while (s.length < 2) {
        s = "0" + s;
    }
    return s;
}

export type sudokuControlProps = {
    timeElapsed: number
    onControlClick: Function
    activeControl: string
    easyMode: boolean
    highscores: {
        easy: number
        medium: number
        hard: number
    }
};

export const SudokuControls: FC<sudokuControlProps> = ({ timeElapsed, onControlClick, activeControl, easyMode, highscores: {easy, medium, hard} }) => {
    let counter = 1;
    return (
        <div>
            <div className="status-bar">
                <div className="timer">Time &nbsp;&nbsp; {`${padTo2(~~(timeElapsed / 60))}:${padTo2(~~(timeElapsed % 60))}`}</div>
                <div className="best-time">Highscores: &nbsp;&nbsp;&nbsp;
                    <span className="best-time--easy">{`${padTo2(~~(easy / 60))}:${padTo2(~~(easy % 60))}`}</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="best-time--medium">{`${padTo2(~~(medium / 60))}:${padTo2(~~(medium % 60))}`}</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="best-time--hard">{`${padTo2(~~(hard / 60))}:${padTo2(~~(hard % 60))}`}</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                </div>

            </div>
            <div className="controls">
                <div className="controls__set">
                    <button onClick={(e) => onControlClick(e)}
                            className={`button ${activeControl === 'value' ? 'selected' : ''}`}
                            data-action="TOGGLE" data-toggle="value">Normal
                    </button>
                    <button onClick={(e) => onControlClick(e)}
                            className={`button ${activeControl === 'color' ? 'selected' : ''}`}
                            data-action="TOGGLE" data-toggle="color">Color
                    </button>
                    <button onClick={(e) => onControlClick(e)}
                            className={`button ${activeControl === 'pencilMarks' ? 'selected' : ''}`}
                            data-action="TOGGLE" data-toggle="pencilMarks">Mark
                    </button>
                    <button onClick={(e) => onControlClick(e)} className={`button`}
                            data-action="MODE" data-toggle={easyMode ? 'easy' : 'hard'}>{easyMode ? 'Hard' : 'Easy'}
                    </button>
                </div>
                <div className="controls__set">
                    {

                        Array(3).fill(0).map((x, i) => {
                            return (
                                <div key={i} className="numbers__set">
                                    {
                                        Array(3).fill(0).map(() => {
                                            return (
                                                <div key={counter - 1} onClick={(e) => onControlClick(e)}
                                                     className={`button button--input button--${activeControl}`}
                                                     data-action={activeControl}
                                                     data-number={counter}><span>{counter++}</span>
                                                </div>
                                            );
                                        })
                                    }
                                </div>
                            );
                        })
                    }

                    <button onClick={(e) => onControlClick(e)}
                            className="button button--wide"
                            data-action="DELETE">Delete
                    </button>
                </div>
                <div className="controls__set">
                    <button onClick={(e) => onControlClick(e)} className="button" data-action="UNDO">Undo</button>
                    <button onClick={(e) => onControlClick(e)} className="button" data-action="REDO">Redo</button>
                    <button onClick={(e) => onControlClick(e)} className="button" data-action="RESET">Restart</button>
                    <button onClick={(e) => onControlClick(e)} className="button" data-action="VALIDATE">VALIDATE</button>
                </div>
            </div>
            <div className="new-game">
                <h2>New Game?</h2>
                <hr />
                <div className="new-game__set">
                    <button onClick={(e) => onControlClick(e)} className="button button--easy">Easy</button>
                    <button onClick={(e) => onControlClick(e)} className="button button--medium">Medium</button>
                    <button onClick={(e) => onControlClick(e)} className="button button--hard">Hard</button>
                </div>
            </div>
        </div>
    );
};