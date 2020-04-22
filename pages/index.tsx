import React, { useState } from 'react';
import './index.scss';

function Index(ctx) {

  let [grid, setGrid] = useState(Array(9).fill(Array(9).fill(0)));
  console.log(grid);
  return (
    <div className="sudoku">
      <div className="sudoku__grid">
        {grid.map(row => row.map(col => <div className="sudoku__grid__item">{col}</div>))}
      </div>
    </div>
  );
}

Index.getInitialProps = async ctx => {
  return {};
};

export default Index;