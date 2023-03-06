# tsgammon-core
A Backgammon library for Typescript, formerly developed as a part of tsgammon-ui

[![npm version](https://badge.fury.io/js/tsgammon-core.svg)](https://badge.fury.io/js/tsgammon-core)
[![tkshio](https://circleci.com/gh/tkshio/tsgammon-core.svg?style=shield)](https://circleci.com/gh/tkshio/tsgammon-core)

## demo
````
$ npm install tsgammon-core
$ npm exec tsgammon-core -- -b

...
(snip)
...

red: Roll 54 Moves 23/Off

 tsgammon        Position ID: AAAATt4fAAAAAA

 +13-14-15-16-17-18------19-20-21-22-23-24-+   
 |                  |   |                  |OOO
 |                  |   |                  |OOO
 |                  |   |                  |OOO
 |                  |   |                  |OOO
 |                  |   |                  |OOO
^|                  |BAR|                  |   
 |                  |   | 7                |   
 |                  |   | X  X             |   
 |                  |   | X  X           X |   
 |                  |   | X  X           X |   
 |                  |   | X  X     X     X |   
 +12-11-10--9--8--7-------6--5--4--3--2--1-+   
Red wins 2 pt. by Gammon
Result: red 2 - white 0
$
````


## usage

setup:
```typescript
const rootNode:BoardStateNodeRoot = boardStateNodeFromArray(
    [
        0, // your bar point
        2,0,0,0,0,-5, 0,-3,0,0,0,5,
        -5,0,0,0,3,0,5,0,0,0,0,-2,
        0, // opponents bar point
    ],
    1,3 // dice
)
// or:
// = boardStateNode(boardState(),diceRoll(1,3))
```

list up moves:
```typescript
const candidates: Move[][] = collectMoves(rootNode)
    .filter(moves => !moves.isRedundant)
    .map(moves => moves.moves)

candidates.map(moves => console.log(moves.map(move=>formatMove(move))))

// [ '1/4', '1/2' ]
// [ '1/4', '4/5' ]
// [ '1/4', '17/18' ]
// [ '1/4', '19/20' ]
// ...
```

or list up as nodes:
```typescript
// each node corresponds to the position after moves[n]
const nodes:BoardStateNodes[] = collectNodes(rootNode)

// nodes[0] corresponds to moves[0] (=[1/4, 1/2])
const nodeAfterMove = nodes[0]

// turn board for next player
const nextBoardState = nodeAfterMove.board.revert()

// build node again, with roll(52)
const nextNodeToPlay = boardStateNode(nextBoardState,diceRoll(5,2))

```

test whether pieces on a point is moveble:
```typescript
const nodeAfterMove14 = findMove(node, 1, false/* use first pip(=1) */)
// returns position after move [1/4]
console.log(nodeAfterMove14.hasValue) // true

const nodeAfterMove12 = findMove(node, 1, true/* use second pip(=3) */)
// returns position after move [1/2]
console.log(nodeAfterMove12.hasValue) // true

const nodeAfterMove23 = findMove(node, 2, true)
// there is no piece on point[2], so you can't move it
console.log(nodeAfterMove23.hasValue) // false
```

use jgammon's evaluator:
```typescript
import { simpleNNEngine, evaluate } from "tsgammon_core/engines/SimpleNNGammon"

// let SimpleNNGammon play
const nodeAfterMove = simpleNNEngine.checkerPlay(node)
console.log(formatMoves(nodeAfterMove.lastMoves()))

// [ '17/20', '19/20' ]

// show evaluation
console.log(evaluate(node.board))

// {
//  e: 0.013857996981876702,
//  myWin: 0.5195381529700068,
//  myGammon: 0.13486295689906583,
//  oppWin: 0.48047063702629805,
//  oppGammon: 0.16007247586089787
//}
```

## License

Apache 2.0 license.

## Change logs


2022/8/3 version 0.3.0

- migrates some code from tsgammon-ui
- some incompatible updates to APIs


2022/4/9 version 0.2.0

- supports Position ID, FIBS format
- refactored BoardState
- added bin/index.ts for demo
- set up some configurations for C.I.


2022/3/29 version 0.1.0

- Initial release: separated from tsgammon-ui

