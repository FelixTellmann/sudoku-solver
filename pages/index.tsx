import React, { FC } from 'react';
import { Sudoku } from 'components/Sudoku';

const Index: FC = () => {

    return (
        <Sudoku puzzle={[
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 8, 0, 0, 0, 0, 7, 2, 5],
            [0, 0, 0, 0, 0, 0, 8, 4, 0],
            [0, 0, 0, 3, 0, 0, 0, 5, 0],
            [1, 0, 0, 7, 0, 2, 0, 0, 0],
            [0, 3, 0, 1, 0, 6, 9, 0, 0],
            [5, 6, 0, 0, 0, 3, 0, 0, 4],
            [0, 0, 2, 0, 0, 4, 0, 1, 0],
            [0, 9, 0, 0, 0, 7, 6, 0, 0],
        ]} />
    );
};

export default Index;