import React, { FC } from 'react';
import { Sudoku } from 'components/Sudoku';

const Index: FC = () => {

    return (
        <Sudoku puzzle={[
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
        ]} />
    );
};
/*
* [
                [2, 4, 5, 6, 7, 8, 3, 9, 1],
                [6, 8, 3, 4, 9, 1, 7, 2, 5],
                [9, 1, 7, 2, 3, 5, 8, 4, 6],
                [8, 2, 6, 3, 4, 9, 1, 5, 7],
                [1, 5, 9, 7, 8, 2, 4, 6, 3],
                [7, 3, 4, 1, 5, 6, 9, 8, 2],
                [5, 6, 8, 9, 1, 3, 2, 7, 4],
                [3, 7, 2, 8, 6, 4, 5, 0, 9],
                [4, 9, 1, 5, 2, 7, 6, 3, 8],
            ]*/

export default Index;